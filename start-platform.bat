@echo off
title Smart Living & Safety Platform - Launcher
color 0A

echo ========================================================
echo        SMART LIVING & SAFETY PLATFORM LAUNCHER
echo ========================================================
echo.
echo Starting Backend (Spring Boot on port 8080)...
cd /d "%~dp0backend"
start "SmartLiving-Backend" cmd /k ".\mvnw.cmd spring-boot:run"

echo.
echo Starting Frontend (Vite on port 5173)...
cd /d "%~dp0frontend"
start "SmartLiving-Frontend" cmd /k "npm.cmd run dev"

echo.
echo Waiting 8 seconds for servers to initialize...
timeout /t 8 /nobreak >nul

echo.
echo Opening Smart Living Platform in your default browser...
start http://localhost:5173

echo.
echo ========================================================
echo   Application started successfully!
echo   Both windows are running in background terminals.
echo ========================================================
exit
