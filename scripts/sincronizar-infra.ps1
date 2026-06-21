# Infra GitHub + Render — Windows
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/sincronizar-infra.js @args
