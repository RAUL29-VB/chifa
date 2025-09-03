@echo off
title Servidor de Impresion TCP/IP - Chifa Chefcito
color 0A

echo ========================================
echo    SERVIDOR DE IMPRESION TCP/IP
echo    CHIFA CHEFCITO
echo ========================================
echo.
echo Impresora configurada: 192.168.1.200:9100
echo Puerto del servidor: 3001
echo.
echo Iniciando servidor...
echo.

node print-server-tcpip.js

pause