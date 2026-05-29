const repo   = require('./reportes.repository');
const helper = require('./reportes.helper');

const stamp = () => new Date().toISOString().slice(0, 10);

// GET /api/reportes/activos
// ?formato=xlsx|csv &categoriaId &estadoId &ubicacionId &responsableId
// &incluirBajas=true &fechaDesde=YYYY-MM-DD &fechaHasta=YYYY-MM-DD
const activos = async (req, res, next) => {
    try {
        const {
            formato      = 'xlsx',
            categoriaId, estadoId, ubicacionId, responsableId,
            incluirBajas = 'false',
            fechaDesde, fechaHasta,
        } = req.query;

        const rows = await repo.getActivos({
            tenantId:     req.tenantId,
            categoriaId:  categoriaId  || null,
            estadoId:     estadoId     || null,
            ubicacionId:  ubicacionId  || null,
            responsableId:responsableId|| null,
            incluirBajas: incluirBajas === 'true',
            fechaDesde:   fechaDesde   || null,
            fechaHasta:   fechaHasta   || null,
        });

        const filename = `inventario_${stamp()}`;

        if (formato === 'csv') {
            const headers = ['Código','Descripción','Categoría','Estado','Marca','Modelo',
                             'N° Serie','Ubicación','Responsable','Fecha compra','Valor ($)',
                             'Observaciones','Activo','Fecha baja','Motivo baja'];
            return helper.toCsv(res, filename, headers, rows, r => [
                r.codigo, r.descripcion, r.categoria, r.estado,
                r.marca, r.modelo, r.numero_serie,
                [r.ubicacion, r.ubicacion_piso, r.ubicacion_sector].filter(Boolean).join(' - '),
                [r.responsable_nombre, r.responsable_apellido].filter(Boolean).join(' '),
                r.fecha_compra ? new Date(r.fecha_compra).toLocaleDateString('es-AR') : '',
                r.valor_compra ?? '',
                r.observaciones,
                r.activo ? 'Sí' : 'No',
                r.baja_fecha   ? new Date(r.baja_fecha).toLocaleDateString('es-AR') : '',
                r.baja_motivo,
            ]);
        }

        await helper.toXlsx(res, filename, [
            { name: 'Inventario', build: helper.buildActivosSheet, data: rows },
        ]);
    } catch (err) {
        next(err);
    }
};

// GET /api/reportes/movimientos
// ?formato=xlsx|csv &activoId &tipo &fechaDesde &fechaHasta
const movimientos = async (req, res, next) => {
    try {
        const { formato = 'xlsx', activoId, tipo, fechaDesde, fechaHasta } = req.query;

        const rows = await repo.getMovimientos({
            tenantId:  req.tenantId,
            activoId:  activoId  || null,
            tipo:      tipo      || null,
            fechaDesde:fechaDesde|| null,
            fechaHasta:fechaHasta|| null,
        });

        const filename = `movimientos_${stamp()}`;

        if (formato === 'csv') {
            const headers = ['Fecha','Tipo','Código activo','Activo','Ubic. origen','Ubic. destino',
                             'Resp. origen','Resp. destino','Estado anterior','Estado nuevo',
                             'Usuario','Observaciones'];
            return helper.toCsv(res, filename, headers, rows, r => [
                r.fecha ? new Date(r.fecha).toLocaleString('es-AR') : '',
                r.tipo, r.activo_codigo, r.activo_descripcion,
                r.ubicacion_origen, r.ubicacion_destino,
                [r.resp_origen_nombre, r.resp_origen_apellido].filter(Boolean).join(' '),
                [r.resp_destino_nombre, r.resp_destino_apellido].filter(Boolean).join(' '),
                r.estado_anterior, r.estado_nuevo,
                [r.usuario_nombre, r.usuario_apellido].filter(Boolean).join(' '),
                r.observaciones,
            ]);
        }

        await helper.toXlsx(res, filename, [
            { name: 'Movimientos', build: helper.buildMovimientosSheet, data: rows },
        ]);
    } catch (err) {
        next(err);
    }
};

// GET /api/reportes/valoracion
// ?formato=xlsx|csv
const valoracion = async (req, res, next) => {
    try {
        const { formato = 'xlsx' } = req.query;

        const rows = await repo.getValoracion(req.tenantId);
        const filename = `valoracion_${stamp()}`;

        if (formato === 'csv') {
            const headers = ['Categoría','Total','Activos','Dados de baja','Valor activos ($)','Valor total ($)'];
            return helper.toCsv(res, filename, headers, rows, r => [
                r.categoria, r.cantidad, r.activos, r.dados_de_baja, r.valor_activos, r.valor_total,
            ]);
        }

        await helper.toXlsx(res, filename, [
            { name: 'Valoración', build: helper.buildValoracionSheet, data: rows },
        ]);
    } catch (err) {
        next(err);
    }
};

module.exports = { activos, movimientos, valoracion };
