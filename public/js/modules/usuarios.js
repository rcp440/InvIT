const Usuarios = (() => {
  let roles = [];

  const init = async () => {
    const r = await API.get('/usuarios/roles');
    roles = r?.data || [];
    await load();
    document.getElementById('btnNuevoUsuario').onclick = () => openModal();
  };

  const load = async () => {
    const r = await API.getPaged('/usuarios', { limit: 100 });
    makeTable('tblUsuarios', [
      { title: 'Nombre',       data: null, render: d => `${d.nombre} ${d.apellido}` },
      { title: 'Email',        data: 'email' },
      { title: 'Rol',          data: 'rol_nombre', render: v => rolLabel(v) },
      { title: 'Último acceso',data: 'ultimo_acceso', render: v => fechaCorta(v) },
      { title: 'Estado',       data: 'activo', render: v => badgeActivo(v) },
      { title: 'Acciones', data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Usuarios.editar('${row.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-warning btn-action me-1" onclick="Usuarios.cambiarPwd('${row.id}','${row.nombre}')"><i class="fa-solid fa-key"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action"  onclick="Usuarios.eliminar('${row.id}','${row.nombre} ${row.apellido}')"><i class="fa-solid fa-trash"></i></button>` },
    ], r?.data || []);
  };

  const rolesOpts = () => roles.map(r =>
    `<option value="${r.nombre}">${rolLabel(r.nombre)}</option>`).join('');

  const openModal = (u = null) => {
    document.getElementById('modalTitle').textContent = u ? 'Editar usuario' : 'Nuevo usuario';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-6">
          <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="uNombre" value="${u?.nombre || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Apellido <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="uApellido" value="${u?.apellido || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Email <span class="text-danger">*</span></label>
          <input type="email" class="form-control" id="uEmail" value="${u?.email || ''}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Rol <span class="text-danger">*</span></label>
          <select class="form-select" id="uRol">
            <option value="">— Seleccionar —</option>
            ${rolesOpts()}
          </select>
        </div>
        ${!u ? `
        <div class="col-12">
          <label class="form-label fw-semibold">Contraseña <span class="text-danger">*</span></label>
          <input type="password" class="form-control" id="uPassword" placeholder="Mínimo 8 caracteres, mayúsculas y números">
        </div>` : ''}
      </div>`;

    if (u) {
      document.getElementById('uRol').value = u.rol_nombre;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(u?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    const body = {
      nombre:   document.getElementById('uNombre').value.trim(),
      apellido: document.getElementById('uApellido').value.trim(),
      email:    document.getElementById('uEmail').value.trim(),
      rolNombre: document.getElementById('uRol').value,
    };
    if (!id) body.password = document.getElementById('uPassword').value;

    if (!body.nombre || !body.apellido || !body.email || !body.rolNombre) {
      toast('warning', 'Complete todos los campos obligatorios'); return;
    }

    const r = id ? await API.put(`/usuarios/${id}`, body) : await API.post('/usuarios', body);
    if (!r?.success) { toast('error', r?.message || 'Error'); return; }
    toast('success', id ? 'Usuario actualizado' : 'Usuario creado');
    modal.hide(); await load();
  };

  const editar = async (id) => {
    const r = await API.get(`/usuarios/${id}`);
    if (r?.success) openModal(r.data);
  };

  const cambiarPwd = (id, nombre) => {
    document.getElementById('modalTitle').textContent = `Cambiar contraseña — ${nombre}`;
    document.getElementById('modalBody').innerHTML = `
      <div class="mb-3">
        <label class="form-label fw-semibold">Nueva contraseña <span class="text-danger">*</span></label>
        <input type="password" class="form-control" id="newPwd" placeholder="Mínimo 8 caracteres">
      </div>`;
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = async () => {
      const pwd = document.getElementById('newPwd').value;
      if (pwd.length < 8) { toast('warning', 'Mínimo 8 caracteres'); return; }
      const r = await API.patch(`/usuarios/${id}/password`, { passwordNueva: pwd });
      if (!r?.success) { toast('error', r?.message || 'Error'); return; }
      toast('success', 'Contraseña actualizada'); modal.hide();
    };
    modal.show();
  };

  const eliminar = async (id, nombre) => {
    const c = await confirmDelete(nombre);
    if (!c.isConfirmed) return;
    const r = await API.delete(`/usuarios/${id}`);
    if (r?.success) { toast('success', 'Usuario desactivado'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  return { init, editar, cambiarPwd, eliminar };
})();
