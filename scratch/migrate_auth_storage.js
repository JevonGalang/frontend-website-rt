import fs from 'fs';

function migrateAdminDashboard() {
  const filePath = 'src/components/AdminDashboard.jsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace token and auth session keys only
  content = content.replaceAll("localStorage.getItem('rt_token')", "sessionStorage.getItem('rt_token')");
  content = content.replaceAll("localStorage.removeItem('rt_token')", "sessionStorage.removeItem('rt_token')");
  content = content.replaceAll("localStorage.removeItem('rt_current_user')", "sessionStorage.removeItem('rt_current_user')");
  content = content.replaceAll("localStorage.removeItem('rt_token_time')", "sessionStorage.removeItem('rt_token_time')");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ AdminDashboard.jsx migrated.');
}

function migrateProfilWarga() {
  const filePath = 'src/components/ProfilWarga.jsx';
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replaceAll("localStorage.getItem('rt_token')", "sessionStorage.getItem('rt_token')");
  content = content.replaceAll("localStorage.setItem('rt_current_user'", "sessionStorage.setItem('rt_current_user'");
  content = content.replaceAll("localStorage.removeItem('rt_current_user')", "sessionStorage.removeItem('rt_current_user')");
  content = content.replaceAll("localStorage.removeItem('rt_token')", "sessionStorage.removeItem('rt_token')");
  content = content.replaceAll("localStorage is blocked or unavailable", "sessionStorage is blocked or unavailable");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ ProfilWarga.jsx migrated.');
}

migrateAdminDashboard();
migrateProfilWarga();
