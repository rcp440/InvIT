/**
 * auth.js — Gestión de sesión y usuario actual.
 */
const Auth = (() => {
  const getUsuario = () => {
    try { return JSON.parse(localStorage.getItem('usuario') || 'null'); }
    catch { return null; }
  };

  const isLoggedIn = () => !!localStorage.getItem('accessToken');

  const logout = async () => {
    try {
      if (isLoggedIn()) await API.post('/auth/logout');
    } catch {}
    localStorage.clear();
    window.location.href = '/login.html';
  };

  const check = () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return false; }
    return true;
  };

  const hasRole = (...roles) => {
    const u = getUsuario();
    return u && roles.includes(u.rol);
  };

  const canDo = (modulo, accion) => {
    const u = getUsuario();
    if (!u) return false;
    if (u.rol === 'superadmin') return true;
    return u.permisos?.[modulo]?.[accion] === true;
  };

  return { getUsuario, isLoggedIn, logout, check, hasRole, canDo };
})();
