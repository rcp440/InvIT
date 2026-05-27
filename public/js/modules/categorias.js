const Categorias = (() => {
  let dt = null;

  const init = async () => {
    await load();
    document.getElementById('btnNuevaCategoria').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/categorias', { limit: 100, activo: true });
    const data = r?.data || [];

    dt = makeTable('tblCategorias', [
      { title: 'Icono',       data: null, render: d => `<i class="${d.icono || 'fa-solid fa-box'}" style="color:${d.color};font-size:1.2rem"></i>` },
      { title: 'Nombre',      data: 'nombre' },
      { title: 'Descripción', data: 'descripcion', defaultContent: '—' },
      { title: 'Estado',      data: 'activo', render: v => badgeActivo(v) },
      { title: 'Acciones',    data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Categorias.editar(${row.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action"  onclick="Categorias.eliminar(${row.id},'${row.nombre}')"><i class="fa-solid fa-trash"></i></button>` },
    ], data);
  };

  const openModal = (cat = null) => {
    document.getElementById('modalTitle').textContent = cat ? 'Editar categoría' : 'Nueva categoría';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="catNombre" value="${cat?.nombre || ''}" placeholder="Ej: Notebook, Monitor, Silla">
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Descripción</label>
          <input type="text" class="form-control" id="catDesc" value="${cat?.descripcion || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Ícono FontAwesome</label>
          <input type="text" class="form-control" id="catIcono" value="${cat?.icono || 'fa-solid fa-box'}" placeholder="fa-solid fa-laptop">
          <small class="text-muted">Ver íconos en <a href="https://fontawesome.com/icons" target="_blank">fontawesome.com</a></small>
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Color</label>
          <input type="color" class="form-control form-control-color w-100" id="catColor" value="${cat?.color || '#0ea5e9'}">
        </div>
      </div>`;

    const modal = new bootstrap.Modal(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(cat?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const body = {
      nombre:      document.getElementById('catNombre').value.trim(),
      descripcion: document.getElementById('catDesc').value.trim(),
      icono:       document.getElementById('catIcono').value.trim(),
      color:       document.getElementById('catColor').value,
    };
    if (!body.nombre) { toast('warning', 'El nombre es obligatorio'); return; }

    const r = id
      ? await API.put(`/categorias/${id}`, body)
      : await API.post('/categorias', body);

    if (!r?.success) { toast('error', r?.message || 'Error al guardar'); return; }
    toast('success', id ? 'Categoría actualizada' : 'Categoría creada');
    modal.hide();
    await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/categorias/${id}`);
    if (r?.success) openModal(r.data);
  };

  const eliminar = async (id, nombre) => {
    const conf = await confirmDelete(nombre);
    if (!conf.isConfirmed) return;
    const r = await API.delete(`/categorias/${id}`);
    if (r?.success) { toast('success', 'Categoría desactivada'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  return { init, editar, eliminar };
})();
