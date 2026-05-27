# InventarioIT — SaaS Multi-Tenant

Sistema SaaS profesional de inventario de muebles y equipamiento informático.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript Vanilla, Bootstrap 5 |
| Backend | Node.js + Express.js |
| Base de datos | PostgreSQL |
| Autenticación | JWT (access + refresh tokens) |
| Seguridad | Helmet, CORS, bcrypt, rate limiting |
| Logs | Winston |

---

## Arquitectura Multi-Tenant

Aislamiento lógico por `tenant_id` en todas las tablas operativas.

```
Request → JWT (extrae tenantId) → Middleware Tenant (valida empresa) → Repository (filtra por tenant_id)
```

### Flujo de autenticación

```
POST /api/auth/login
  └─ Valida credenciales
  └─ Genera JWT { userId, email, tenantId, rolNombre }
  └─ Genera Refresh Token
  └─ Registra auditoría LOGIN

Requests autenticadas:
  Authorization: Bearer <accessToken>
  X-Tenant-ID: <uuid>  (opcional, solo SuperAdmin para impersonar tenant)
```

---

## Roles

| Rol | Descripción |
|-----|-------------|
| `superadmin` | Administrador global. Sin tenant. Acceso total. |
| `admin_empresa` | Admin de su empresa. Gestiona usuarios y activos. |
| `operador` | Consulta y registra movimientos. Sin eliminar. |

---

## Estructura del Proyecto

```
inventario-it/
├── src/
│   ├── config/
│   │   ├── database.js       # Pool PostgreSQL
│   │   └── app.js            # Express app (middlewares, rutas)
│   ├── middleware/
│   │   ├── auth.middleware.js    # Verifica JWT
│   │   ├── tenant.middleware.js  # Resuelve y valida tenant_id
│   │   ├── roles.middleware.js   # Control de acceso por rol/permiso
│   │   ├── validate.middleware.js # express-validator handler
│   │   └── error.middleware.js   # Manejo global de errores
│   ├── modules/
│   │   ├── auth/             # Login, refresh, cambiar password
│   │   ├── empresas/         # CRUD de tenants (solo superadmin)
│   │   ├── usuarios/         # CRUD de usuarios por tenant
│   │   ├── activos/          # CRUD de activos
│   │   ├── categorias/       # Categorías por tenant
│   │   ├── ubicaciones/      # Ubicaciones físicas
│   │   ├── responsables/     # Responsables de activos
│   │   ├── movimientos/      # Historial de movimientos
│   │   └── reportes/         # Reportes y exportaciones
│   ├── routes/
│   │   └── index.js          # Router principal
│   └── utils/
│       ├── response.helper.js  # Respuestas HTTP estandarizadas
│       ├── pagination.helper.js # Paginación
│       ├── audit.helper.js     # Registro de auditoría
│       └── logger.js           # Winston logger
├── database/
│   ├── migrations/           # Scripts SQL ordenados (001..011)
│   ├── seeds/                # Datos iniciales (roles, estados, superadmin)
│   ├── migrate.js            # Runner de migraciones
│   └── seed.js               # Runner de seeds
├── public/                   # Frontend estático
├── logs/                     # Logs del servidor
├── server.js                 # Entry point
└── .env.example              # Variables de entorno de referencia
```

---

## Diagrama Entidad-Relación

```
empresas (1) ──────────── (N) usuarios
empresas (1) ──────────── (N) categorias
empresas (1) ──────────── (N) estados (propios)
empresas (1) ──────────── (N) ubicaciones
empresas (1) ──────────── (N) responsables
empresas (1) ──────────── (N) activos
empresas (1) ──────────── (N) movimientos

activos (N) ──── (1) categorias
activos (N) ──── (1) estados
activos (N) ──── (1) ubicaciones
activos (N) ──── (1) responsables

movimientos (N) ── (1) activos
movimientos (N) ── (1) ubicaciones (origen/destino)
movimientos (N) ── (1) responsables (origen/destino)
movimientos (N) ── (1) estados (anterior/nuevo)

usuarios (N) ──── (1) roles
roles (1) ──────── (N) usuarios
```

---

## Instalación

### 1. Prerrequisitos
- Node.js >= 18
- PostgreSQL >= 14

### 2. Clonar y configurar
```bash
git clone https://github.com/rcp440/InvIT.git
cd InvIT
npm install
cp .env.example .env
# Editar .env con las credenciales de PostgreSQL
```

### 3. Crear base de datos
```sql
CREATE DATABASE inventario_it;
```

### 4. Ejecutar migraciones y seeds
```bash
npm run migrate:seed
```

### 5. Iniciar servidor
```bash
npm run dev      # desarrollo (nodemon)
npm start        # producción
```

---

## Variables de Entorno Clave

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL |
| `JWT_SECRET` | Clave secreta JWT (mínimo 32 chars) |
| `JWT_EXPIRES_IN` | Duración del access token (ej: `8h`) |
| `JWT_REFRESH_SECRET` | Clave para refresh tokens |

---

## SuperAdmin Inicial

- **Email:** `superadmin@inventarioit.com`
- **Password:** `Admin@1234`
- **⚠️ Cambiar inmediatamente después del primer login**

---

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/cambiar-password` | Cambiar password |
| POST | `/api/auth/logout` | Logout |

### Empresas (SuperAdmin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/empresas` | Listar empresas |
| GET | `/api/empresas/:id` | Obtener empresa |
| POST | `/api/empresas` | Crear empresa + admin |
| PUT | `/api/empresas/:id` | Actualizar empresa |
| DELETE | `/api/empresas/:id` | Desactivar empresa |
| GET | `/api/empresas/:id/estadisticas` | Estadísticas del tenant |

---

## Seguridad Implementada

- JWT con expiración configurable
- Refresh tokens separados
- Bloqueo temporal por intentos fallidos (5 intentos → 15 min)
- bcrypt con 12 rounds
- Helmet (headers HTTP seguros)
- CORS configurado
- Rate limiting (global: 100 req/15min, auth: 10 req/15min)
- Validación backend con express-validator
- Consultas parametrizadas (anti SQL injection)
- Auditoría de todas las acciones críticas
- Aislamiento de datos por tenant_id
