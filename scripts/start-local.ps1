param([switch]$Vision, [switch]$OpenBrowser)
$ErrorActionPreference = 'Stop'
trap { Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$siteUrl = 'http://127.0.0.1:3000/kk'
function Test-QalaApi {
    try { $r = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 3; return ($r.status -eq 'ok' -and $null -ne $r.database) } catch { return $false }
}
function Test-QalaWeb {
    try { $r = Invoke-WebRequest $siteUrl -UseBasicParsing -TimeoutSec 5; return ($r.StatusCode -eq 200 -and $r.Content -match 'QALA TWIN AI') } catch { return $false }
}
$apiReady = Test-QalaApi
$webReady = Test-QalaWeb
if ($apiReady -and $webReady) {
    Write-Host "Already running: $siteUrl"
    if ($OpenBrowser) { Start-Process $siteUrl }
    exit 0
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or later, then try again.' }
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    py -3.11 -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.11 is required.' }
}
$qalaPython = Join-Path $projectRoot '.venv/Scripts/python.exe'
& $qalaPython -c 'import importlib.util, sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in (''fastapi'', ''uvicorn'', ''sqlalchemy'', ''psycopg'', ''openpyxl'', ''jwt'', ''multipart'', ''reportlab'', ''httpx'')) else 1)'
if ($LASTEXITCODE -ne 0) {
    & $qalaPython -m pip install -r backend/requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
}
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
$envText = Get-Content -LiteralPath '.env' -Raw
if (-not $apiReady -and $envText -match '(?m)^DATABASE_URL=.*(?:127\.0\.0\.1|localhost):5433/') {
    if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) { throw 'This .env requires Docker Desktop for PostgreSQL.' }
    docker.exe info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -ne 0) {
        $dockerDesktop = Join-Path $env:ProgramFiles 'Docker/Docker/Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Start Docker Desktop and try again.' }
        Write-Host 'Starting Docker Desktop...'
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        $dockerReady = $false
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            Start-Sleep -Seconds 3
            docker.exe info --format '{{.ServerVersion}}' *> $null
            if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
        }
        if (-not $dockerReady) { throw 'Docker Desktop did not become ready.' }
    }
    Write-Host 'Starting PostgreSQL...'
    docker.exe start qala-postgres-dev | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL container qala-postgres-dev is missing. Configure DATABASE_URL as described in README.md.' }
    $databaseReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        docker.exe exec qala-postgres-dev pg_isready -U qala -d qala *> $null
        if ($LASTEXITCODE -eq 0) { $databaseReady = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $databaseReady) { throw 'PostgreSQL did not become ready.' }
}
if ($Vision -or $envText -match '(?m)^VISION_ENABLED\s*=\s*true\s*$') {
    & $qalaPython -c 'import importlib.util, sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in (''ultralytics'', ''cv2'')) else 1)'
    if ($LASTEXITCODE -ne 0) {
        & $qalaPython -m pip install -r backend/requirements-vision.txt
        if ($LASTEXITCODE -ne 0) { throw 'Vision dependency installation failed.' }
    }
    if ($Vision) { $env:VISION_ENABLED = 'true' }
}
if (-not (Test-Path -LiteralPath 'frontend/node_modules')) {
    Push-Location -LiteralPath frontend
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    Pop-Location
}
New-Item -ItemType Directory -Force .runtime | Out-Null
$apiArguments = @('-m','uvicorn','backend.app.main:app','--host','127.0.0.1','--port','8000')
if (Test-Path -LiteralPath '.env') { $apiArguments += @('--env-file','.env') }
$pids = @{}
if (-not $apiReady) {
    $apiProcess = Start-Process -FilePath $qalaPython -ArgumentList $apiArguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput '.runtime/api.log' -RedirectStandardError '.runtime/api-error.log'
    $pids.api = $apiProcess.Id
}
$frontendDir = Join-Path $projectRoot 'frontend'
if (-not $webReady) {
    $nodeProcess = Start-Process -FilePath 'node.exe' -ArgumentList 'node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3000' -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot '.runtime/web.log') -RedirectStandardError (Join-Path $projectRoot '.runtime/web-error.log')
    $pids.web = $nodeProcess.Id
}
if ($pids.Count -gt 0) { $pids | ConvertTo-Json | Set-Content -LiteralPath '.runtime/pids.json' }
Write-Host 'Waiting for the application...'
$ready = $false
for ($attempt = 0; $attempt -lt 45; $attempt++) {
    if ((Test-QalaApi) -and (Test-QalaWeb)) { $ready = $true; break }
    if ($apiProcess -and $apiProcess.HasExited) { throw 'FastAPI stopped. Check .runtime/api-error.log.' }
    if ($nodeProcess -and $nodeProcess.HasExited) { throw 'Next.js stopped. Check .runtime/web-error.log.' }
    Start-Sleep -Seconds 2
}
if (-not $ready) { throw 'The application did not become ready. Check .runtime logs and ports 8000 / 3000.' }
Write-Host 'QALA TWIN AI: http://127.0.0.1:3000/kk'
Write-Host 'API documentation: http://127.0.0.1:8000/docs'
if ($OpenBrowser) { Start-Process $siteUrl }
exit 0
