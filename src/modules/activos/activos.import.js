/**
 * Lógica de importación masiva de activos desde CSV.
 * Separado del service principal para mantenerlo limpio.
 */
const { parse }  = require('csv-parse/sync');
const { query }  = require('../../config/database');
const repo       = require('./activos.repository');
const movsRepo   = require('../movimientos/movimientos.repository');
const { checkLimiteActivos } = require('../../utils/plan.helper');

// Cabeceras esperadas (case-insensitive, se normalizan)
const HEADERS = ['descripcion','marca','modelo','numero_serie','fecha_compra',
                 'valor_compra','categoria','estado','ubicacion','responsable','observaciones'];

// Carga catálogos del tenant en memoria para resolver nombres → IDs
const cargarCatalogos = async (tenantId) => {
    const [cats, ests, ubics, resps] = await Promise.all([
        query('SELECT id, LOWER(nombre) AS nombre FROM categorias  WHERE tenant_id=$1 AND activo=true', [tenantId]),
        query('SELECT id, LOWER(nombre) AS nombre FROM estados',  []),
        query('SELECT id, LOWER(nombre) AS nombre FROM ubicaciones WHERE tenant_id=$1 AND activo=true', [tenantId]),
        query(`SELECT id, LOWER(nombre||' '||apellido) AS nombre_completo,
                      LOWER(nombre) AS nombre
               FROM responsables WHERE tenant_id=$1 AND activo=true`, [tenantId]),
    ]);

    const mapBy = (rows, key = 'nombre') =>
        Object.fromEntries(rows.map(r => [r[key], r.id]));

    return {
        categorias:   mapBy(cats.rows),
        estados:      mapBy(ests.rows),
        ubicaciones:  mapBy(ubics.rows),
        responsables: { ...mapBy(resps.rows, 'nombre_completo'), ...mapBy(resps.rows, 'nombre') },
    };
};

const parsearCSV = (buffer) => {
    const texto = buffer.toString('utf-8').replace(/^﻿/, ''); // quitar BOM si existe
    return parse(texto, {
        columns:          true,
        skip_empty_lines: true,
        trim:             true,
        relax_column_count: true,
    });
};

const normalizarFila = (fila) => {
    const out = {};
    for (const [k, v] of Object.entries(fila)) {
        out[k.toLowerCase().trim().replace(/\s+/g, '_')] = v?.trim() || '';
    }
    return out;
};

const resolverIds = (fila, catalogs) => ({
    categoriaId:   fila.categoria   ? catalogs.categorias[fila.categoria.toLowerCase()]   || null : null,
    estadoId:      fila.estado      ? catalogs.estados[fila.estado.toLowerCase()]         || null : null,
    ubicacionId:   fila.ubicacion   ? catalogs.ubicaciones[fila.ubicacion.toLowerCase()]  || null : null,
    responsableId: fila.responsable ? catalogs.responsables[fila.responsable.toLowerCase()] || null : null,
});

const validarFila = (fila, num) => {
    const errores = [];
    if (!fila.descripcion) errores.push('descripcion es requerida');
    if (fila.fecha_compra && !/^\d{4}-\d{2}-\d{2}$/.test(fila.fecha_compra))
        errores.push('fecha_compra debe ser YYYY-MM-DD');
    if (fila.valor_compra && isNaN(parseFloat(fila.valor_compra)))
        errores.push('valor_compra debe ser numérico');
    return errores.map(e => `Fila ${num}: ${e}`);
};

const importarDesdeCSV = async (buffer, tenantId, usuarioId) => {
    await checkLimiteActivos(tenantId);

    let filas;
    try {
        filas = parsearCSV(buffer);
    } catch (e) {
        throw Object.assign(new Error('El archivo no es un CSV válido'), { status: 422 });
    }

    if (!filas.length) {
        throw Object.assign(new Error('El archivo está vacío'), { status: 422 });
    }

    const catalogs = await cargarCatalogos(tenantId);
    const creados  = [];
    const errores  = [];

    for (let i = 0; i < filas.length; i++) {
        const fila = normalizarFila(filas[i]);
        const num  = i + 2; // +2 = encabezado + base 1

        const errFila = validarFila(fila, num);
        if (errFila.length) { errores.push(...errFila); continue; }

        // Verificar límite antes de cada creación (puede haber muchas filas)
        try { await checkLimiteActivos(tenantId); }
        catch { errores.push(`Fila ${num}: límite de activos alcanzado, filas restantes ignoradas`); break; }

        try {
            const prefijo = fila.categoria?.slice(0, 2).toUpperCase() || 'AC';
            const codigo  = await repo.generarCodigo(tenantId, prefijo);
            const ids     = resolverIds(fila, catalogs);

            const activo = await repo.create({
                tenantId,
                codigo,
                descripcion:   fila.descripcion,
                categoriaId:   ids.categoriaId,
                marca:         fila.marca         || null,
                modelo:        fila.modelo        || null,
                numeroSerie:   fila.numero_serie  || null,
                fechaCompra:   fila.fecha_compra  || null,
                valorCompra:   fila.valor_compra  ? parseFloat(fila.valor_compra) : null,
                estadoId:      ids.estadoId,
                ubicacionId:   ids.ubicacionId,
                responsableId: ids.responsableId,
                observaciones: fila.observaciones || null,
                fotoUrl:       null,
            }, usuarioId);

            await movsRepo.create({
                tenantId,
                activoId:             activo.id,
                tipo:                 'asignacion',
                ubicacionDestinoId:   ids.ubicacionId,
                responsableDestinoId: ids.responsableId,
                estadoNuevoId:        ids.estadoId,
                observaciones:        'Importación masiva CSV',
                usuarioId,
            });

            creados.push(activo.codigo);
        } catch (e) {
            errores.push(`Fila ${num} (${fila.descripcion}): ${e.message}`);
        }
    }

    return { total: filas.length, creados: creados.length, errores };
};

// Genera el CSV de plantilla para que el usuario descargue
const plantillaCSV = () => {
    const BOM  = '﻿';
    const cols = ['descripcion','marca','modelo','numero_serie','fecha_compra',
                  'valor_compra','categoria','estado','ubicacion','responsable','observaciones'];
    const ejemplo = ['Notebook HP EliteBook 840','HP','EliteBook 840 G9','5CD2345XY',
                     '2024-03-15','280000','Notebook','En uso','2° Piso - Sistemas','Juan Pérez',''];
    return BOM + cols.join(',') + '\r\n' + ejemplo.join(',') + '\r\n';
};

module.exports = { importarDesdeCSV, plantillaCSV };
