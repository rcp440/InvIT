const Auditoria = (() => {
  const init = async () => {
    await load();
    document.getElementById('btnAudFiltrar')?.addEventListener('click', () => load());
    document.getElementById('btnAudLimpiar')?.addEventListener('click', () => {
      ['audFiltroModulo', 'audFiltroAccion', 'audFiltroDesde', 'audFiltroHasta']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      load();
    });
  };

  const load = async () => {
    const params = { limit: 100 };
    const modulo = document.getElementById('audFiltroModulo')?.value;
    const accion = document.getElementById('audFiltroAccion')?.value;
    const desde  = document.getElementById('audFiltroDesde')?.value;
    const hasta  = document.getElementById('audFiltroHasta')?.value;
    if (modulo) params.modulo     = modulo;
    if (accion) params.accion     = accion;
    if (desde)  params.fechaDesde = desde;
    if (hasta)  params.fechaHasta = hasta;

    const r    = await API.getPaged('/auditoria', params);
    const data = r?.data?.rows || [];
    const total = r?.data?.total ?? data.length;

    const elTotal = document.getElementById('audTotal');
    if (elTotal) elTotal.textContent = total;

    makeTable('tblAuditoria', [
      { title: 'Fecha',   data: 'created_at', render: v => `<span class="small text-muted">${fechaCorta(v)}</span>` },
      { title: 'Usuario', data: null, render: d =>
          `<strong>${d.usuario_nombre ? `${d.usuario_nombre} ${d.usuario_apellido || ''}` : '—'}</strong>` +
          (d.empresa_nombre ? `<br><small class="text-muted">${d.empresa_nombre}</small>` : '')
      },
      { title: 'Módulo',  data: 'modulo',  render: v => `<span class="badge bg-light text-dark border small">${v || '—'}</span>` },
      { title: 'Acción',  data: 'accion',  render: v => accionBadge(v) },
      { title: 'IP',      data: 'ip',      render: v => `<code class="small">${v || '—'}</code>` },
    ], data);
  };

  const accionBadge = (a) => {
    const m = { crear: 'success', actualizar: 'primary', eliminar: 'danger', login: 'info', logout: 'secondary', baja: 'warning' };
    return `<span class="badge bg-${m[a] || 'secondary'}">${a || '—'}</span>`;
  };

  return { init };
})();
