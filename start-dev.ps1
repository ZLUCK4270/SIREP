# Script de inicio rápido de desarrollo para SIREP
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       🚀 INICIANDO ENTORNO DE DESARROLLO SIREP         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[0/2] Verificando y liberando puertos 3000 y 3001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

$rootDir = $PSScriptRoot

Write-Host "[1/2] Iniciando Backend en puerto 3000 (NestJS)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\sirep-back'; npm run start:dev"

Start-Sleep -Seconds 3

Write-Host "[2/2] Iniciando Frontend en puerto 3001 (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\sirep-front\app'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "       ✅ AMBOS SERVICIOS INICIADOS EN NUEVAS VENTANAS   " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host " • Frontend (Bandeja):     http://localhost:3001" -ForegroundColor Cyan
Write-Host " • Calibración Regiones:   http://localhost:3001/dev/regiones" -ForegroundColor Cyan
Write-Host " • Backend API:            http://localhost:3000" -ForegroundColor Cyan
Write-Host " • Swagger Docs:           http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host " • Health Check:           http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener los servicios, simplemente cierra las ventanas de terminal."
Write-Host "========================================================"

