param([switch]$Vision)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) { py -3.11 -m venv .venv }
$qalaPython = Join-Path $projectRoot '.venv/Scripts/python.exe'
& $qalaPython -m pip install -r backend/requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
if ($Vision) {
    & $qalaPython -m pip install -r backend/requirements-vision.txt
    if ($LASTEXITCODE -ne 0) { throw 'Vision dependency installation failed.' }
    $env:VISION_ENABLED = 'true'
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
$apiProcess = Start-Process -FilePath $qalaPython -ArgumentList $apiArguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput '.runtime/api.log' -RedirectStandardError '.runtime/api-error.log'
$frontendDir = Join-Path $projectRoot 'frontend'
$nodeProcess = Start-Process -FilePath 'node.exe' -ArgumentList 'node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1' -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot '.runtime/web.log') -RedirectStandardError (Join-Path $projectRoot '.runtime/web-error.log')
@{api=$apiProcess.Id;web=$nodeProcess.Id} | ConvertTo-Json | Set-Content -LiteralPath '.runtime/pids.json'
Write-Host 'QALA TWIN AI: http://127.0.0.1:3000/kk'
Write-Host 'API documentation: http://127.0.0.1:8000/docs'
