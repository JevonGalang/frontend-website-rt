async function registerFixed() {
  const registUrl = 'http://172.20.32.62:3333/post/regist';
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  
  const testUser = {
    username: 'fixed_admin_' + Math.floor(Math.random() * 1000),
    password: 'adminPassword123!',
    email: 'fixed_admin@gmail.com',
    role: 'admin'
  };

  try {
    console.log(`Registering: ${testUser.username}...`);
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    console.log(`Status: ${regRes.status}`);
    const regData = await regRes.text();
    console.log(`Response:`, regData);

    if (regRes.ok) {
      console.log(`Logging in...`);
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });
      const loginData = await loginRes.json();
      console.log(`Token:`, loginData.token);
    }
  } catch (err) {
    console.error(err);
  }
}

registerFixed();
