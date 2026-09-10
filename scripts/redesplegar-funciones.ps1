# scripts/redesplegar-funciones.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Redespliega las 4 edge functions afectadas por la auditoría (fixes #2 y #5).
#   - crear-sesion-pago  → usa la RPC precio_esperado (precio autoritativo)
#   - activar-pago       → usa uid_por_email (resolver huérfano sin listUsers)
#   - stripe-webhook     → usa uid_por_email
#   - preinscribir       → usa uid_por_email
#
# REQUISITOS (una sola vez):
#   1. Supabase CLI instalado:  https://supabase.com/docs/guides/cli
#   2. Sesión iniciada:         supabase login
#   3. Las RPCs ya están creadas en la BD (uid_por_email, precio_esperado) ✅ hecho.
#
# Uso:  desde la raíz del repo (C:\catecumen):
#   powershell -ExecutionPolicy Bypass -File scripts\redesplegar-funciones.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$ProjectRef = "jqlfjfamraavsbhdusuq"
$Funciones  = @("crear-sesion-pago", "activar-pago", "stripe-webhook", "preinscribir")

Write-Host "Redesplegando 4 funciones en el proyecto $ProjectRef ..." -ForegroundColor Cyan

foreach ($fn in $Funciones) {
    Write-Host "`n=== $fn ===" -ForegroundColor Yellow
    supabase functions deploy $fn --use-api --no-verify-jwt --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR al desplegar $fn (código $LASTEXITCODE). Deteniendo." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "OK: $fn desplegada." -ForegroundColor Green
}

Write-Host "`nListo. Las 4 funciones quedaron desplegadas." -ForegroundColor Cyan
Write-Host "Verifica en el Dashboard que 'Enforce JWT' quede en OFF en las 4." -ForegroundColor DarkGray
