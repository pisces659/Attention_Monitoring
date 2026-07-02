# Start NeuroLens frontend connected to local API
Set-Location $PSScriptRoot

if (-not (Test-Path ".env.local")) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_API=true
"@ | Set-Content ".env.local" -Encoding UTF8
    Write-Host "Created .env.local"
}

Write-Host "Starting frontend at http://localhost:3000"
Write-Host "Login: demo@neurolens.ai / demo123"
Write-Host ""

npm run dev
