/**
 * app.js — Inicialización, router SPA y navegación del sidebar.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.check()) return;

  const usuario = Auth.getUsuario();

  // ── Cargar datos del usuario en la UI ──────────────────────
  document.getElementById('userName').textContent  = `${usuario.nombre} ${usuario.apellido}`;
  document.getElementById('userRole').textContent  = rolLabel(usuario.rol);
  document.getElementById('userAvatar').textContent = iniciales(usuario.nombre, usuario.apellido);

  if (Auth.hasRole('superadmin', 'admin_empresa')) {
    document.getElementById('menuAdmin').style.display      = '';
    document.getElementById('menuAdminLinks').style.display = '';
  }
  if (!Auth.hasRole('superadmin')) {
    document.getElementById('linkEmpresas')?.closest('li')?.remove();
  }

  // ── Sidebar toggle (móvil) ─────────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

  // ── Logout ─────────────────────────────────────────────────
  document.getElementById('btnLogout').addEventListener('click', () => {
    Swal.fire({
      title: '¿Cerrar sesión?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar', confirmButtonColor: '#1e3a5f',
    }).then(r => { if (r.isConfirmed) Auth.logout(); });
  });

  // ── Router SPA ─────────────────────────────────────────────
  const pages = {
    dashboard:   { title: 'Dashboard',    init: Dashboard.init   },
    activos:     { title: 'Activos',       init: Activos.init     },
    categorias:  { title: 'Categorías',    init: Categorias.init  },
    ubicaciones: { title: 'Ubicaciones',   init: Ubicaciones.init },
    responsables:{ title: 'Responsables',  init: Responsables.init},
    usuarios:    { title: 'Usuarios',      init: Usuarios.init    },
    movimientos: { title: 'Movimientos',   init: Movimientos.init },
    estados:     { title: 'Estados',       init: Estados.init     },
    reportes:    { title: 'Reportes',      init: Reportes.init    },
    auditoria:   { title: 'Auditoría',     init: Auditoria.init   },
    empresas:    { title: 'Empresas',      init: Empresas.init    },
  };

  let currentPage = null;

  const navigateTo = (page) => {
    if (!(page in pages)) page = 'dashboard';
    if (currentPage === page) return;
    currentPage = page;

    // Ocultar todas las secciones
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('d-none'));
    document.getElementById(`page-${page}`)?.classList.remove('d-none');

    // Actualizar sidebar
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    // Breadcrumb
    document.getElementById('pageTitle').textContent = pages[page].title;

    // Cerrar sidebar en móvil
    closeSidebar();

    // Inicializar módulo
    pages[page]?.init?.();
  };

  // Clicks en el sidebar
  document.querySelectorAll('.sidebar-nav .nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Navegar a dashboard al cargar
  navigateTo('dashboard');
});

// ── Helpers globales ───────────────────────────────────────────
function iniciales(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || '??';
}

function rolLabel(rol) {
  const m = { superadmin: 'Super Admin', admin_empresa: 'Administrador', operador: 'Operador' };
  return m[rol] || rol;
}

function fechaCorta(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function tipoMovLabel(tipo) {
  const m = {
    asignacion: 'Asignación', traslado: 'Traslado', baja: 'Baja',
    reingreso: 'Reingreso', reparacion: 'Reparación', devolucion: 'Devolución',
    actualizacion: 'Actualización',
  };
  return m[tipo] || tipo;
}

function badgeActivo(activo) {
  return activo
    ? '<span class="badge-estado badge-activo"><i class="fa-solid fa-circle-check"></i> Activo</span>'
    : '<span class="badge-estado badge-inactivo"><i class="fa-solid fa-circle-xmark"></i> Inactivo</span>';
}

function badgeEstado(nombre, color) {
  const c = color || '#6c757d';
  const bg = c + '22';
  return `<span class="badge-estado" style="background:${bg};color:${c}">${nombre || '—'}</span>`;
}

function toast(icon, title, timer = 2500) {
  Swal.fire({ icon, title, toast: true, position: 'top-end', showConfirmButton: false, timer });
}

function confirmDelete(nombre) {
  return Swal.fire({
    title: '¿Eliminar?',
    html: `Se desactivará: <strong>${nombre}</strong>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });
}

// DataTable factory con opciones por defecto en español
function makeTable(id, columns, data = []) {
  if ($.fn.DataTable.isDataTable(`#${id}`)) $(`#${id}`).DataTable().destroy();
  return $(`#${id}`).DataTable({
    data,
    columns,
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json',
    },
    pageLength: 15,
    order: [],
  });
}
