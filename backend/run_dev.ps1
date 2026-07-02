# Start NeuroLens backend for local development
Set-Location $PSScriptRoot

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
Write-Host ""

uvicorn app.main:app --reload --port 8000
