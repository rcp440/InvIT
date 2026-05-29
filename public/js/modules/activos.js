const Activos = (() => {
  let categorias = [], estados = [], ubicaciones = [], responsables = [];

  const init = async () => {
    await loadSelectData();
    await load();
    fillFiltros();
    document.getElementById('btnNuevoActivo').onclick      = () => openModal();
    document.getElementById('btnFiltrarActivos').onclick   = () => load();
    document.getElementById('btnImportarActivos').onclick  = () => importar();
    document.getElementById('btnDescargarPlantilla').onclick = () => descargarPlantilla();
  };

  const loadSelectData = async () => {
    const [rCat, rUbic, rResp] = await Promise.all([
      API.getPaged('/categorias',  { limit: 100, activo: true }),
      API.getPaged('/ubicaciones', { limit: 100, activo: true }),
      API.getPaged('/responsables',{ limit: 100, activo: true }),
    ]);
    categorias   = rCat?.data  || [];
    ubicaciones  = rUbic?.data || [];
    responsables = rResp?.data || [];

    // Obtener estados globales desde la API de movimientos (workaround: usamos los del activo)
    // Los estados vienen incluidos en el listado de activos
  };

  const fillFiltros = () => {
    const sel = (id, arr, txtKey = 'nombre') => {
      const el = document.getElementById(id);
      if (!el) return;
      arr.forEach(i => {
        const o = document.createElement('option');
        o.value = i.id;
        o.textContent = i[txtKey];
        el.appendChild(o);
      });
    };
    sel('filtroActivoCategoria', categorias);
  };

  const load = async () => {
    const params = { limit: 200 };
    const cat  = document.getElementById('filtroActivoCategoria')?.value;
    const est  = document.getElementById('filtroActivoEstado')?.value;
    const srch = document.getElementById('filtroActivoSearch')?.value;
    if (cat)  params.categoriaId = cat;
    if (est)  params.estadoId    = est;
    if (srch) params.search      = srch;

    const r = await API.getPaged('/activos', params);

    makeTable('tblActivos', [
      { title: 'Código',      data: 'codigo', render: v => `<span class="fw-semibold text-primary">${v}</span>` },
      { title: 'Descripción', data: null, render: d => `${d.descripcion}<br><small class="text-muted">${d.marca||''} ${d.modelo||''}</small>` },
      { title: 'Categoría',   data: null, render: d => d.categoria_nombre
          ? `<i class="${d.categoria_icono||'fa-solid fa-box'} me-1"></i>${d.categoria_nombre}` : '—' },
      { title: 'Estado',      data: null, render: d => d.estado_nombre ? badgeEstado(d.estado_nombre, d.estado_color) : '—' },
      { title: 'Ubicación',   data: 'ubicacion_nombre',  defaultContent: '—' },
      { title: 'Responsable', data: null, render: d => d.responsable_nombre ? `${d.responsable_nombre} ${d.responsable_apellido}` : '—' },
      { title: 'Acciones',    data: null, orderable: false, render: (_, __, row) => `
        <button class="btn btn-sm btn-outline-info btn-action me-1" title="Ver detalle" onclick="Activos.ver('${row.id}')"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="Activos.editar('${row.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger btn-action" onclick="Activos.baja('${row.id}','${row.codigo}')"><i class="fa-solid fa-arrow-down"></i></button>` },
    ], r?.data || []);
  };

  const optsSelect = (arr, val = null, labelFn = i => i.nombre) =>
    arr.map(i => `<option value="${i.id}" ${val == i.id ? 'selected' : ''}>${labelFn(i)}</option>`).join('');

  const openModal = (a = null) => {
    document.getElementById('modalTitle').textContent = a ? 'Editar activo' : 'Nuevo activo';
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-6">
          <label class="form-label fw-semibold">Código</label>
          <input type="text" class="form-control" id="aCodigo" value="${a?.codigo||''}" placeholder="Se genera automáticamente">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Categoría</label>
          <select class="form-select" id="aCategoria">
            <option value="">— Sin categoría —</option>
            ${optsSelect(categorias, a?.categoria_id)}
          </select>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Descripción <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="aDesc" value="${a?.descripcion||''}" placeholder="Ej: Notebook HP Pavilion">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Marca</label>
          <input type="text" class="form-control" id="aMarca" value="${a?.marca||''}">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Modelo</label>
          <input type="text" class="form-control" id="aModelo" value="${a?.modelo||''}">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">N° de serie</label>
          <input type="text" class="form-control" id="aSerie" value="${a?.numero_serie||''}">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Fecha de compra</label>
          <input type="date" class="form-control" id="aFecha" value="${a?.fecha_compra?.substring(0,10)||''}">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Valor compra ($)</label>
          <input type="number" class="form-control" id="aValor" value="${a?.valor_compra||''}" min="0" step="0.01">
        </div>
        <div class="col-4">
          <label class="form-label fw-semibold">Ubicación</label>
          <select class="form-select" id="aUbicacion">
            <option value="">— Sin ubicación —</option>
            ${optsSelect(ubicaciones, a?.ubicacion_id)}
          </select>
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Responsable</label>
          <select class="form-select" id="aResponsable">
            <option value="">— Sin responsable —</option>
            ${optsSelect(responsables, a?.responsable_id, i => `${i.nombre} ${i.apellido}`)}
          </select>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Observaciones</label>
          <textarea class="form-control" id="aObs" rows="2">${a?.observaciones||''}</textarea>
        </div>
      </div>`;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    document.getElementById('btnModalSave').onclick = () => save(a?.id, modal);
    modal.show();
  };

  const save = async (id, modal) => {
    try {
      const val = (elemId) => document.getElementById(elemId);
      const body = {
        codigo:        val('aCodigo').value.trim()    || undefined,
        descripcion:   val('aDesc').value.trim(),
        categoriaId:   val('aCategoria').value        || undefined,
        marca:         val('aMarca').value.trim()     || undefined,
        modelo:        val('aModelo').value.trim()    || undefined,
        numeroSerie:   val('aSerie').value.trim()     || undefined,
        fechaCompra:   val('aFecha').value            || undefined,
        valorCompra:   parseFloat(val('aValor').value) || undefined,
        ubicacionId:   val('aUbicacion').value        || undefined,
        responsableId: val('aResponsable').value      || undefined,
        observaciones: val('aObs').value.trim()       || undefined,
        prefijoCategoria: categorias.find(c => c.id == val('aCategoria').value)?.nombre?.substring(0,3).toUpperCase() || 'ACT',
      };

      if (!body.descripcion) { toast('warning', 'La descripción es obligatoria'); return; }

      const r = id ? await API.put(`/activos/${id}`, body) : await API.post('/activos', body);
      if (!r?.success) { toast('error', r?.message || 'Error al guardar'); return; }
      toast('success', id ? 'Activo actualizado' : 'Activo creado');
      modal.hide();
      await new Promise(r => setTimeout(r, 350));
      await load();
    } catch (e) {
      console.error('Error en save activo:', e);
      toast('error', 'Error inesperado: ' + e.message);
    }
  };

  const ver = async (id) => {
    const r = await API.get(`/activos/${id}`);
    if (!r?.success) return;
    const a = r.data;
    document.getElementById('modalTitle').textContent = `Detalle: ${a.codigo}`;
    document.getElementById('modalBody').innerHTML = `
      <div class="row g-2">
        <div class="col-6"><strong>Código:</strong> ${a.codigo}</div>
        <div class="col-6"><strong>Categoría:</strong> ${a.categoria_nombre||'—'}</div>
        <div class="col-12"><strong>Descripción:</strong> ${a.descripcion}</div>
        <div class="col-4"><strong>Marca:</strong> ${a.marca||'—'}</div>
        <div class="col-4"><strong>Modelo:</strong> ${a.modelo||'—'}</div>
        <div class="col-4"><strong>N° Serie:</strong> ${a.numero_serie||'—'}</div>
        <div class="col-4"><strong>Estado:</strong> ${a.estado_nombre ? badgeEstado(a.estado_nombre, a.estado_color) : '—'}</div>
        <div class="col-4"><strong>Ubicación:</strong> ${a.ubicacion_nombre||'—'}</div>
        <div class="col-4"><strong>Responsable:</strong> ${a.responsable_nombre ? `${a.responsable_nombre} ${a.responsable_apellido}` : '—'}</div>
        <div class="col-4"><strong>Fecha compra:</strong> ${fechaCorta(a.fecha_compra)}</div>
        <div class="col-4"><strong>Valor:</strong> ${a.valor_compra ? `$${Number(a.valor_compra).toLocaleString('es-AR')}` : '—'}</div>
        <div class="col-4"><strong>Alta:</strong> ${fechaCorta(a.created_at)}</div>
        ${a.observaciones ? `<div class="col-12"><strong>Observaciones:</strong> ${a.observaciones}</div>` : ''}
      </div>`;
    document.getElementById('btnModalSave').style.display = 'none';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    modal._element.addEventListener('hidden.bs.modal', () => {
      document.getElementById('btnModalSave').style.display = '';
    }, { once: true });
    modal.show();
  };

  const editar = async (id) => {
    const r = await API.get(`/activos/${id}`);
    if (r?.success) openModal(r.data);
  };

  const baja = async (id, codigo) => {
    const { value: motivo } = await Swal.fire({
      title: `Dar de baja: ${codigo}`,
      input: 'text', inputLabel: 'Motivo de baja',
      inputPlaceholder: 'Ej: Fin de vida útil, rotura, etc.',
      showCancelButton: true, confirmButtonText: 'Confirmar baja',
      confirmButtonColor: '#dc2626', cancelButtonText: 'Cancelar',
      inputValidator: v => !v && 'El motivo es obligatorio',
    });
    if (!motivo) return;
    const r = await API.patch(`/activos/${id}/baja`, { motivo });
    if (r?.success) { toast('success', 'Activo dado de baja'); await load(); }
    else toast('error', r?.message || 'Error');
  };

  const importar = () => {
    document.getElementById('modalTitle').textContent = 'Importar activos desde CSV';
    document.getElementById('modalBody').innerHTML = `
      <p class="text-muted mb-3">Seleccioná un archivo CSV con el formato de la plantilla para crear activos masivamente.</p>
      <div class="mb-3">
        <label class="form-label fw-semibold">Archivo CSV <span class="text-danger">*</span></label>
        <input type="file" class="form-control" id="importFile" accept=".csv">
      </div>
      <div id="importResult" class="d-none"></div>`;
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalForm'));
    const saveBtn = document.getElementById('btnModalSave');
    saveBtn.innerHTML = '<i class="fa-solid fa-upload me-1"></i>Importar';
    saveBtn.onclick = () => doImport(modal);
    modal._element.addEventListener('hidden.bs.modal', () => {
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i>Guardar';
    }, { once: true });
    modal.show();
  };

  const doImport = async (modal) => {
    const file = document.getElementById('importFile')?.files[0];
    if (!file) { toast('warning', 'Seleccioná un archivo CSV'); return; }
    const formData = new FormData();
    formData.append('archivo', file);
    const btn = document.getElementById('btnModalSave');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Importando...';
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/activos/importar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const r = await res.json();
      const div = document.getElementById('importResult');
      if (r?.success) {
        const d = r.data;
        div.className = 'alert alert-success mt-2';
        div.innerHTML = `<strong>Importación completada</strong><br>
          Procesados: ${d.total} &nbsp;|&nbsp; Creados: <strong>${d.creados}</strong> &nbsp;|&nbsp; Errores: ${d.errores?.length || 0}
          ${d.errores?.length ? `<hr class="my-2"><small>${d.errores.slice(0, 5).map(e => `Fila ${e.fila}: ${e.error}`).join('<br>')}</small>` : ''}`;
        div.classList.remove('d-none');
        if (d.creados > 0) await load();
      } else {
        div.className = 'alert alert-danger mt-2';
        div.innerHTML = r?.message || 'Error al importar';
        div.classList.remove('d-none');
      }
    } catch { toast('error', 'Error al importar'); }
    finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-upload me-1"></i>Importar';
    }
  };

  const descargarPlantilla = async () => {
    const token = localStorage.getItem('accessToken');
    const resp = await fetch('/api/activos/importar/plantilla', { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) { toast('error', 'Error al descargar plantilla'); return; }
    const blob = await resp.blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'plantilla_activos.csv' });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(a.href);
  };

  return { init, editar, ver, baja };
})();
