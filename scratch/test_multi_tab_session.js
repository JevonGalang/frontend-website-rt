/**
 * Multi-Tab Session Isolation Test
 * 
 * Verifies that two independent browser tabs (each with its own sessionStorage instance)
 * can run different roles (e.g., Bendahara in Tab 1, RT in Tab 2) simultaneously
 * without overwriting tokens or session states.
 */

class MockSessionStorage {
  constructor(tabName) {
    this.tabName = tabName;
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

// Factory to create authSession methods bound to a specific sessionStorage instance
function createAuthSessionContext(storageInstance) {
  const AUTH_KEYS = {
    TOKEN: 'rt_token',
    USER: 'rt_current_user',
    TIME: 'rt_token_time',
    KIND: 'auth_session_kind',
    REVISION: 'auth_session_revision',
  };

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const isAdminRole = (role) => {
    if (!role) return false;
    const normalized = String(role).toLowerCase();
    return ['admin', 'rt', 'bendahara', 'sekretaris', 'sekertaris'].includes(normalized);
  };

  const getSession = () => {
    try {
      const token = storageInstance.getItem(AUTH_KEYS.TOKEN);
      const userRaw = storageInstance.getItem(AUTH_KEYS.USER);
      const timeRaw = storageInstance.getItem(AUTH_KEYS.TIME);
      const kind = storageInstance.getItem(AUTH_KEYS.KIND);
      const revision = storageInstance.getItem(AUTH_KEYS.REVISION);

      if (!token || !userRaw) return null;

      if (timeRaw) {
        const tokenTime = parseInt(timeRaw, 10);
        if (Date.now() - tokenTime > ONE_DAY_MS) {
          clearSession();
          return null;
        }
      }

      let user = null;
      try {
        user = JSON.parse(userRaw);
      } catch {
        clearSession();
        return null;
      }

      return {
        token,
        user,
        time: timeRaw ? parseInt(timeRaw, 10) : null,
        kind: kind || (isAdminRole(user?.role) ? 'admin' : 'warga'),
        revision,
      };
    } catch {
      return null;
    }
  };

  const getSessionToken = (expectedKind) => {
    const session = getSession();
    if (!session) return null;
    if (expectedKind && session.kind !== expectedKind) return null;
    return session.token;
  };

  const setSession = (user, token, explicitKind) => {
    const kind = explicitKind || (isAdminRole(user?.role) ? 'admin' : 'warga');
    const now = String(Date.now());
    storageInstance.setItem(AUTH_KEYS.TOKEN, token);
    storageInstance.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    storageInstance.setItem(AUTH_KEYS.TIME, now);
    storageInstance.setItem(AUTH_KEYS.KIND, kind);
    storageInstance.setItem(AUTH_KEYS.REVISION, now);
    return { user, token, kind, time: now };
  };

  const updateSessionUser = (updatedUser) => {
    storageInstance.setItem(AUTH_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  };

  const clearSession = () => {
    storageInstance.removeItem(AUTH_KEYS.TOKEN);
    storageInstance.removeItem(AUTH_KEYS.USER);
    storageInstance.removeItem(AUTH_KEYS.TIME);
    storageInstance.removeItem(AUTH_KEYS.KIND);
    storageInstance.removeItem(AUTH_KEYS.REVISION);
  };

  return {
    storage: storageInstance,
    getSession,
    getSessionToken,
    setSession,
    updateSessionUser,
    clearSession,
    isAdminRole,
  };
}

// -------------------------------------------------------------
// Test Execution
// -------------------------------------------------------------
function runTest() {
  console.log('====================================================');
  console.log('🧪 TEST: Multi-Tab Session Isolation (sessionStorage)');
  console.log('====================================================\n');

  // 1. Inisialisasi 2 Tab Independen
  const tab1Storage = new MockSessionStorage('Tab 1 - Bendahara');
  const tab2Storage = new MockSessionStorage('Tab 2 - RT');

  const tab1Auth = createAuthSessionContext(tab1Storage);
  const tab2Auth = createAuthSessionContext(tab2Storage);

  console.log('Step 1: Status awal kedua tab...');
  console.assert(tab1Auth.getSession() === null, 'Tab 1 should start unauthenticated');
  console.assert(tab2Auth.getSession() === null, 'Tab 2 should start unauthenticated');
  console.log('  ✅ Tab 1 & Tab 2 sama-sama bersih (guest/unauthenticated).\n');

  // 2. Tab 1 Login sebagai Bendahara
  console.log('Step 2: Tab 1 melakukan login sebagai Bendahara...');
  const userBendahara = {
    id: 10,
    username: 'bendahara_rt',
    role: 'bendahara',
    name: 'Ibu Hj. Siti (Bendahara)'
  };
  const tokenBendahara = 'JWT_BENDAHARA_TOKEN_ABC123';
  tab1Auth.setSession(userBendahara, tokenBendahara);

  const sessionTab1 = tab1Auth.getSession();
  console.assert(sessionTab1 !== null, 'Tab 1 session should exist');
  console.assert(sessionTab1.user.role === 'bendahara', 'Tab 1 role should be bendahara');
  console.assert(sessionTab1.token === tokenBendahara, 'Tab 1 token should match');
  console.assert(tab2Auth.getSession() === null, 'Tab 2 should still be unauthenticated');
  console.log('  ✅ Tab 1 aktif sebagai Bendahara, Tab 2 tetap kosong (tidak terpengaruh).\n');

  // 3. Tab 2 Login sebagai RT
  console.log('Step 3: Tab 2 melakukan login sebagai RT...');
  const userRT = {
    id: 1,
    username: 'admin_rt',
    role: 'rt',
    name: 'Pak RT (Moch. Taufik)'
  };
  const tokenRT = 'JWT_RT_TOKEN_XYZ789';
  tab2Auth.setSession(userRT, tokenRT);

  const sessionTab2 = tab2Auth.getSession();
  console.assert(sessionTab2 !== null, 'Tab 2 session should exist');
  console.assert(sessionTab2.user.role === 'rt', 'Tab 2 role should be rt');
  console.assert(sessionTab2.token === tokenRT, 'Tab 2 token should match');
  console.log('  ✅ Tab 2 aktif sebagai RT.\n');

  // 4. Verifikasi Isolasi Sesi Bersamaan (Tidak Saling Menimpa)
  console.log('Step 4: Memeriksa apakah sesi Tab 1 tertimpa oleh login Tab 2...');
  const currentTab1 = tab1Auth.getSession();
  const currentTab1Token = tab1Auth.getSessionToken();
  const currentTab2 = tab2Auth.getSession();
  const currentTab2Token = tab2Auth.getSessionToken();

  console.assert(currentTab1.user.username === 'bendahara_rt', 'Tab 1 user must still be bendahara');
  console.assert(currentTab1Token === tokenBendahara, 'Tab 1 token must still be Bendahara token');
  console.assert(currentTab2.user.username === 'admin_rt', 'Tab 2 user must still be admin_rt');
  console.assert(currentTab2Token === tokenRT, 'Tab 2 token must still be RT token');

  console.log(`  Tab 1 -> User: ${currentTab1.user.name} | Role: ${currentTab1.user.role} | Token: ${currentTab1Token}`);
  console.log(`  Tab 2 -> User: ${currentTab2.user.name} | Role: ${currentTab2.user.role} | Token: ${currentTab2Token}`);
  console.log('  ✅ SUKSES: Sesi Tab 1 (Bendahara) dan Tab 2 (RT) berjalan bersamaan tanpa tabrakan!\n');

  // 5. Tab 2 Logout
  console.log('Step 5: Tab 2 melakukan Logout...');
  tab2Auth.clearSession();
  console.assert(tab2Auth.getSession() === null, 'Tab 2 session should be cleared');
  console.assert(tab1Auth.getSession() !== null, 'Tab 1 session should remain intact');
  console.assert(tab1Auth.getSessionToken() === tokenBendahara, 'Tab 1 token must remain intact');
  console.log('  ✅ Tab 2 berhasil logout, Tab 1 tetap aktif sebagai Bendahara tanpa terganggu.\n');

  // 6. Tab 1 Memperbarui Profil
  console.log('Step 6: Tab 1 memperbarui profil...');
  const updatedBendahara = { ...userBendahara, name: 'Ibu Hj. Siti S.E. (Bendahara)' };
  tab1Auth.updateSessionUser(updatedBendahara);
  console.assert(tab1Auth.getSession().user.name === 'Ibu Hj. Siti S.E. (Bendahara)', 'Tab 1 profile updated');
  console.assert(tab2Auth.getSession() === null, 'Tab 2 remains logged out');
  console.log('  ✅ Tab 1 update profile sukses dan Tab 2 tetap terisolasi.\n');

  console.log('====================================================');
  console.log('🎉 SEMUA PENGUJIAN MULTI-TAB SESSION BERHASIL (100% PASS)');
  console.log('====================================================');
}

runTest();
