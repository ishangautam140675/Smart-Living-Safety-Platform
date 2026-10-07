<#
.SYNOPSIS
  One-command launcher for Smart Living & Safety Platform.
.DESCRIPTION
  Starts Spring Boot backend, starts Vite frontend, and automatically launches your browser.
#>

$root = $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       SMART LIVING & SAFETY PLATFORM LAUNCHER          " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host "`n[1/3] Starting Spring Boot Backend (Port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\mvnw.cmd spring-boot:run"

# 2. Start Frontend in separate window
Write-Host "[2/3] Starting Vite React Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm.cmd run dev"

# 3. Wait briefly and auto-launch browser
Write-Host "`n[3/3] Waiting 6 seconds for services to start, then opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

Start-Process "http://localhost:5173"

Write-Host "`n✅ Platform launched successfully in your default browser!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8080" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray
