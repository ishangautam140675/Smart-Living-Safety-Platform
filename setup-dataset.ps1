$ErrorActionPreference = "Continue"

$targetBase = "frontend/public/room-dataset"
New-Item -ItemType Directory -Force -Path $targetBase | Out-Null

$categories = @("1_room", "2_rooms", "3_rooms", "4_rooms", "5_rooms", "6_rooms", "washroom", "tv_entertainment", "study_balcony")

foreach ($cat in $categories) {
    $catDir = Join-Path $targetBase $cat
    New-Item -ItemType Directory -Force -Path $catDir | Out-Null
}

Write-Output "Dataset category directories verified at $targetBase"
