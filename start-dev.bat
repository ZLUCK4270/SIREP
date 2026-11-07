@echo off
chcp 65001 > nul
title SIREP - Iniciador de Desarrollo

echo ========================================================
echo        🚀 INICIANDO ENTORNO DE DESARROLLO SIREP
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/2] Iniciando Backend en puerto 3000 (NestJS)...
start "SIREP - Backend (NestJS :3000)" cmd /k "cd /d "%ROOT_DIR%sirep-back" && npm run start:dev"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend en puerto 3001 (Next.js)...
start "SIREP - Frontend (Next.js :3001)" cmd /k "cd /d "%ROOT_DIR%sirep-front\app" && npm run dev"

echo.
echo ========================================================
echo        ✅ AMBOS SERVICIOS INICIADOS EN NUEVAS VENTANAS
echo ========================================================
echo.
echo  • Frontend (Bandeja de Revisión):  http://localhost:3001
echo  • Calibración de Regiones:        http://localhost:3001/dev/regiones
echo  • Backend API (NestJS):            http://localhost:3000
echo  • Swagger Docs:                    http://localhost:3000/docs
echo  • Health Check:                    http://localhost:3000/health
echo.
echo Para detener los servicios, simplemente cierra las ventanas abiertas.
echo ========================================================
pause
