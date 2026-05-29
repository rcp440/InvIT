const repo       = require('./usuarios.repository');
const authService = require('../auth/auth.service');
const { query }  = require('../../config/database');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');
const { checkLimiteUsuarios } = require('../../utils/plan.helper');

const listar = async (tenantId, queryParams) => {
    const { page, limit, offset, order, direction } = parsePagination(queryParams);
    const search = queryParams.search || null;
    const activo = queryParams.activo !== undefined
        ? queryParams.activo === 'true'
        : undefined;

    const { total, rows } = await repo.findAll({ tenantId, limit, offset, order, direction, search, activo });
    return { data: rows, meta: buildMeta(total, page, limit) };
};

const obtener = async (id, tenantId) => {
    const usuario = await repo.findById(id, tenantId);
    if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    return usuario;
};

const crear = async (tenantId, datos) => {
    await checkLimiteUsuarios(tenantId);

    const { nombre, apellido, email, password, rolNombre } = datos;

    // Verificar que el rol exista y sea permitido para el tenant
    const { rows: roles } = await query(
        "SELECT id, nombre FROM roles WHERE nombre = $1 AND nombre != 'superadmin'",
        [rolNombre]
    );
    if (!roles.length) throw Object.assign(new Error('Rol inválido'), { status: 400 });

    const passwordHash = await authService.hashPassword(password);

    return repo.create({ tenantId, nombre, apellido, email, passwordHash, rolId: roles[0].id });
};

const actualizar = async (id, tenantId, datos, solicitanteRol) => {
    const usuario = await repo.findById(id, tenantId);
    if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

    // Solo superadmin puede cambiar roles
    if (datos.rol_id && solicitanteRol !== 'superadmin' && datos.rol_id !== usuario.rol_id) {
        throw Object.assign(new Error('No tiene permisos para cambiar el rol'), { status: 403 });
    }

    return repo.update(id, tenantId, datos);
};

const cambiarPassword = async (id, tenantId, passwordNueva) => {
    const usuario = await repo.findById(id, tenantId);
    if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

    const hash = await authService.hashPassword(passwordNueva);
    await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, id]);
};

const eliminar = async (id, tenantId, solicitanteId) => {
    if (id === solicitanteId) {
        throw Object.assign(new Error('No puede desactivar su propia cuenta'), { status: 400 });
    }
    const resultado = await repo.softDelete(id, tenantId);
    if (!resultado) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    return resultado;
};

const getRoles = async () => {
    const { rows } = await query(
        "SELECT id, nombre, descripcion FROM roles WHERE nombre != 'superadmin' ORDER BY id"
    );
    return rows;
};

module.exports = { listar, obtener, crear, actualizar, cambiarPassword, eliminar, getRoles };
