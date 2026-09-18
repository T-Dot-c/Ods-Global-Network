# pg_reset_v2.ps1 — preserves file ACL, uses reload not restart
# Run in an Administrator PowerShell window

$HBA   = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$PGCTL = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$PSQL  = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$DATA  = "C:\Program Files\PostgreSQL\18\data"
$NEW_PWD = "postgres18"

Write-Host "`n[1] Saving ACL of pg_hba.conf..." -ForegroundColor Cyan
$acl = Get-Acl $HBA

Write-Host "[2] Backing up original..." -ForegroundColor Cyan
Copy-Item $HBA "$HBA.bak2" -Force

Write-Host "[3] Writing trust version (preserving ACL)..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($HBA)
$trust   = $content -replace 'scram-sha-256', 'trust'
[System.IO.File]::WriteAllText($HBA, $trust, [System.Text.Encoding]::UTF8)
Set-Acl $HBA $acl        # restore original permissions
Write-Host "    ACL preserved."

Write-Host "[4] Reloading config (no restart)..." -ForegroundColor Cyan
& $PGCTL reload -D $DATA
Start-Sleep 2

Write-Host "[5] Connecting and changing password..." -ForegroundColor Cyan
$result = & $PSQL -U postgres -h 127.0.0.1 -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PWD';" 2>&1
Write-Host "    $result"

Write-Host "[6] Restoring scram-sha-256 (preserving ACL)..." -ForegroundColor Cyan
$original = [System.IO.File]::ReadAllText("$HBA.bak2")
[System.IO.File]::WriteAllText($HBA, $original, [System.Text.Encoding]::UTF8)
Set-Acl $HBA $acl
Write-Host "    Restored."

Write-Host "[7] Reloading config again..." -ForegroundColor Cyan
& $PGCTL reload -D $DATA
Start-Sleep 2

Write-Host "`n=== Verifying new password works ===" -ForegroundColor Cyan
$env:PGPASSWORD = $NEW_PWD
$ver = & $PSQL -U postgres -h 127.0.0.1 -d postgres -c "SELECT 'CONNECTION OK' AS status;" 2>&1
Write-Host $ver

Write-Host "`n✅ All done. Password is now: $NEW_PWD" -ForegroundColor Green
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
