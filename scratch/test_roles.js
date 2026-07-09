async function testRoles() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  const targetUrl = 'http://172.20.32.62:3333/admin/resident';

  const roles = ['rt', 'RT', 'admin', 'ADMIN', 'warga', 'Warga'];

  for (const role of roles) {
    const testUser = {
      username: 'user_' + role.toLowerCase() + '_' + Math.floor(Math.random() * 1000),
      password: 'wargaPassword123!',
      email: 'user_' + role.toLowerCase() + '@gmail.com',
      role: role
    };

    try {
      console.log(`--- Testing Role: ${role} ---`);
      const regRes = await fetch(registUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      if (!regRes.ok) {
        console.log(`Register failed for ${role}`);
        continue;
      }

      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      const loginData = await loginRes.json();
      const token = loginData.token;
      if (!token) {
        console.log(`Login failed for ${role}`);
        continue;
      }

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`GET resident Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response:`, text.substring(0, 300));
    } catch (err) {
      console.error(`Error for role ${role}:`, err.message);
    }
  }
}

testRoles();
