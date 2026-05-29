const ExcelJS = require('exceljs');

const HEADER_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
const HEADER_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const ALT_FILL     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F3F4' } };
const BORDER_THIN  = { style: 'thin', color: { argb: 'FFBDC3C7' } };
const CELL_BORDER  = { top: BORDER_THIN, left: BORDER_THIN, bottom: BORDER_THIN, right: BORDER_THIN };

const styleSheet = (sheet) => {
    sheet.getRow(1).eachCell(cell => {
        cell.fill   = HEADER_FILL;
        cell.font   = HEADER_FONT;
        cell.border = CELL_BORDER;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    });
    sheet.getRow(1).height = 22;
};

const styleDataRows = (sheet, rowCount) => {
    for (let r = 2; r <= rowCount + 1; r++) {
        sheet.getRow(r).eachCell({ includeEmpty: true }, cell => {
            cell.border = CELL_BORDER;
            if (r % 2 === 0) cell.fill = ALT_FILL;
        });
    }
};

const fmt = (val) => (val === null || val === undefined) ? '' : val;
const fmtDate = (val) => val ? new Date(val).toLocaleDateString('es-AR') : '';
const fmtMoney = (val) => val !== null && val !== undefined ? Number(val) : '';
const fmtDatetime = (val) => val ? new Date(val).toLocaleString('es-AR') : '';

// ── Inventario de activos ────────────────────────────────────────────────────
const buildActivosSheet = (sheet, rows) => {
    sheet.columns = [
        { header: 'Código',        key: 'codigo',               width: 13 },
        { header: 'Descripción',   key: 'descripcion',          width: 36 },
        { header: 'Categoría',     key: 'categoria',            width: 18 },
        { header: 'Estado',        key: 'estado',               width: 15 },
        { header: 'Marca',         key: 'marca',                width: 14 },
        { header: 'Modelo',        key: 'modelo',               width: 16 },
        { header: 'N° Serie',      key: 'numero_serie',         width: 18 },
        { header: 'Ubicación',     key: 'ubicacion',            width: 22 },
        { header: 'Piso/Sector',   key: 'piso_sector',          width: 16 },
        { header: 'Responsable',   key: 'responsable',          width: 22 },
        { header: 'Fecha compra',  key: 'fecha_compra',         width: 14 },
        { header: 'Valor ($)',     key: 'valor_compra',         width: 13 },
        { header: 'Observaciones', key: 'observaciones',        width: 28 },
        { header: 'Activo',        key: 'activo',               width: 8  },
        { header: 'Fecha baja',    key: 'baja_fecha',           width: 13 },
        { header: 'Motivo baja',   key: 'baja_motivo',          width: 28 },
        { header: 'Alta',          key: 'created_at',           width: 18 },
    ];

    rows.forEach(r => sheet.addRow({
        codigo:        fmt(r.codigo),
        descripcion:   fmt(r.descripcion),
        categoria:     fmt(r.categoria),
        estado:        fmt(r.estado),
        marca:         fmt(r.marca),
        modelo:        fmt(r.modelo),
        numero_serie:  fmt(r.numero_serie),
        ubicacion:     fmt(r.ubicacion),
        piso_sector:   [r.ubicacion_piso, r.ubicacion_sector].filter(Boolean).join(' / '),
        responsable:   [r.responsable_nombre, r.responsable_apellido].filter(Boolean).join(' '),
        fecha_compra:  fmtDate(r.fecha_compra),
        valor_compra:  fmtMoney(r.valor_compra),
        observaciones: fmt(r.observaciones),
        activo:        r.activo ? 'Sí' : 'No',
        baja_fecha:    fmtDate(r.baja_fecha),
        baja_motivo:   fmt(r.baja_motivo),
        created_at:    fmtDatetime(r.created_at),
    }));

    // Formato moneda en columna valor_compra
    const valCol = sheet.getColumn('valor_compra');
    valCol.numFmt = '#,##0.00';

    styleSheet(sheet);
    styleDataRows(sheet, rows.length);
};

// ── Movimientos ──────────────────────────────────────────────────────────────
const buildMovimientosSheet = (sheet, rows) => {
    sheet.columns = [
        { header: 'Fecha',             key: 'fecha',             width: 18 },
        { header: 'Tipo',              key: 'tipo',              width: 14 },
        { header: 'Código activo',     key: 'activo_codigo',     width: 14 },
        { header: 'Activo',            key: 'activo_desc',       width: 32 },
        { header: 'Ubic. origen',      key: 'ubic_origen',       width: 20 },
        { header: 'Ubic. destino',     key: 'ubic_destino',      width: 20 },
        { header: 'Resp. origen',      key: 'resp_origen',       width: 20 },
        { header: 'Resp. destino',     key: 'resp_destino',      width: 20 },
        { header: 'Estado anterior',   key: 'estado_anterior',   width: 16 },
        { header: 'Estado nuevo',      key: 'estado_nuevo',      width: 16 },
        { header: 'Usuario',           key: 'usuario',           width: 20 },
        { header: 'Observaciones',     key: 'observaciones',     width: 30 },
    ];

    rows.forEach(r => sheet.addRow({
        fecha:           fmtDatetime(r.fecha),
        tipo:            fmt(r.tipo),
        activo_codigo:   fmt(r.activo_codigo),
        activo_desc:     fmt(r.activo_descripcion),
        ubic_origen:     fmt(r.ubicacion_origen),
        ubic_destino:    fmt(r.ubicacion_destino),
        resp_origen:     [r.resp_origen_nombre, r.resp_origen_apellido].filter(Boolean).join(' '),
        resp_destino:    [r.resp_destino_nombre, r.resp_destino_apellido].filter(Boolean).join(' '),
        estado_anterior: fmt(r.estado_anterior),
        estado_nuevo:    fmt(r.estado_nuevo),
        usuario:         [r.usuario_nombre, r.usuario_apellido].filter(Boolean).join(' '),
        observaciones:   fmt(r.observaciones),
    }));

    styleSheet(sheet);
    styleDataRows(sheet, rows.length);
};

// ── Valoración ───────────────────────────────────────────────────────────────
const buildValoracionSheet = (sheet, rows) => {
    sheet.columns = [
        { header: 'Categoría',       key: 'categoria',      width: 20 },
        { header: 'Total activos',   key: 'cantidad',       width: 14 },
        { header: 'Activos',         key: 'activos',        width: 10 },
        { header: 'Dados de baja',   key: 'dados_de_baja',  width: 14 },
        { header: 'Valor activos ($)',key: 'valor_activos', width: 18 },
        { header: 'Valor total ($)', key: 'valor_total',    width: 16 },
    ];

    rows.forEach(r => sheet.addRow({
        categoria:     fmt(r.categoria),
        cantidad:      Number(r.cantidad),
        activos:       Number(r.activos),
        dados_de_baja: Number(r.dados_de_baja),
        valor_activos: fmtMoney(r.valor_activos),
        valor_total:   fmtMoney(r.valor_total),
    }));

    // Totales
    const totals = rows.reduce((acc, r) => ({
        cantidad:     acc.cantidad     + Number(r.cantidad),
        activos:      acc.activos      + Number(r.activos),
        dados_de_baja:acc.dados_de_baja + Number(r.dados_de_baja),
        valor_activos:acc.valor_activos + Number(r.valor_activos),
        valor_total:  acc.valor_total  + Number(r.valor_total),
    }), { cantidad: 0, activos: 0, dados_de_baja: 0, valor_activos: 0, valor_total: 0 });

    const totalRow = sheet.addRow({ categoria: 'TOTAL', ...totals });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF0FB' } };

    ['valor_activos', 'valor_total'].forEach(k => sheet.getColumn(k).numFmt = '#,##0.00');

    styleSheet(sheet);
    styleDataRows(sheet, rows.length);
};

// ── Exportadores principales ─────────────────────────────────────────────────
const toXlsx = async (res, filename, sheets) => {
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'InventarioIT SaaS';
    wb.created  = new Date();
    wb.modified = new Date();

    sheets.forEach(({ name, build, data }) => {
        const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
        build(ws, data);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
};

const toCsv = (res, filename, headers, rows, mapRow) => {
    const BOM   = '﻿';
    const esc   = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(','), ...rows.map(r => mapRow(r).map(esc).join(','))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(BOM + lines.join('\r\n'));
};

module.exports = { toXlsx, toCsv, buildActivosSheet, buildMovimientosSheet, buildValoracionSheet };
