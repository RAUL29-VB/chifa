@echo off
title Ver IP para Tablets/Moviles
echo ========================================
echo    DIRECCION PARA TABLETS/MOVILES
echo ========================================
echo.

REM Obtener la IP de la PC
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%i
for /f "tokens=1" %%i in ("%IP%") do set IP=%%i

echo Desde tablets/moviles usar esta direccion:
echo.
echo     http://%IP%:5173
echo.
echo ========================================
echo.
echo INSTRUCCIONES:
echo 1. Conectar tablet/movil a la misma WiFi
echo 2. Abrir navegador en el dispositivo
echo 3. Escribir la direccion de arriba
echo 4. Iniciar sesion con usuario correspondiente
echo.
echo ========================================
echo.
pause