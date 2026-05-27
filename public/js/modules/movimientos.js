const Movimientos = (() => {
  const init = async () => { await load(); };

  const load = async () => {
    const r = await API.getPaged('/movimientos', { limit: 200 });
    makeTable('tblMovimientos', [
      { title: 'Activo',      data: null, render: d => `<strong>${d.activo_codigo||'—'}</strong><br><small class="text-muted">${d.activo_descripcion||''}</small>` },
      { title: 'Tipo',        data: 'tipo', render: v => `<span class="badge bg-secondary">${tipoMovLabel(v)}</span>` },
      { title: 'Origen',      data: null,   render: d => d.ubic_origen    || '—' },
      { title: 'Destino',     data: null,   render: d => d.ubic_destino   || '—' },
      { title: 'Estado nuevo',data: null,   render: d => d.estado_nuevo   || '—' },
      { title: 'Usuario',     data: null,   render: d => d.usuario_nombre ? `${d.usuario_nombre} ${d.usuario_apellido}` : '—' },
      { title: 'Fecha',       data: 'created_at', render: v => fechaCorta(v) },
    ], r?.data || []);
  };

  return { init };
})();
