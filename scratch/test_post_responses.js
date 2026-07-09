async function testPostFlow() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  
  const adminUser = {
    username: 'admin_test_flow_' + Math.floor(Math.random() * 1000),
    password: 'adminPassword123!',
    email: 'admin_test_flow@gmail.com',
    role: 'admin'
  };

  try {
    console.log(`Registering: ${adminUser.username}...`);
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminUser)
    });
    console.log(`Register status: ${regRes.status}`);
    if (!regRes.ok) {
      console.log('Failed to register. Maybe rate-limited.');
      return;
    }

    console.log(`Logging in...`);
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: adminUser.username,
        password: adminUser.password
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`Token obtained: ${token ? 'YES' : 'NO'}`);
    if (!token) return;

    // Step 1: POST /admin/house
    console.log('Sending Step 1: POST /admin/house...');
    const houseRes = await fetch('http://172.20.32.62:3333/admin/house', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        blok: 'B',
        nomor: 15,
        alamat: 'Jl. Melati No. 15',
        status: 'pribadi'
      })
    });
    const houseData = await houseRes.json();
    console.log('Step 1 Response:', JSON.stringify(houseData));

    let house_id = null;
    if (houseData.output?.pesan) {
      if (Array.isArray(houseData.output.pesan)) {
        house_id = houseData.output.pesan[0]?.insertId;
      } else {
        house_id = houseData.output.pesan.insertId;
      }
    }
    console.log(`Extracted house_id: ${house_id}`);
    if (!house_id) return;

    // Step 2: POST /admin/resident
    console.log('Sending Step 2: POST /admin/resident...');
    const residentRes = await fetch('http://172.20.32.62:3333/admin/resident', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        noKK: '3201234567891234',
        home: house_id,
        KepalaKeluarga: 1
      })
    });
    const residentData = await residentRes.json();
    console.log('Step 2 Response:', JSON.stringify(residentData));

    let family_id = null;
    if (residentData.output?.pesan) {
      if (Array.isArray(residentData.output.pesan)) {
        family_id = residentData.output.pesan[0]?.insertId;
      } else {
        family_id = residentData.output.pesan.insertId;
      }
    }
    console.log(`Extracted family_id: ${family_id}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

testPostFlow();
