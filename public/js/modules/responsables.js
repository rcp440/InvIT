const Responsables = (() => {
  const init = async () => {
    await load();
    document.getElementById('btnNuevoResponsable').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/responsables', { limit: 100 });
    makeTable('tblResponsables', [
      { title: 'Nombre',       data: null, render: d => `${d.nombre} ${d.apellido}` },
      { title: 'Email',        data: 'email',       defaultContent: '—' },
      { title: 'Departamento', data: 'departamento',defaultContent: '—' },
      { title: 'Cargo',        data: 'cargo',       defaultContent: '—' },
      { title: 'Estado',       data: 'activo', render: v => badgeActivo(v) },
      { title: 'Acciones', data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Responsables.editar(${row.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action"  onclick="Responsables.eliminar(${row.id},'${row.nombre} ${row.apellido}')"><i class="fa-solid fa-trash"></i></button>` },
    ], r?.data || []);
  };

  const openModal = (p = null) => {
    document.getElementById('modalTitle').textContent = p ? 'Editar responsable' : 'Nuevo responsable';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-6">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="rNombre" value="${p?.nombre || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Apellido <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="rApellido" value="${p?.apellido || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Email</label>
          <input type="email" class="form-control" id="rEmail" value="${p?.email || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Teléfono</label>
          <input type="text" class="form-control" id="rTelefono" value="${p?.telefono || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Departamento</label>
          <input type="text" class="form-control" id="rDepto" value="${p?.departamento || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Cargo</label>
          <input type="text" class="form-control" id="rCargo" value="${p?.cargo || ''}">
        </div>
      </div>`;
    const modal = new bootstrap.Modal(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(p?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const body = {
      nombre:      document.getElementById('rNombre').value.trim(),
      apellido:    document.getElementById('rApellido').value.trim(),
      email:       document.getElementById('rEmail').value.trim(),
      telefono:    document.getElementById('rTelefono').value.trim(),
      departamento:document.getElementById('rDepto').value.trim(),
      cargo:       document.getElementById('rCargo').value.trim(),
    };
    if (!body.nombre || !body.apellido) { toast('warning', 'Nombre y apellido son obligatorios'); return; }
    const r = id ? await API.put(`/responsables/${id}`, body) : await API.post('/responsables', body);
    if (!r?.success) { toast('error', r?.message || 'Error'); return; }
    toast('success', id ? 'Responsable actualizado' : 'Responsable creado');
    modal.hide(); await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/responsables/${id}`);
    if (r?.success) openModal(r.data);
  };

  const eliminar = async (id, nombre) => {
    const c = await confirmDelete(nombre);
    if (!c.isConfirmed) return;
    const r = await API.delete(`/responsables/${id}`);
    if (r?.success) { toast('success', 'Responsable desactivado'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  return { init, editar, eliminar };
})();
