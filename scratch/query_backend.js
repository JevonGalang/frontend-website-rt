async function queryBackend() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  
  // Register an admin user
  const adminUser = {
    username: 'admin_' + Math.floor(Math.random() * 10000),
    password: 'adminPassword123!',
    email: 'admin_test@gmail.com',
    role: 'admin'
  };

  try {
    console.log(`Registering admin: ${adminUser.username}...`);
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminUser)
    });
    console.log(`Register status: ${regRes.status}`);

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

    const endpoints = [
      { name: 'GET resident', url: 'http://172.20.32.62:3333/admin/resident' },
      { name: 'GET house', url: 'http://172.20.32.62:3333/admin/house' },
      { name: 'GET datawarga', url: 'http://172.20.32.62:3333/admin/datawarga' },
    ];

    for (const ep of endpoints) {
      console.log(`--- Querying ${ep.name} ---`);
      const res = await fetch(ep.url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response (first 600 chars):`, text.substring(0, 600));
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

queryBackend();
