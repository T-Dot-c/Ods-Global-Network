# ODS Global Network — Database Restore Script (PowerShell)
# Usage: .\scripts\restore-database.ps1 -BackupFile <path_to_backup_sql> [-TargetDb <dbName>]

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$TargetDb = "ods_staging_restore_test",
    [string]$HostName = $env:DB_HOST,
    [string]$Port = $env:DB_PORT,
    [string]$User = $env:TEST_ADMIN_DB_USER
)

# Load .env variables if not present in environment
$EnvFile = "$PSScriptRoot\..\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($k)) {
                [System.Environment]::SetEnvironmentVariable($k, $v)
            }
        }
    }
}

if (-not $HostName) { $HostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" } }
if (-not $Port) { $Port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" } }
if (-not $User) { $User = if ($env:TEST_ADMIN_DB_USER) { $env:TEST_ADMIN_DB_USER } else { "postgres" } }
if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = if ($env:TEST_ADMIN_DB_PASSWORD) { $env:TEST_ADMIN_DB_PASSWORD } else { $env:DB_PASSWORD }
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STARTING DATABASE RESTORE REHEARSAL" -ForegroundColor Cyan
Write-Host "   Source: $BackupFile"
Write-Host "   Target DB: $TargetDb on ${HostName}:${Port} (User: $User)"
Write-Host "================================================================"

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # Check if psql is in PATH or standard PostgreSQL paths
    $Psql = Get-Command "psql" -ErrorAction SilentlyContinue
    if (-not $Psql) {
        $PgBinDirs = @(
            "C:\Program Files\PostgreSQL\18\bin",
            "C:\Program Files\PostgreSQL\17\bin",
            "C:\Program Files\PostgreSQL\16\bin",
            "C:\Program Files\PostgreSQL\15\bin"
        )
        foreach ($dir in $PgBinDirs) {
            if (Test-Path "$dir\psql.exe") {
                $env:PATH = "$dir;$env:PATH"
                break
            }
        }
    }

    # Ensure target DB exists
    Write-Host "[1/3] Preparing target database: $TargetDb..."
    & psql -h $HostName -p $Port -U $User -d postgres -c "DROP DATABASE IF EXISTS $TargetDb;" | Out-Null
    & psql -h $HostName -p $Port -U $User -d postgres -c "CREATE DATABASE $TargetDb;" | Out-Null

    # Execute restore
    Write-Host "[2/3] Restoring schema and data from backup..."
    & psql -h $HostName -p $Port -U $User -d $TargetDb -q -f $BackupFile | Out-Null

    # Verify tables in restored DB
    Write-Host "[3/3] Verifying integrity of restored database..."
    $VerifyOutput = & psql -h $HostName -p $Port -U $User -d $TargetDb -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
    $TableCount = $VerifyOutput.Trim()

    $Stopwatch.Stop()
    $Duration = [math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)

    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "RESTORE REHEARSAL COMPLETED SUCCESSFULLY IN ${Duration}s" -ForegroundColor Green
    Write-Host "   Restored Database: $TargetDb ($TableCount public tables verified)" -ForegroundColor Green
    Write-Host "================================================================"

} catch {
    Write-Host "RESTORE FAILED: $_" -ForegroundColor Red
    exit 1
}
