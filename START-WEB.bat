@echo off
title PipChi Web Dashboard
color 0A
cd /d "%~dp0web-platform"
echo.
echo ========================================
echo    PIPCHI WEB DASHBOARD
echo ========================================
echo.
echo Ouverture sur http://localhost:3000
echo.
node server.js
