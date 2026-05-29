/**
 * demo.js — Carga datos de demostración completos.
 * Crea empresa, admin, categorías, ubicaciones, responsables y activos de ejemplo.
 * Ejecutar: node database/demo.js
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt     = require('bcryptjs');

const client = new Client({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
    await client.connect();
    console.log('Conectado a PostgreSQL. Cargando datos demo...\n');

    // ── 1. EMPRESA DEMO ────────────────────────────────────────
    let empresaId;
    const { rows: emp } = await client.query(
        "SELECT id FROM empresas WHERE email = 'admin@tecnogrupo.com'"
    );
    if (emp.length) {
        empresaId = emp[0].id;
        console.log('[SKIP] Empresa demo ya existe:', empresaId);
    } else {
        const { rows } = await client.query(
            `INSERT INTO empresas (nombre, cuit, email, telefono, direccion, estado, plan)
             VALUES ($1,$2,$3,$4,$5,'activo','profesional') RETURNING id`,
            ['TecnoGrupo S.A.', '30-71234567-9', 'admin@tecnogrupo.com',
             '011-4567-8901', 'Av. Corrientes 1234, CABA']
        );
        empresaId = rows[0].id;
        console.log('[OK]   Empresa creada:', empresaId);
    }

    // ── 2. USUARIO ADMIN DE LA EMPRESA ─────────────────────────
    const { rows: usrExist } = await client.query(
        "SELECT id FROM usuarios WHERE email = 'admin@tecnogrupo.com'"
    );
    if (!usrExist.length) {
        const { rows: rol } = await client.query("SELECT id FROM roles WHERE nombre='admin_empresa'");
        const hash = await bcrypt.hash('Admin@1234', 12);
        await client.query(
            `INSERT INTO usuarios (tenant_id, nombre, apellido, email, password_hash, rol_id, activo)
             VALUES ($1,'María','González',$2,$3,$4,true)`,
            [empresaId, 'admin@tecnogrupo.com', hash, rol[0].id]
        );
        console.log('[OK]   Admin empresa creado: admin@tecnogrupo.com / Admin@1234');
    } else {
        console.log('[SKIP] Admin empresa ya existe');
    }

    // ── 3. USUARIO OPERADOR ────────────────────────────────────
    const { rows: opExist } = await client.query(
        "SELECT id FROM usuarios WHERE email = 'operador@tecnogrupo.com'"
    );
    if (!opExist.length) {
        const { rows: rol } = await client.query("SELECT id FROM roles WHERE nombre='operador'");
        const hash = await bcrypt.hash('Oper@1234', 12);
        await client.query(
            `INSERT INTO usuarios (tenant_id, nombre, apellido, email, password_hash, rol_id, activo)
             VALUES ($1,'Carlos','Pérez',$2,$3,$4,true)`,
            [empresaId, 'operador@tecnogrupo.com', hash, rol[0].id]
        );
        console.log('[OK]   Operador creado: operador@tecnogrupo.com / Oper@1234');
    } else {
        console.log('[SKIP] Operador ya existe');
    }

    // ── 4. CATEGORÍAS ──────────────────────────────────────────
    const categorias = [
        { nombre: 'Notebook',     icono: 'fa-solid fa-laptop',           color: '#3b82f6' },
        { nombre: 'PC Desktop',   icono: 'fa-solid fa-desktop',          color: '#6366f1' },
        { nombre: 'Monitor',      icono: 'fa-solid fa-display',          color: '#0ea5e9' },
        { nombre: 'Impresora',    icono: 'fa-solid fa-print',            color: '#8b5cf6' },
        { nombre: 'Router',       icono: 'fa-solid fa-wifi',             color: '#06b6d4' },
        { nombre: 'Switch',       icono: 'fa-solid fa-network-wired',    color: '#14b8a6' },
        { nombre: 'Teléfono IP',  icono: 'fa-solid fa-phone',            color: '#22c55e' },
        { nombre: 'UPS',          icono: 'fa-solid fa-battery-full',     color: '#f59e0b' },
        { nombre: 'Escritorio',   icono: 'fa-solid fa-table',            color: '#a16207' },
        { nombre: 'Silla',        icono: 'fa-solid fa-chair',            color: '#78716c' },
        { nombre: 'Proyector',    icono: 'fa-solid fa-video',            color: '#ef4444' },
        { nombre: 'Servidor',     icono: 'fa-solid fa-server',           color: '#1e40af' },
    ];

    const catIds = {};
    for (const cat of categorias) {
        const { rows: ex } = await client.query(
            'SELECT id FROM categorias WHERE nombre=$1 AND tenant_id=$2', [cat.nombre, empresaId]
        );
        if (ex.length) { catIds[cat.nombre] = ex[0].id; continue; }
        const { rows } = await client.query(
            `INSERT INTO categorias (tenant_id, nombre, icono, color) VALUES ($1,$2,$3,$4) RETURNING id`,
            [empresaId, cat.nombre, cat.icono, cat.color]
        );
        catIds[cat.nombre] = rows[0].id;
    }
    console.log('[OK]   Categorías cargadas:', Object.keys(catIds).length);

    // ── 5. UBICACIONES ─────────────────────────────────────────
    const ubicaciones = [
        { nombre: 'Planta Baja - Recepción',   piso: 'PB',  sector: 'Recepción'     },
        { nombre: 'Planta Baja - Sala Reunión', piso: 'PB',  sector: 'Sala Reunión'  },
        { nombre: '1° Piso - Administración',   piso: '1P',  sector: 'Administración'},
        { nombre: '1° Piso - Contabilidad',     piso: '1P',  sector: 'Contabilidad'  },
        { nombre: '1° Piso - RRHH',             piso: '1P',  sector: 'RRHH'          },
        { nombre: '2° Piso - Sistemas',         piso: '2P',  sector: 'Sistemas'      },
        { nombre: '2° Piso - Gerencia',         piso: '2P',  sector: 'Gerencia'      },
        { nombre: 'Depósito General',           piso: 'DEP', sector: 'Depósito'      },
        { nombre: 'Sala de Servidores',         piso: 'PB',  sector: 'IT'            },
    ];

    const ubicIds = {};
    for (const u of ubicaciones) {
        const { rows: ex } = await client.query(
            'SELECT id FROM ubicaciones WHERE nombre=$1 AND tenant_id=$2', [u.nombre, empresaId]
        );
        if (ex.length) { ubicIds[u.nombre] = ex[0].id; continue; }
        const { rows } = await client.query(
            `INSERT INTO ubicaciones (tenant_id, nombre, piso, sector) VALUES ($1,$2,$3,$4) RETURNING id`,
            [empresaId, u.nombre, u.piso, u.sector]
        );
        ubicIds[u.nombre] = rows[0].id;
    }
    console.log('[OK]   Ubicaciones cargadas:', Object.keys(ubicIds).length);

    // ── 6. RESPONSABLES ────────────────────────────────────────
    const responsables = [
        { nombre: 'Luciana', apellido: 'Fernández', email: 'lfernandez@tecnogrupo.com', depto: 'Administración', cargo: 'Jefa de Administración' },
        { nombre: 'Roberto', apellido: 'Silva',     email: 'rsilva@tecnogrupo.com',     depto: 'Sistemas',       cargo: 'Líder de IT'             },
        { nombre: 'Andrea',  apellido: 'López',     email: 'alopez@tecnogrupo.com',     depto: 'Contabilidad',   cargo: 'Contadora'               },
        { nombre: 'Martín',  apellido: 'Díaz',      email: 'mdiaz@tecnogrupo.com',      depto: 'RRHH',           cargo: 'Analista RRHH'           },
        { nombre: 'Sofía',   apellido: 'Ramírez',   email: 'sramirez@tecnogrupo.com',   depto: 'Gerencia',       cargo: 'Gerente General'         },
        { nombre: 'Diego',   apellido: 'Torres',    email: 'dtorres@tecnogrupo.com',    depto: 'Sistemas',       cargo: 'Técnico IT'              },
        { nombre: 'Valeria', apellido: 'Moreno',    email: 'vmoreno@tecnogrupo.com',    depto: 'Recepción',      cargo: 'Recepcionista'           },
    ];

    const respIds = {};
    for (const r of responsables) {
        const { rows: ex } = await client.query(
            'SELECT id FROM responsables WHERE email=$1 AND tenant_id=$2', [r.email, empresaId]
        );
        if (ex.length) { respIds[r.nombre] = ex[0].id; continue; }
        const { rows } = await client.query(
            `INSERT INTO responsables (tenant_id, nombre, apellido, email, departamento, cargo)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [empresaId, r.nombre, r.apellido, r.email, r.depto, r.cargo]
        );
        respIds[r.nombre] = rows[0].id;
    }
    console.log('[OK]   Responsables cargados:', Object.keys(respIds).length);

    // ── 7. ESTADOS GLOBALES ────────────────────────────────────
    const { rows: estados } = await client.query(
        'SELECT id, nombre FROM estados WHERE es_global = true'
    );
    const estIds = {};
    estados.forEach(e => { estIds[e.nombre] = e.id; });

    // ── 8. ACTIVOS ─────────────────────────────────────────────
    const { rows: adminUser } = await client.query(
        'SELECT id FROM usuarios WHERE email=$1', ['admin@tecnogrupo.com']
    );
    const usuarioId = adminUser[0].id;

    const activos = [
        // Notebooks
        { cod:'NB-0001', desc:'Notebook HP EliteBook 840 G9', cat:'Notebook',    marca:'HP',      modelo:'EliteBook 840 G9', serie:'CNU2234567', fc:'2023-03-15', val:280000, est:'En uso',      ubic:'2° Piso - Sistemas',        resp:'Roberto' },
        { cod:'NB-0002', desc:'Notebook Lenovo ThinkPad E14',  cat:'Notebook',    marca:'Lenovo',  modelo:'ThinkPad E14',     serie:'LNV8845621', fc:'2023-06-20', val:230000, est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        { cod:'NB-0003', desc:'Notebook Dell Latitude 5430',   cat:'Notebook',    marca:'Dell',    modelo:'Latitude 5430',    serie:'DLL9923411', fc:'2024-01-10', val:310000, est:'En uso',      ubic:'2° Piso - Gerencia',        resp:'Sofía'   },
        { cod:'NB-0004', desc:'Notebook Asus VivoBook 15',     cat:'Notebook',    marca:'Asus',    modelo:'VivoBook 15',      serie:'ASS1122334', fc:'2022-08-05', val:180000, est:'En reparación',ubic:'Depósito General',         resp:'Diego'   },
        // PC Desktop
        { cod:'PC-0001', desc:'PC Desktop Dell OptiPlex 7010', cat:'PC Desktop',  marca:'Dell',    modelo:'OptiPlex 7010',    serie:'DLL5512398', fc:'2022-11-20', val:190000, est:'En uso',      ubic:'1° Piso - Contabilidad',    resp:'Andrea'  },
        { cod:'PC-0002', desc:'PC Desktop HP ProDesk 400 G9',  cat:'PC Desktop',  marca:'HP',      modelo:'ProDesk 400 G9',   serie:'CNU3344556', fc:'2023-09-12', val:210000, est:'En uso',      ubic:'1° Piso - RRHH',            resp:'Martín'  },
        { cod:'PC-0003', desc:'PC Desktop Lenovo ThinkCentre', cat:'PC Desktop',  marca:'Lenovo',  modelo:'ThinkCentre M70q', serie:'LNV7788990', fc:'2021-05-30', val:150000, est:'En depósito', ubic:'Depósito General',          resp:null      },
        // Monitores
        { cod:'MO-0001', desc:'Monitor LG 24" Full HD IPS',    cat:'Monitor',     marca:'LG',      modelo:'24MK430H',         serie:'LG2023A001', fc:'2023-03-15', val:75000,  est:'En uso',      ubic:'2° Piso - Sistemas',        resp:'Roberto' },
        { cod:'MO-0002', desc:'Monitor Samsung 27" QHD',       cat:'Monitor',     marca:'Samsung', modelo:'S27B800QWU',       serie:'SAM2023B02', fc:'2023-06-20', val:120000, est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        { cod:'MO-0003', desc:'Monitor Dell 24" P2422H',       cat:'Monitor',     marca:'Dell',    modelo:'P2422H',           serie:'DLL2022M03', fc:'2022-11-20', val:85000,  est:'En uso',      ubic:'1° Piso - Contabilidad',    resp:'Andrea'  },
        { cod:'MO-0004', desc:'Monitor BenQ 24" GW2480',       cat:'Monitor',     marca:'BenQ',    modelo:'GW2480',           serie:'BNQ2021M04', fc:'2021-08-10', val:60000,  est:'En depósito', ubic:'Depósito General',          resp:null      },
        // Impresoras
        { cod:'IM-0001', desc:'Impresora HP LaserJet Pro M404n',cat:'Impresora',  marca:'HP',      modelo:'LaserJet M404n',   serie:'VNBJM12345', fc:'2022-04-18', val:95000,  est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        { cod:'IM-0002', desc:'Multifunción Epson EcoTank L3250',cat:'Impresora', marca:'Epson',   modelo:'EcoTank L3250',    serie:'EPS4456789', fc:'2023-02-14', val:68000,  est:'En uso',      ubic:'Planta Baja - Recepción',   resp:'Valeria' },
        // Red
        { cod:'RT-0001', desc:'Router Cisco RV340 VPN',        cat:'Router',      marca:'Cisco',   modelo:'RV340',            serie:'CSC2233445', fc:'2022-07-22', val:85000,  est:'En uso',      ubic:'Sala de Servidores',        resp:'Roberto' },
        { cod:'SW-0001', desc:'Switch TP-Link 24 puertos',     cat:'Switch',      marca:'TP-Link', modelo:'TL-SG1024S',       serie:'TPL5566778', fc:'2022-07-22', val:55000,  est:'En uso',      ubic:'Sala de Servidores',        resp:'Roberto' },
        { cod:'SW-0002', desc:'Switch Cisco SG350-10',         cat:'Switch',      marca:'Cisco',   modelo:'SG350-10',         serie:'CSC9900112', fc:'2023-11-05', val:120000, est:'En uso',      ubic:'2° Piso - Sistemas',        resp:'Diego'   },
        // Servidor
        { cod:'SV-0001', desc:'Servidor Dell PowerEdge R350',  cat:'Servidor',    marca:'Dell',    modelo:'PowerEdge R350',   serie:'DLLSRV8001', fc:'2022-01-15', val:890000, est:'En uso',      ubic:'Sala de Servidores',        resp:'Roberto' },
        // UPS
        { cod:'UP-0001', desc:'UPS APC Smart-UPS 1500VA',      cat:'UPS',         marca:'APC',     modelo:'SMT1500IC',        serie:'AS2234567X', fc:'2022-07-22', val:180000, est:'En uso',      ubic:'Sala de Servidores',        resp:'Roberto' },
        { cod:'UP-0002', desc:'UPS Forza FX-1500LCD 1500VA',   cat:'UPS',         marca:'Forza',   modelo:'FX-1500LCD',       serie:'FRZ3344556', fc:'2023-05-10', val:65000,  est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        // Teléfonos
        { cod:'TL-0001', desc:'Teléfono IP Grandstream GXP1615',cat:'Teléfono IP',marca:'Grandstream',modelo:'GXP1615',      serie:'GRS1122334', fc:'2022-03-01', val:25000,  est:'En uso',      ubic:'Planta Baja - Recepción',   resp:'Valeria' },
        // Mobiliario
        { cod:'ES-0001', desc:'Escritorio ejecutivo L 180cm',  cat:'Escritorio',  marca:'Ferroplast',modelo:'EjecutivoL180', serie:null,          fc:'2021-01-10', val:45000,  est:'En uso',      ubic:'2° Piso - Gerencia',        resp:'Sofía'   },
        { cod:'ES-0002', desc:'Escritorio recto 160cm',        cat:'Escritorio',  marca:'Ferroplast',modelo:'Recto160',      serie:null,          fc:'2021-01-10', val:28000,  est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        { cod:'SL-0001', desc:'Silla ejecutiva ergonómica',    cat:'Silla',       marca:'Kloter',  modelo:'ErgoPro',          serie:null,          fc:'2021-01-10', val:35000,  est:'En uso',      ubic:'2° Piso - Gerencia',        resp:'Sofía'   },
        { cod:'SL-0002', desc:'Silla operativa con apoyabrazos',cat:'Silla',      marca:'Kloter',  modelo:'OperPlus',         serie:null,          fc:'2022-06-15', val:18000,  est:'En uso',      ubic:'1° Piso - Administración',  resp:'Luciana' },
        { cod:'SL-0003', desc:'Silla ergonómica sistemas',     cat:'Silla',       marca:'Kloter',  modelo:'TechPro',          serie:null,          fc:'2022-06-15', val:22000,  est:'En uso',      ubic:'2° Piso - Sistemas',        resp:'Roberto' },
        // Proyector
        { cod:'PR-0001', desc:'Proyector Epson PowerLite X49',  cat:'Proyector',  marca:'Epson',   modelo:'PowerLite X49',    serie:'EPS7788990', fc:'2023-04-20', val:145000, est:'En depósito', ubic:'Depósito General',          resp:null      },
    ];

    let creadosActivos = 0;
    for (const a of activos) {
        const { rows: ex } = await client.query(
            'SELECT id FROM activos WHERE codigo=$1 AND tenant_id=$2', [a.cod, empresaId]
        );
        if (ex.length) continue;

        const catId  = catIds[a.cat]   || null;
        const estId  = estIds[a.est]   || null;
        const ubicId = a.ubic ? (ubicIds[a.ubic] || null) : null;
        const respId = a.resp ? (respIds[a.resp] || null) : null;

        const { rows: act } = await client.query(
            `INSERT INTO activos
             (tenant_id, codigo, descripcion, categoria_id, marca, modelo,
              numero_serie, fecha_compra, valor_compra, estado_id,
              ubicacion_id, responsable_id, created_by, updated_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
             RETURNING id`,
            [empresaId, a.cod, a.desc, catId, a.marca, a.modelo,
             a.serie || null, a.fc, a.val, estId, ubicId, respId, usuarioId]
        );

        // Movimiento de alta inicial
        await client.query(
            `INSERT INTO movimientos (tenant_id, activo_id, tipo, ubicacion_destino_id,
              responsable_destino_id, estado_nuevo_id, observaciones, usuario_id)
             VALUES ($1,$2,'asignacion',$3,$4,$5,'Alta inicial',$6)`,
            [empresaId, act[0].id, ubicId, respId, estId, usuarioId]
        );

        creadosActivos++;
    }
    console.log(`[OK]   Activos cargados: ${creadosActivos} nuevos`);

    console.log('\n─────────────────────────────────────────────');
    console.log('✓ Datos demo cargados correctamente.\n');
    console.log('ACCESOS DE PRUEBA:');
    console.log('  SuperAdmin:   superadmin@inventarioit.com  / Admin@1234');
    console.log('  AdminEmpresa: admin@tecnogrupo.com         / Admin@1234');
    console.log('  Operador:     operador@tecnogrupo.com      / Oper@1234');
    console.log('─────────────────────────────────────────────\n');
}

run()
    .catch(e => { console.error('[ERROR]', e.message); process.exit(1); })
    .finally(() => client.end());
