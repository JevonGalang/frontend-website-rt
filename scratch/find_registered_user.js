async function findUser() {
  const loginUrl = 'http://172.20.32.62:3333/post/login';
  
  // We registered a user with role 'admin' in test_roles.js.
  // The username format was: 'user_admin_' + random (0-999)
  // Let's try to find it. We can try in parallel batches of 50.
  
  console.log("Searching for registered admin user...");
  const max = 1000;
  const batchSize = 100;
  
  for (let i = 0; i < max; i += batchSize) {
    const promises = [];
    for (let j = i; j < i + batchSize && j < max; j++) {
      const username = `user_admin_${j}`;
      promises.push(
        fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: 'wargaPassword123!' })
        }).then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'login berhasil') {
              return { username, token: data.token, data };
            }
          }
          return null;
        }).catch(() => null)
      );
    }
    
    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);
    if (found) {
      console.log(`Found registered user: ${found.username}`);
      console.log(`Token: ${found.token}`);
      console.log(`Response:`, JSON.stringify(found.data));
      
      // Save it to a file so we can reuse it
      await Deno.writeTextFile('scratch/active_admin.json', JSON.stringify(found)).catch(() => {
        // fallback for node
        import('fs').then(fs => {
          fs.writeFileSync('scratch/active_admin.json', JSON.stringify(found));
        });
      });
      return;
    }
  }
  
  console.log("No user found in user_admin_XXX. Let's try adminwargaXXX...");
  // Let's also check adminwargaXXX
  for (let i = 0; i < max; i += batchSize) {
    const promises = [];
    for (let j = i; j < i + batchSize && j < max; j++) {
      const username = `adminwarga${j}`;
      promises.push(
        fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: 'wargaPassword123!' })
        }).then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'login berhasil') {
              return { username, token: data.token, data };
            }
          }
          return null;
        }).catch(() => null)
      );
    }
    
    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);
    if (found) {
      console.log(`Found registered user: ${found.username}`);
      console.log(`Token: ${found.token}`);
      console.log(`Response:`, JSON.stringify(found.data));
      return;
    }
  }
  
  console.log("Finished search. None found.");
}

findUser();
