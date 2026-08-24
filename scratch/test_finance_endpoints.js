async function testFinance() {
  const registUrl = 'http://172.20.32.31:3333/post/debug-regist';
  const loginUrl = 'http://172.20.32.31:3333/post/login';
  
  const username = 'bendahara_' + Math.floor(Math.random() * 10000);
  const password = 'Password123!';
  const bendaharaUser = {
    username,
    password,
    email: username + '@gmail.com',
    role: 'bendahara'
  };

  try {
    const regRes = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bendaharaUser)
    });
    console.log('Debug regist status:', regRes.status);

    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Bendahara token:', token ? 'OK' : 'Failed', loginData);

    if (token) {
      // Test GET tracking
      const trackRes = await fetch('http://172.20.32.31:3333/admin/finance/tracking?month=8&year=2026', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('GET tracking status:', trackRes.status);
      const trackData = await trackRes.json();
      console.log('GET tracking data:', JSON.stringify(trackData, null, 2));

      // Test POST manual-payment for family_id 1
      const manualRes = await fetch('http://172.20.32.31:3333/admin/finance/manual-payment', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          family_id: 1,
          jenis_iuran: 'ipl',
          amount: 200000,
          month: 8,
          year: 2026,
          payment_date: '2026-08-19'
        })
      });
      console.log('POST manual-payment status:', manualRes.status);
      const manualData = await manualRes.json();
      console.log('POST manual-payment response:', JSON.stringify(manualData, null, 2));

      // Test GET tracking again to see if family_id 1 is updated
      const trackRes2 = await fetch('http://172.20.32.31:3333/admin/finance/tracking?month=8&year=2026', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('GET tracking data after manual payment:', JSON.stringify(await trackRes2.json(), null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testFinance();
