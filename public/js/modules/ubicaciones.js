const Ubicaciones = (() => {
  let dt = null;

  const init = async () => {
    await load();
    document.getElementById('btnNuevaUbicacion').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/ubicaciones', { limit: 100 });
    dt = makeTable('tblUbicaciones', [
      { title: 'Nombre',  data: 'nombre' },
      { title: 'Piso',    data: 'piso',    defaultContent: '—' },
      { title: 'Sector',  data: 'sector',  defaultContent: '—' },
      { title: 'Estado',  data: 'activo',  render: v => badgeActivo(v) },
      { title: 'Acciones', data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Ubicaciones.editar(${row.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action"  onclick="Ubicaciones.eliminar(${row.id},'${row.nombre}')"><i class="fa-solid fa-trash"></i></button>` },
    ], r?.data || []);
  };

  const openModal = (u = null) => {
    document.getElementById('modalTitle').textContent = u ? 'Editar ubicación' : 'Nueva ubicación';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="ubNombre" value="${u?.nombre || ''}" placeholder="Ej: Oficina Dirección">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Piso</label>
          <input type="text" class="form-control" id="ubPiso" value="${u?.piso || ''}" placeholder="Ej: 1° piso">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Sector</label>
          <input type="text" class="form-control" id="ubSector" value="${u?.sector || ''}" placeholder="Ej: Administración">
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Descripción</label>
          <input type="text" class="form-control" id="ubDesc" value="${u?.descripcion || ''}">
        </div>
      </div>`;
    const modal = new bootstrap.Modal(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(u?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const body = {
      nombre:      document.getElementById('ubNombre').value.trim(),
      piso:        document.getElementById('ubPiso').value.trim(),
      sector:      document.getElementById('ubSector').value.trim(),
      descripcion: document.getElementById('ubDesc').value.trim(),
    };
    if (!body.nombre) { toast('warning', 'El nombre es obligatorio'); return; }
    const r = id ? await API.put(`/ubicaciones/${id}`, body) : await API.post('/ubicaciones', body);
    if (!r?.success) { toast('error', r?.message || 'Error'); return; }
    toast('success', id ? 'Ubicación actualizada' : 'Ubicación creada');
    modal.hide(); await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/ubicaciones/${id}`);
    if (r?.success) openModal(r.data);
  };

  const eliminar = async (id, nombre) => {
    const c = await confirmDelete(nombre);
    if (!c.isConfirmed) return;
    const r = await API.delete(`/ubicaciones/${id}`);
    if (r?.success) { toast('success', 'Ubicación desactivada'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  return { init, editar, eliminar };
})();
