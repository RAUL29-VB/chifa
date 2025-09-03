@echo off
echo Creando acceso directo en el escritorio...

set "script=%~dp0iniciar-sistema.bat"
set "desktop=%USERPROFILE%\Desktop"
set "shortcut=%desktop%\Sistema POS Chifa.lnk"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcut%'); $Shortcut.TargetPath = '%script%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,43'; $Shortcut.Description = 'Sistema POS Chifa Chefcito'; $Shortcut.Save()"

echo.
echo Acceso directo creado en el escritorio: "Sistema POS Chifa"
echo.
echo El cliente solo necesita hacer doble clic en ese icono
echo.
pause