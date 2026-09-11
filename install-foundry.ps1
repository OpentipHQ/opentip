# Install Foundry (forge/anvil/cast/chisel) on Windows
# Run in PowerShell as normal user: powershell -ExecutionPolicy Bypass -File install-foundry.ps1
# Then restart your terminal and run: foundryup

$ErrorActionPreference = "Stop"

Write-Host "=== Checking prerequisites ===" -ForegroundColor Cyan

# Check if running in WSL or Git Bash is available (preferred for Foundry)
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-Host "WSL detected. Recommended: install Foundry inside WSL:" -ForegroundColor Yellow
    Write-Host "  wsl" 
    Write-Host "  curl -L https://foundry.paradigm.xyz | bash"
    Write-Host "  foundryup"
    Write-Host ""
    $choice = Read-Host "Continue with native Windows install anyway? (y/N)"
    if ($choice -ne "y" -and $choice -ne "Y") { exit 0 }
}

# Method 1: Try foundryup via iwr (works in PowerShell 5.1+ if bash is available via Git Bash)
$foundryDir = "$env:USERPROFILE\.foundry"
$binDir = "$foundryDir\bin"

if (Test-Path "$binDir\forge.exe") {
    Write-Host "Foundry already installed at $binDir\forge.exe" -ForegroundColor Green
    Write-Host "Run: foundryup   to update"
    exit 0
}

Write-Host "Installing Foundry to $foundryDir ..." -ForegroundColor Cyan

# Download foundryup.ps1 from foundry repo and run it
try {
    # Use the official foundry installer script via cargo or direct binary download
    # Fallback: download prebuilt binaries from GitHub releases
    $releasesUrl = "https://api.github.com/repos/foundry-rs/foundry/releases/latest"
    Write-Host "Fetching latest release info..." -ForegroundColor Gray
    $release = Invoke-RestMethod -Uri $releasesUrl -Headers @{ "User-Agent" = "PowerShell" }
    $asset = $release.assets | Where-Object { $_.name -like "*windows*amd64*.zip" } | Select-Object -First 1
    if (-not $asset) {
        throw "No Windows amd64 asset found. Release: $($release.tag_name)"
    }
    Write-Host "Latest: $($release.tag_name) -> $($asset.name)" -ForegroundColor Gray
    $zipPath = "$env:TEMP\foundry.zip"
    Write-Host "Downloading $($asset.browser_download_url) ..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath

    if (-not (Test-Path $foundryDir)) { New-Item -ItemType Directory -Path $foundryDir | Out-Null }
    if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir | Out-Null }

    Write-Host "Extracting to $binDir ..." -ForegroundColor Gray
    Expand-Archive -Path $zipPath -DestinationPath $binDir -Force
    Remove-Item $zipPath -Force

    # Also try to fetch foundryup binary if not included
    $foundryupAsset = $release.assets | Where-Object { $_.name -eq "foundryup.exe" -or $_.name -eq "foundryup-win32.exe" } | Select-Object -First 1
    if ($foundryupAsset -and -not (Test-Path "$binDir\foundryup.exe")) {
        Invoke-WebRequest -Uri $foundryupAsset.browser_download_url -OutFile "$binDir\foundryup.exe"
    }

} catch {
    Write-Host "Direct download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fallback methods:" -ForegroundColor Yellow
    Write-Host "1) If you have Rust/Cargo:  cargo install --git https://github.com/foundry-rs/foundry --profile local --locked foundry-cli anvil chisel"
    Write-Host "2) If you have WSL:  wsl bash -c 'curl -L https://foundry.paradigm.xyz | bash && foundryup'"
    Write-Host "3) Manual: download zip from https://github.com/foundry-rs/foundry/releases and extract to $binDir"
    exit 1
}

# Add to PATH for current session and persist for future sessions
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$binDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$binDir", "User")
    $env:Path += ";$binDir"
    Write-Host "Added $binDir to User PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Verifying ===" -ForegroundColor Cyan
& "$binDir\forge.exe" --version
& "$binDir\cast.exe" --version
& "$binDir\anvil.exe" --version
Write-Host ""
Write-Host "Done! RESTART your PowerShell/terminal, then run:" -ForegroundColor Green
Write-Host "  forge --version"
Write-Host "  foundryup   # to update to latest"
Write-Host ""
Write-Host "Then in C:\Users\goodn\Opentip\contracts run:" -ForegroundColor Cyan
Write-Host "  forge install OpenZeppelin/openzeppelin-contracts --no-commit"
Write-Host "  forge test -vvv"
