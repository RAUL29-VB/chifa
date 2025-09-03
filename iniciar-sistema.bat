@echo off
title Sistema POS - Chifa Chefcito
echo ========================================
echo    SISTEMA POS - CHIFA CHEFCITO
echo ========================================
echo.
echo Iniciando sistema...
echo.

REM Abrir el navegador con la aplicación
start http://localhost:5173

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar el servidor de aplicación en segundo plano
start /min "App Server" cmd /c "npm run dev"

REM Esperar 5 segundos para que inicie
timeout /t 5 /nobreak >nul

REM Iniciar el servidor de impresión
REM Obtener la IP de la PC
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%i
for /f "tokens=1" %%i in ("%IP%") do set IP=%%i

echo ========================================
echo   DIRECCIONES PARA CONECTARSE:
echo ========================================
echo.
echo Desde esta PC: http://localhost:5173
echo Desde tablets/moviles: http://%IP%:5173
echo.
echo ========================================
echo.

echo Iniciando servidor de impresion...
npm run print-server

echo.
echo Sistema iniciado correctamente
echo.
echo IMPORTANTE: NO CERRAR esta ventana
echo.
pause