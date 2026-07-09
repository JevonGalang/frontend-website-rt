async function testEndpoints() {
  const urls = [
    { name: 'GET resident', url: 'http://172.20.32.62:3333/admin/resident', method: 'GET' },
    { name: 'GET house', url: 'http://172.20.32.62:3333/admin/house', method: 'GET' },
    { name: 'GET datawarga', url: 'http://172.20.32.62:3333/admin/datawarga', method: 'GET' }
  ];

  for (const item of urls) {
    try {
      console.log(`Testing ${item.name} (${item.url})...`);
      const res = await fetch(item.url, { method: item.method });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Response type: ${Array.isArray(data) ? 'array' : typeof data}`);
        console.log(`Sample:`, JSON.stringify(data).substring(0, 300));
      } else {
        const text = await res.text();
        console.log(`Error Response:`, text.substring(0, 300));
      }
    } catch (err) {
      console.error(`Failed to fetch ${item.name}:`, err.message);
    }
    console.log('---');
  }
}

testEndpoints();
