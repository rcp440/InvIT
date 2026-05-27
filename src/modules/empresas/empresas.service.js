const repo           = require('./empresas.repository');
const usuariosRepo   = require('../usuarios/usuarios.repository');
const authService    = require('../auth/auth.service');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');

const listar = async (queryParams) => {
    const { page, limit, offset, order, direction } = parsePagination(queryParams);
    const { search, estado, plan } = queryParams;

    const { total, rows } = await repo.findAll({ limit, offset, order, direction, search, estado, plan });

    return {
        data: rows,
        meta: buildMeta(total, page, limit),
    };
};

const obtener = async (id) => {
    const empresa = await repo.findById(id);
    if (!empresa) {
        throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });
    }
    return empresa;
};

const crear = async (datos, adminEmail, adminNombre, adminApellido, adminPassword) => {
    // Crear la empresa
    const empresa = await repo.create(datos);

    // Crear el usuario admin_empresa automáticamente
    const { rows: [rol] } = await require('../../config/database').query(
        "SELECT id FROM roles WHERE nombre = 'admin_empresa'"
    );

    const passwordHash = await authService.hashPassword(adminPassword);

    await usuariosRepo.create({
        tenantId:  empresa.id,
        nombre:    adminNombre,
        apellido:  adminApellido,
        email:     adminEmail,
        passwordHash,
        rolId:     rol.id,
    });

    return empresa;
};

const actualizar = async (id, datos) => {
    const empresa = await repo.findById(id);
    if (!empresa) {
        throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });
    }

    return repo.update(id, datos);
};

const eliminar = async (id) => {
    const empresa = await repo.findById(id);
    if (!empresa) {
        throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });
    }

    return repo.softDelete(id);
};

const estadisticas = async (tenantId) => {
    return repo.getEstadisticas(tenantId);
};

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas };
