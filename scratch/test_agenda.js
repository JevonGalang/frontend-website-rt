const registUrl = 'http://172.20.32.62:3333/post/debug-regist';
const loginUrl = 'http://172.20.32.62:3333/post/login';

async function runTests() {
  try {
    const suffix = Math.floor(Math.random() * 10000);
    const rtUser = {
      username: `rt_test_${suffix}`,
      password: 'rtPassword123!',
      email: `rt_${suffix}@gmail.com`,
      role: 'rt'
    };

    const wargaUser = {
      username: `warga_test_${suffix}`,
      password: 'wargaPassword123!',
      email: `warga_${suffix}@gmail.com`,
      role: 'warga'
    };

    // 1. Register RT
    console.log('Registering RT...');
    let res = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rtUser)
    });
    console.log(`Register RT status: ${res.status}`);

    // 2. Register Warga
    console.log('Registering Warga...');
    res = await fetch(registUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wargaUser)
    });
    console.log(`Register Warga status: ${res.status}`);

    // 3. Login RT
    console.log('Logging in RT...');
    res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: rtUser.username, password: rtUser.password })
    });
    const rtLoginData = await res.json();
    const rtToken = rtLoginData.token;
    console.log(`RT Token: ${rtToken ? 'SUCCESS' : 'FAILED'}`);

    // 4. Login Warga
    console.log('Logging in Warga...');
    res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: wargaUser.username, password: wargaUser.password })
    });
    const wargaLoginData = await res.json();
    const wargaToken = wargaLoginData.token;
    console.log(`Warga Token: ${wargaToken ? 'SUCCESS' : 'FAILED'}`);

    if (!rtToken || !wargaToken) return;

    // 5. Create Agenda (RT)
    console.log('\n--- 1. POST /admin/agenda (RT) ---');
    res = await fetch('http://172.20.32.62:3333/admin/agenda', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rtToken}`
      },
      body: JSON.stringify({
        kategori: 'KERJA BAKTI',
        judul: 'Kerja Bakti & Fogging Nyamuk DBD',
        deskripsi: 'Kegiatan gotong royong membersihkan saluran air tersumbat serta pelaksanaan pengasapan (fogging nyamuk).',
        tanggal: '2026-07-12',
        waktu: '07:00 - 11:00 WIB',
        tempat: 'Area Fasos, Fasum, RT 02'
      })
    });
    console.log(`Status: ${res.status}`);
    const createData = await res.json();
    console.log('Response:', JSON.stringify(createData, null, 2));

    const agendaId = createData.output?.pesan?.insertId || createData.output?.insertId;
    console.log(`Created Agenda ID: ${agendaId}`);

    if (agendaId) {
      // 7. Update Agenda (RT)
      console.log('\n--- 4. PATCH /admin/agenda/:id (RT) ---');
      res = await fetch(`http://172.20.32.62:3333/admin/agenda/${agendaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rtToken}`
        },
        body: JSON.stringify({
          judul: 'Kerja Bakti & Fogging Nyamuk DBD (Revisi)',
          waktu: '08:00 - 12:00 WIB'
        })
      });
      console.log(`Status: ${res.status}`);
      console.log('Response:', JSON.stringify(await res.json(), null, 2));
    }

    // 8. List Agenda (Warga)
    console.log('\n--- 5. GET /resident/agenda (Warga) ---');
    res = await fetch('http://172.20.32.62:3333/resident/agenda', {
      headers: { 'Authorization': `Bearer ${wargaToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Response (resident all):', JSON.stringify(await res.json(), null, 2));

    if (agendaId) {
      // 9. Delete Agenda (RT)
      console.log('\n--- 7. DELETE /admin/agenda/:id (RT) ---');
      res = await fetch(`http://172.20.32.62:3333/admin/agenda/${agendaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${rtToken}` }
      });
      console.log(`Status: ${res.status}`);
      console.log('Response:', JSON.stringify(await res.json(), null, 2));
    }

  } catch (err) {
    console.error('Error in test:', err);
  }
}

runTests();
