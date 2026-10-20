@echo off
title BAROPRESS - Sistema de Baropodometria
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;C:\Users\Montival Nunes\.cargo\bin;C:\Users\Montival Nunes\AppData\Local\Microsoft\WinGet\Packages\MartinStorsjo.LLVM-MinGW.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\llvm-mingw-20260616-ucrt-x86_64\bin;%PATH%"
echo ===================================================
echo   BAROPRESS - Sistema de Baropodometria 15x15
echo   Iniciando aplicacao desktop (Tauri + React + SQLite)...
echo ===================================================
call npm run tauri dev
pause
