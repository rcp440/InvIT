const Dashboard = (() => {
  let chart = null;

  const init = async () => {
    await Promise.all([loadStats(), loadMovimientos()]);
  };

  const loadStats = async () => {
    const r = await API.get('/activos/estadisticas');
    if (!r?.success) return;
    const d = r.data;
    document.getElementById('statTotal').textContent     = d.activos    || 0;
    document.getElementById('statEnUso').textContent     = d.en_uso     || 0;
    document.getElementById('statDeposito').textContent  = d.en_deposito|| 0;
    document.getElementById('statReparacion').textContent= d.en_reparacion||0;
    renderChart(d);
  };

  const renderChart = (d) => {
    const ctx = document.getElementById('chartEstados').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En uso', 'En depósito', 'En reparación', 'Otros'],
        datasets: [{
          data: [
            parseInt(d.en_uso)       || 0,
            parseInt(d.en_deposito)  || 0,
            parseInt(d.en_reparacion)|| 0,
            Math.max(0, parseInt(d.activos) - parseInt(d.en_uso) - parseInt(d.en_deposito) - parseInt(d.en_reparacion)),
          ],
          backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#94a3b8'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } } },
      },
    });
  };

  const loadMovimientos = async () => {
    const r = await API.getPaged('/movimientos', { limit: 8 });
    if (!r?.success) return;
    const tbody = document.querySelector('#tblUltMovs tbody');
    if (!r.data.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin movimientos registrados</td></tr>';
      return;
    }
    tbody.innerHTML = r.data.map(m => `
      <tr>
        <td><strong>${m.activo_codigo || '—'}</strong><br><small class="text-muted">${m.activo_descripcion || ''}</small></td>
        <td><span class="badge bg-secondary">${tipoMovLabel(m.tipo)}</span></td>
        <td>${m.resp_destino ? `${m.resp_destino} ${m.resp_destino_apellido}` : '—'}</td>
        <td class="text-muted">${fechaCorta(m.created_at)}</td>
      </tr>`).join('');
  };

  return { init };
})();
