const Reportes = (() => {
  const init = async () => {
    const r = await API.getPaged('/categorias', { limit: 100, activo: true });
    const cats = r?.data || [];
    const sel = document.getElementById('rptCategoria');
    if (sel) cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.nombre;
      sel.appendChild(o);
    });
    document.getElementById('btnRptActivos')?.addEventListener('click',      () => exportar('activos'));
    document.getElementById('btnRptMovimientos')?.addEventListener('click',  () => exportar('movimientos'));
    document.getElementById('btnRptValoracion')?.addEventListener('click',   () => exportar('valoracion'));
  };

  const getParams = () => {
    const p     = { formato: document.getElementById('rptFormato')?.value || 'xlsx' };
    const desde = document.getElementById('rptDesde')?.value;
    const hasta = document.getElementById('rptHasta')?.value;
    const catId = document.getElementById('rptCategoria')?.value;
    if (desde) p.fechaDesde  = desde;
    if (hasta)  p.fechaHasta  = hasta;
    if (catId)  p.categoriaId = catId;
    return p;
  };

  const exportar = async (tipo) => {
    const params   = getParams();
    const qs       = new URLSearchParams(params).toString();
    const url      = `/api/reportes/${tipo}?${qs}`;
    const fecha    = new Date().toISOString().substring(0, 10);
    const filename = `${tipo}_${fecha}.${params.formato}`;
    const btnId    = `btnRpt${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const btn      = document.getElementById(btnId);
    const orig     = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Generando...';

    try {
      const token = localStorage.getItem('accessToken');
      const resp  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        toast('error', err?.message || 'Error al generar el reporte');
        return;
      }
      const blob = await resp.blob();
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob), download: filename,
      });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast('success', 'Reporte descargado');
    } catch { toast('error', 'Error al descargar el reporte'); }
    finally  { btn.disabled = false; btn.innerHTML = orig; }
  };

  return { init };
})();
