const Estados = (() => {
  const init = async () => {
    await load();
    document.getElementById('btnNuevoEstado').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/estados', { limit: 100 });
    makeTable('tblEstados', [
      { title: 'Estado', data: null, render: d => {
          const c = d.color || '#6c757d';
          return `<span class="badge-estado" style="background:${c}22;color:${c}">
            <i class="${d.icono || 'fa-solid fa-circle'} me-1"></i>${d.nombre}
          </span>`;
      }},
      { title: 'Ámbito', data: 'tenant_id', render: v => v
          ? '<span class="badge bg-info text-dark">Personalizado</span>'
          : '<span class="badge bg-secondary">Global</span>' },
      { title: 'Estado', data: 'activo', render: v => badgeActivo(v) },
      { title: 'Acciones', data: null, orderable: false, render: (_, __, row) => row.tenant_id
          ? `<button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Estados.editar('${row.id}')">
               <i class="fa-solid fa-pen"></i></button>
             <button class="btn btn-sm btn-outline-danger btn-action" onclick="Estados.eliminar('${row.id}','${row.nombre.replace(/'/g,"\\'")}')">
               <i class="fa-solid fa-trash"></i></button>`
          : '<span class="text-muted small">Solo lectura</span>' },
    ], r?.data || []);
  };

  const openModal = (e = null) => {
    document.getElementById('modalTitle').textContent = e ? 'Editar estado' : 'Nuevo estado';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-8">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="eNombre" value="${e?.nombre || ''}" maxlength="80" placeholder="Ej: En mantenimiento">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Color</label>
          <input type="color" class="form-control form-control-color w-100" id="eColor" value="${e?.color || '#0ea5e9'}">
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Ícono <span class="text-muted small">(clase FontAwesome)</span></label>
          <div class="input-group">
            <span class="input-group-text" style="min-width:42px;justify-content:center">
              <i id="iconPreview" class="${e?.icono || 'fa-solid fa-circle'}"></i>
            </span>
            <input type="text" class="form-control" id="eIcono" value="${e?.icono || 'fa-solid fa-circle'}"
              placeholder="fa-solid fa-circle"
              oninput="document.getElementById('iconPreview').className=this.value">
          </div>
          <div class="form-text">Ej: fa-solid fa-wrench, fa-solid fa-check-circle, fa-regular fa-clock</div>
        </div>
      </div>`;
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(e?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const nombre = document.getElementById('eNombre').value.trim();
    const color  = document.getElementById('eColor').value;
    const icono  = document.getElementById('eIcono').value.trim();
    if (!nombre) { toast('warning', 'El nombre es obligatorio'); return; }
    const body = { nombre, color, icono: icono || undefined };
    const r = id ? await API.put(`/estados/${id}`, body) : await API.post('/estados', body);
    if (!r?.success) { toast('error', r?.message || 'Error al guardar'); return; }
    toast('success', id ? 'Estado actualizado' : 'Estado creado');
    modal.hide();
    await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/estados/${id}`);
    if (r?.success) openModal(r.data);
  };

  const eliminar = async (id, nombre) => {
    const { isConfirmed } = await confirmDelete(nombre);
    if (!isConfirmed) return;
    const r = await API.delete(`/estados/${id}`);
    if (r?.success) { toast('success', 'Estado eliminado'); await load(); }
    else toast('error', r?.message || 'Error al eliminar');
  };

  return { init, editar, eliminar };
})();
