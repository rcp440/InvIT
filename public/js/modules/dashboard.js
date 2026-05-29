const Dashboard = (() => {
  let chartEstados = null;
  let chartTendencia = null;

  const init = async () => {
    const r = await API.get('/dashboard?meses=6');
    if (!r?.success) return;
    const d = r.data;
    renderStats(d.resumen);
    renderChartEstados(d.porEstado);
    renderChartTendencia(d.tendencia);
    renderUltimasAltas(d.ultimasAltas);
    renderUltimosMovimientos(d.ultimosMovimientos);
  };

  const fmtValor = (v) => {
    const n = parseFloat(v) || 0;
    if (n === 0) return '$ 0';
    if (n >= 1000000) return '$ ' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$ ' + (n / 1000).toFixed(0)    + 'K';
    return '$ ' + n.toFixed(0);
  };

  const renderStats = (r) => {
    if (!r) return;
    document.getElementById('statTotal').textContent    = r.activos      || 0;
    document.getElementById('statEnUso').textContent    = r.en_uso       || 0;
    document.getElementById('statDeposito').textContent = r.en_deposito  || 0;
    document.getElementById('statValor').textContent    = fmtValor(r.valor_total);
  };

  const renderChartEstados = (data) => {
    if (!data?.length) return;
    const ctx = document.getElementById('chartEstados')?.getContext('2d');
    if (!ctx) return;
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.nombre),
        datasets: [{
          data: data.map(d => parseInt(d.cantidad) || 0),
          backgroundColor: data.map(d => d.color || '#94a3b8'),
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
      },
    });
  };

  const renderChartTendencia = (data) => {
    if (!data?.length) return;
    const ctx = document.getElementById('chartTendencia')?.getContext('2d');
    if (!ctx) return;
    if (chartTendencia) chartTendencia.destroy();
    chartTendencia = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => {
          const [y, m] = d.mes.split('-');
          return new Date(y, m - 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        }),
        datasets: [
          { label: 'Altas', data: data.map(d => parseInt(d.altas) || 0), backgroundColor: '#22c55e99', borderColor: '#22c55e', borderWidth: 1, borderRadius: 4 },
          { label: 'Bajas', data: data.map(d => parseInt(d.bajas) || 0), backgroundColor: '#f43f5e99', borderColor: '#f43f5e', borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 }, padding: 12 } } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });
  };

  const renderUltimasAltas = (data) => {
    const tbody = document.querySelector('#tblUltAltas tbody');
    if (!tbody) return;
    if (!data?.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin altas recientes</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(a => `
      <tr>
        <td><strong>${a.codigo || '—'}</strong><br><small class="text-muted">${a.descripcion || ''}</small></td>
        <td>${a.categoria || '—'}</td>
        <td>${a.estado ? badgeEstado(a.estado, a.estado_color) : '—'}</td>
        <td class="text-muted small">${fechaCorta(a.created_at)}</td>
      </tr>`).join('');
  };

  const renderUltimosMovimientos = (data) => {
    const tbody = document.querySelector('#tblUltMovs tbody');
    if (!tbody) return;
    if (!data?.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin movimientos registrados</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(m => `
      <tr>
        <td><strong>${m.activo_codigo || '—'}</strong><br><small class="text-muted">${m.activo_descripcion || ''}</small></td>
        <td><span class="badge bg-secondary">${tipoMovLabel(m.tipo)}</span></td>
        <td>${m.usuario_nombre ? `${m.usuario_nombre} ${m.usuario_apellido || ''}` : '—'}</td>
        <td class="text-muted small">${fechaCorta(m.created_at)}</td>
      </tr>`).join('');
  };

  return { init };
})();
