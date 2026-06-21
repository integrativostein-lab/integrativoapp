# Sincroniza Render (alfa + produção) — Windows
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path '.env.alfa')) {
  Write-Host 'Copie .env.alfa.example para .env.alfa e preencha RENDER_API_KEY.' -ForegroundColor Yellow
  exit 1
}

node scripts/sincronizar-render.js @args
