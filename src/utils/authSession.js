// Centralized Auth Session Manager (Scoped to sessionStorage for Multi-Tab Isolation)

export const AUTH_KEYS = {
  TOKEN: 'rt_token',
  USER: 'rt_current_user',
  TIME: 'rt_token_time',
  KIND: 'auth_session_kind',
  REVISION: 'auth_session_revision',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const isAdminRole = (role) => {
  if (!role) return false;
  const normalized = String(role).toLowerCase();
  return ['admin', 'rt', 'bendahara', 'sekretaris', 'sekertaris'].includes(normalized);
};

export const getSession = () => {
  try {
    const token = sessionStorage.getItem(AUTH_KEYS.TOKEN);
    const userRaw = sessionStorage.getItem(AUTH_KEYS.USER);
    const timeRaw = sessionStorage.getItem(AUTH_KEYS.TIME);
    const kind = sessionStorage.getItem(AUTH_KEYS.KIND);
    const revision = sessionStorage.getItem(AUTH_KEYS.REVISION);

    if (!token || !userRaw) {
      return null;
    }

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
  } catch (e) {
    console.warn('[authSession] sessionStorage unavailable:', e);
    return null;
  }
};

export const getSessionToken = (expectedKind) => {
  const session = getSession();
  if (!session) return null;
  if (expectedKind && session.kind !== expectedKind) {
    return null;
  }
  return session.token;
};

export const setSession = (user, token, explicitKind) => {
  try {
    const kind = explicitKind || (isAdminRole(user?.role) ? 'admin' : 'warga');
    const now = String(Date.now());
    
    sessionStorage.setItem(AUTH_KEYS.TOKEN, token);
    sessionStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    sessionStorage.setItem(AUTH_KEYS.TIME, now);
    sessionStorage.setItem(AUTH_KEYS.KIND, kind);
    sessionStorage.setItem(AUTH_KEYS.REVISION, now);

    return { user, token, kind, time: now };
  } catch (e) {
    console.warn('[authSession] Failed to set sessionStorage:', e);
    return null;
  }
};

export const updateSessionUser = (updatedUser) => {
  try {
    sessionStorage.setItem(AUTH_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  } catch (e) {
    console.warn('[authSession] Failed to update user in sessionStorage:', e);
    return null;
  }
};

export const clearSession = () => {
  try {
    sessionStorage.removeItem(AUTH_KEYS.TOKEN);
    sessionStorage.removeItem(AUTH_KEYS.USER);
    sessionStorage.removeItem(AUTH_KEYS.TIME);
    sessionStorage.removeItem(AUTH_KEYS.KIND);
    sessionStorage.removeItem(AUTH_KEYS.REVISION);
  } catch (e) {
    console.warn('[authSession] Failed to clear sessionStorage:', e);
  }
};
