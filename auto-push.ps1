# Smart Living & Safety Platform - Auto Push Script
# Watches for local file changes and automatically commits & pushes to GitHub

param (
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [int]$DebounceSeconds = 10
)

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectPath

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 SmartLiving Auto-Push Daemon Started" -ForegroundColor Green
Write-Host " Watching: $ProjectPath" -ForegroundColor Yellow
Write-Host " Remote:   $Remote/$Branch" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Check git remote
$remotes = git remote -v
if (-not $remotes) {
    Write-Host "⚠️ No git remote found. Please connect your GitHub repository first:" -ForegroundColor Red
    Write-Host "   git remote add origin https://github.com/<your-username>/<repo-name>.git" -ForegroundColor White
    exit 1
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $ProjectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Filter out ignored/build directories
$excludePatterns = @("\\.git\\", "\\node_modules\\", "\\target\\", "\\dist\\", "\\\.system_generated\\")

$lastChange = [DateTime]::MinValue
$pendingPush = $false

$action = {
    param($source, $event)
    $filePath = $event.FullPath
    
    foreach ($pattern in $excludePatterns) {
        if ($filePath -match $pattern) { return }
    }

    $script:lastChange = [DateTime]::Now
    $script:pendingPush = $true
}

Register-ObjectEvent $watcher 'Changed' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Created' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Deleted' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Renamed' -Action $action | Out-Null

Write-Host "Listening for file modifications... (Press Ctrl+C to stop)`n" -ForegroundColor Gray

while ($true) {
    Start-Sleep -Seconds 2

    if ($script:pendingPush -and (([DateTime]::Now - $script:lastChange).TotalSeconds -ge $DebounceSeconds)) {
        $script:pendingPush = $false

        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] 📦 Changes detected. Staging, committing & pushing..." -ForegroundColor Yellow

            git add .
            git commit -m "auto: synchronize updates at $timestamp"
            
            $pushResult = git push $Remote $Branch 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$timestamp] ✅ Successfully synced to GitHub!" -ForegroundColor Green
            } else {
                Write-Host "[$timestamp] ❌ Push failed: $pushResult" -ForegroundColor Red
            }
        }
    }
}
