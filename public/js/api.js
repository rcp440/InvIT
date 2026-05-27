/**
 * api.js — Capa de comunicación con el backend.
 * Maneja JWT automáticamente, refresh de tokens y errores globales.
 */
const API = (() => {
  const BASE = '/api';

  const getToken    = ()      => localStorage.getItem('accessToken');
  const getRefresh  = ()      => localStorage.getItem('refreshToken');
  const setTokens   = (a, r)  => {
    localStorage.setItem('accessToken',  a);
    localStorage.setItem('refreshToken', r);
  };

  let refreshing = false;

  const buildHeaders = (extra = {}) => {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  };

  const tryRefresh = async () => {
    if (refreshing) return false;
    refreshing = true;
    try {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getRefresh() }),
      });
      if (!r.ok) return false;
      const d = await r.json();
      setTokens(d.data.tokens.accessToken, d.data.tokens.refreshToken);
      return true;
    } catch { return false; }
    finally { refreshing = false; }
  };

  const request = async (method, path, body = null, retry = true) => {
    const opts = { method, headers: buildHeaders() };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);

    // Token expirado → intentar refresh
    if (res.status === 401 && retry) {
      const ok = await tryRefresh();
      if (ok) return request(method, path, body, false);
      Auth.logout();
      return null;
    }

    // Error de servidor — muestra toast
    if (!res.ok && res.status >= 500) {
      Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'Intente nuevamente.', timer: 3000, showConfirmButton: false });
    }

    return res.json();
  };

  return {
    get:    (path)         => request('GET',    path),
    post:   (path, body)   => request('POST',   path, body),
    put:    (path, body)   => request('PUT',    path, body),
    patch:  (path, body)   => request('PATCH',  path, body),
    delete: (path)         => request('DELETE', path),

    // Helpers para paginación
    getPaged: (path, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `${path}?${qs}`);
    },
  };
})();
