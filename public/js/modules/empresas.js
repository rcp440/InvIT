const Empresas = (() => {
  const init = async () => {
    if (!Auth.hasRole('superadmin')) return;
    await load();
    document.getElementById('btnNuevaEmpresa').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/empresas', { limit: 100 });
    makeTable('tblEmpresas', [
      { title: 'Nombre', data: 'nombre' },
      { title: 'Email',  data: 'email'  },
      { title: 'CUIT',   data: 'cuit',  defaultContent: '—' },
      { title: 'Plan',   data: 'plan',  render: v => `<span class="badge bg-info text-dark text-uppercase">${v}</span>` },
      { title: 'Estado', data: 'estado',render: v => {
        const m = { activo:'success', prueba:'warning', suspendido:'danger', inactivo:'secondary' };
        return `<span class="badge bg-${m[v]||'secondary'}">${v}</span>`;
      }},
      { title: 'Acciones', data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Empresas.editar('${row.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action" onclick="Empresas.eliminar('${row.id}','${row.nombre}')"><i class="fa-solid fa-trash"></i></button>` },
    ], r?.data || []);
  };

  const openModal = (e = null) => {
    document.getElementById('modalTitle').textContent = e ? 'Editar empresa' : 'Nueva empresa';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-12"><div class="alert alert-info py-2 mb-0"><i class="fa-solid fa-info-circle me-1"></i> Al crear la empresa se crea automáticamente su usuario administrador.</div></div>
        <div class="col-6">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="eNombre" value="${e?.nombre||''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">CUIT</label>
          <input type="text" class="form-control" id="eCuit" value="${e?.cuit||''}" placeholder="20-12345678-9">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Email empresa <span class="text-danger">*</span></label>
          <input type="email" class="form-control" id="eEmail" value="${e?.email||''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Plan</label>
          <select class="form-select" id="ePlan">
            <option value="basico" ${e?.plan==='basico'?'selected':''}>Básico</option>
            <option value="profesional" ${e?.plan==='profesional'?'selected':''}>Profesional</option>
            <option value="enterprise" ${e?.plan==='enterprise'?'selected':''}>Enterprise</option>
          </select>
        </div>
        ${!e ? `
        <div class="col-12"><hr class="my-1"><p class="fw-semibold text-muted mb-2"><i class="fa-solid fa-user me-1"></i>Administrador inicial</p></div>
        <div class="col-6">
          <label class="form-label fw-semibold">Nombre admin <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="eAdminNombre">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Apellido admin <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="eAdminApellido">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Email admin <span class="text-danger">*</span></label>
          <input type="email" class="form-control" id="eAdminEmail">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Contraseña admin <span class="text-danger">*</span></label>
          <input type="password" class="form-control" id="eAdminPwd">
        </div>` : ''}
      </div>`;

    const modal = new bootstrap.Modal(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(e?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const body = {
      nombre: document.getElementById('eNombre').value.trim(),
      cuit:   document.getElementById('eCuit').value.trim(),
      email:  document.getElementById('eEmail').value.trim(),
      plan:   document.getElementById('ePlan').value,
    };
    if (!id) {
      body.adminNombre   = document.getElementById('eAdminNombre').value.trim();
      body.adminApellido = document.getElementById('eAdminApellido').value.trim();
      body.adminEmail    = document.getElementById('eAdminEmail').value.trim();
      body.adminPassword = document.getElementById('eAdminPwd').value;
    }
    if (!body.nombre || !body.email) { toast('warning', 'Nombre y email son obligatorios'); return; }

    const r = id ? await API.put(`/empresas/${id}`, body) : await API.post('/empresas', body);
    if (!r?.success) { toast('error', r?.message || 'Error'); return; }
    toast('success', id ? 'Empresa actualizada' : 'Empresa creada');
    modal.hide(); await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/empresas/${id}`);
    if (r?.success) openModal(r.data);
  };

  const eliminar = async (id, nombre) => {
    const c = await confirmDelete(nombre);
    if (!c.isConfirmed) return;
    const r = await API.delete(`/empresas/${id}`);
    if (r?.success) { toast('success', 'Empresa desactivada'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  return { init, editar, eliminar };
})();
