const repo = require('./categorias.repository');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');

const listar = async (tenantId, q) => {
    const { page, limit, offset, order, direction } = parsePagination(q);
    const activo = q.activo !== undefined ? q.activo === 'true' : undefined;
    const { total, rows } = await repo.findAll({ tenantId, limit, offset, order, direction, search: q.search, activo });
    return { data: rows, meta: buildMeta(total, page, limit) };
};

const obtener = async (id, tenantId) => {
    const cat = await repo.findById(id, tenantId);
    if (!cat) throw Object.assign(new Error('Categoría no encontrada'), { status: 404 });
    return cat;
};

const crear = async (tenantId, datos) => repo.create({ tenantId, ...datos });

const actualizar = async (id, tenantId, datos) => {
    await obtener(id, tenantId);
    return repo.update(id, tenantId, datos);
};

const eliminar = async (id, tenantId) => {
    const r = await repo.remove(id, tenantId);
    if (!r) throw Object.assign(new Error('Categoría no encontrada'), { status: 404 });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
