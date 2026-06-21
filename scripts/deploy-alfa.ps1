# Deploy alfa automatizado — Windows
# Uso: .\scripts\deploy-alfa.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path '.env.alfa')) {
  Write-Host ''
  Write-Host 'Arquivo .env.alfa nao encontrado.' -ForegroundColor Yellow
  Write-Host '1. Copie .env.alfa.example para .env.alfa'
  Write-Host '2. Preencha DATABASE_URL, RENDER_API_KEY e VERCEL_TOKEN'
  Write-Host '3. Rode este script novamente'
  Write-Host ''
  if (Test-Path '.env.alfa.example') {
    Copy-Item '.env.alfa.example' '.env.alfa'
    Write-Host 'Criei .env.alfa a partir do exemplo — edite antes de continuar.' -ForegroundColor Green
  }
  exit 1
}

Write-Host 'Iniciando deploy alfa automatizado...' -ForegroundColor Cyan
node scripts/deploy-alfa.js @args
