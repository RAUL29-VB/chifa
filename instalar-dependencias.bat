@echo off
title Instalacion Sistema POS - Chifa Chefcito
echo ========================================
echo   INSTALACION SISTEMA POS
echo   CHIFA CHEFCITO
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor:
    echo 1. Ve a https://nodejs.org
    echo 2. Descarga la version LTS
    echo 3. Instala Node.js
    echo 4. Reinicia esta PC
    echo 5. Ejecuta este archivo de nuevo
    echo.
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Instalando dependencias del sistema...
npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron instalar las dependencias
    echo Verifica tu conexion a internet
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo El sistema esta listo para usar
echo.
echo Siguiente paso:
echo 1. Ejecutar "crear-acceso-directo.bat"
echo 2. Usar el icono del escritorio
echo.
pause