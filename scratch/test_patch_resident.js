async function testPatchResident() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  
  // Register/login admin user
  const adminUser = {
    username: 'admin_patch_' + Math.floor(Math.random() * 1000),
    password: 'adminPassword123!',
    email: 'admin_patch@gmail.com',
    role: 'admin'
  };

  try {
    console.log(`Registering admin...`);
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminUser)
    });

    if (!regRes.ok) {
      console.log('Register failed (probably rate-limited). Let\'s try logging in directly if user exists.');
      // If we can't register, we'll try to find a user or wait.
      // Wait, let's see if we can login.
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
    if (!token) {
      console.log('Login failed.');
      return;
    }

    console.log('Fetching residents...');
    const resList = await fetch('http://172.20.32.62:3333/admin/resident', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const residents = await resList.json();
    console.log(`Found ${residents.length} residents.`);
    if (residents.length === 0) {
      console.log('No residents to patch.');
      return;
    }

    const firstResident = residents[0];
    const residentId = firstResident.family_id || firstResident.id;
    console.log(`Patching resident ID: ${residentId}...`);

    const patchRes = await fetch(`http://172.20.32.62:3333/admin/resident/${residentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        noKK: '3201234567890999'
      })
    });

    console.log(`Patch status: ${patchRes.status}`);
    const patchData = await patchRes.json();
    console.log('Patch response:', JSON.stringify(patchData));

  } catch (err) {
    console.error('Error:', err);
  }
}

testPatchResident();
