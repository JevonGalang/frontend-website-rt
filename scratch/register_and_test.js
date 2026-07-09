async function testRegisterAndLogin() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  const targetUrl = 'http://172.20.32.62:3333/admin/resident';

  const testUser = {
    username: 'adminwarga' + Math.floor(Math.random() * 1000),
    password: 'wargaPassword123!',
    email: 'adminwarga@gmail.com',
    role: 'rt' // try registering as rt
  };

  try {
    console.log(`Registering user: ${testUser.username}...`);
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    console.log(`Register status: ${regRes.status}`);
    const regData = await regRes.text();
    console.log('Register response:', regData);

    console.log(`Logging in user: ${testUser.username}...`);
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    console.log(`Login status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData));

    const token = loginData.token;
    if (!token) {
      console.error('No token returned.');
      return;
    }

    const testHeaders = [
      { name: 'Bearer in Authorization', headers: { 'Authorization': `Bearer ${token}` } },
      { name: 'Token only in Authorization', headers: { 'Authorization': token } },
      { name: 'Token in custom header token', headers: { 'token': token } },
      { name: 'Token in custom header x-access-token', headers: { 'x-access-token': token } },
      { name: 'Token in custom header Authorization (raw)', headers: { 'authorization': token } },
    ];

    for (const test of testHeaders) {
      console.log(`--- Testing: ${test.name} ---`);
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          headers: test.headers
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response:`, text.substring(0, 300));
      } catch (err) {
        console.error(`Error with ${test.name}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

testRegisterAndLogin();
