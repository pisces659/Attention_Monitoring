# Start NeuroLens backend for local development
Set-Location $PSScriptRoot

# Required when Anaconda numpy and MediaPipe both link OpenMP (prevents hang/crash).
$env:KMP_DUPLICATE_LIB_OK = "TRUE"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

Write-Host "Installing dependencies..."
pip install -r requirements.txt -q

Write-Host "Seeding database (safe to re-run)..."
python -m scripts.seed

Write-Host ""
Write-Host "Starting API at http://localhost:8000"
Write-Host "Docs: http://localhost:8000/docs"
Write-Host "Dev auth: Bearer dev-token"
Write-Host "Note: video analysis runs in background; first run downloads AI models."
Write-Host ""

# No --reload: prevents killing in-flight video analysis when files change.
uvicorn app.main:app --port 8000