$server  = "rcp@192.0.1.5"
$dest    = "/opt/inventarioit"
$keyFile = "$env:USERPROFILE\.ssh\id_rsa"
$sshOpts = "-o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes"

# ── 1. Clave SSH ─────────────────────────────────────────────────────────────
if (-not (Test-Path "$keyFile.pub")) {
    Write-Host "Generando clave SSH local..." -ForegroundColor Cyan
    if (-not (Test-Path (Split-Path $keyFile))) {
        New-Item -ItemType Directory (Split-Path $keyFile) | Out-Null
    }
    cmd /c "ssh-keygen -t rsa -b 2048 -f `"$keyFile`" -N `"`""
    if (-not (Test-Path "$keyFile.pub")) {
        Write-Host "Error generando clave SSH." -ForegroundColor Red; exit 1
    }
}

# ── 2. Instalar clave en el servidor (solo si aún no funciona sin contraseña) ─
$sshTest = "ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no $server echo ok"
$ok = cmd /c $sshTest 2>$null
if ($ok -ne "ok") {
    Write-Host "Ingresa la contraseña del servidor UNA sola vez:" -ForegroundColor Yellow
    Get-Content "$keyFile.pub" | ssh -o StrictHostKeyChecking=no $server `
        "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
    if ($LASTEXITCODE -ne 0) { Write-Host "Error configurando SSH." -ForegroundColor Red; exit 1 }
    Write-Host "Clave instalada. Proximas ejecuciones no pediran contraseña." -ForegroundColor Green
}

# ── 3. Archivos a copiar ─────────────────────────────────────────────────────
$files = @(
    "package.json",
    "package-lock.json",
    "src/routes/index.js",
    "public/index.html",
    "public/login.html",
    "public/css/app.css",
    "public/js/app.js",
    "public/js/modules/dashboard.js",
    "public/js/modules/activos.js",
    "public/js/modules/estados.js",
    "public/js/modules/reportes.js",
    "public/js/modules/auditoria.js",
    "public/reset-password.html",
    "src/modules/activos/activos.import.js",
    "src/modules/activos/activos.controller.js",
    "src/modules/activos/activos.routes.js",
    "src/modules/dashboard/dashboard.repository.js",
    "src/modules/dashboard/dashboard.controller.js",
    "src/modules/dashboard/dashboard.routes.js",
    "src/modules/estados/estados.repository.js",
    "src/modules/estados/estados.controller.js",
    "src/modules/estados/estados.routes.js",
    "src/utils/plan.helper.js",
    "src/utils/email.helper.js",
    "src/modules/auth/auth.service.js",
    "src/modules/auth/auth.controller.js",
    "src/modules/auth/auth.routes.js",
    "src/modules/auditoria/auditoria.repository.js",
    "src/modules/auditoria/auditoria.controller.js",
    "src/modules/auditoria/auditoria.routes.js",
    "src/modules/reportes/reportes.repository.js",
    "src/modules/reportes/reportes.helper.js",
    "src/modules/reportes/reportes.controller.js",
    "src/modules/reportes/reportes.routes.js",
    "database/migrations/016_estados_por_tenant.sql"
)

# ── 4. Crear todos los directorios remotos de una sola vez ───────────────────
Write-Host "Preparando directorios remotos..." -ForegroundColor Cyan
$dirs = ($files | ForEach-Object {
    "$dest/" + (Split-Path $_ -Parent).Replace("\", "/")
} | Sort-Object -Unique)
$mkdirAll = ($dirs | ForEach-Object { "mkdir -p '$_'" }) -join " ; "
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $server $mkdirAll
if ($LASTEXITCODE -ne 0) { Write-Host "Error creando directorios." -ForegroundColor Red; exit 1 }

# ── 5. Copiar archivos ───────────────────────────────────────────────────────
Write-Host "Copiando archivos al servidor..." -ForegroundColor Cyan
$errors = 0
foreach ($f in $files) {
    $remote = "${server}:${dest}/$($f.Replace('\','/'))"
    scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no $f $remote
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK  $f" -ForegroundColor Green }
    else                     { Write-Host "  ERR $f" -ForegroundColor Red; $errors++ }
}

if ($errors -gt 0) {
    Write-Host "$errors archivo(s) fallaron." -ForegroundColor Red; exit 1
}

# ── 6. Post-deploy ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Instalando dependencias y reiniciando..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no $server `
    "cd $dest && npm ci --omit=dev && NODE_ENV=production node database/migrate.js && pm2 restart inventarioit && pm2 status"

Write-Host ""
Write-Host "Deploy completado!" -ForegroundColor Green
Write-Host ""
Read-Host "Presioná Enter para cerrar"
