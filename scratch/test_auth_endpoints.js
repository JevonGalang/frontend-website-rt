async function testAuth() {
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  const targetUrl = 'http://172.20.32.62:3333/admin/resident';

  try {
    console.log('Logging in to get a token...');
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });

    console.log(`Login status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData));

    if (!loginRes.ok) {
      console.error('Login failed.');
      return;
    }

    const token = loginData.token;
    if (!token) {
      console.error('No token returned from login.');
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
    console.error('General error:', err);
  }
}

testAuth();
