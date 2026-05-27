/**
 * Parsea y normaliza parámetros de paginación desde query string.
 * Devuelve { page, limit, offset, order, direction }
 */
const parsePagination = (query) => {
    const page      = Math.max(1, parseInt(query.page)  || 1);
    const limit     = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset    = (page - 1) * limit;
    const order     = query.order   || 'created_at';
    const direction = query.direction?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    return { page, limit, offset, order, direction };
};

/**
 * Genera el objeto meta de paginación para la respuesta.
 */
const buildMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext:    page < Math.ceil(total / limit),
    hasPrev:    page > 1,
});

module.exports = { parsePagination, buildMeta };
