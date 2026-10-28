# ODS Global Network — Database Backup Script (PowerShell)
# Usage: .\scripts\backup-database.ps1 [-Database <dbName>] [-OutDir <dir>]

param (
    [string]$Database = $env:DB_NAME,
    [string]$HostName = $env:DB_HOST,
    [string]$Port = $env:DB_PORT,
    [string]$User = $env:TEST_ADMIN_DB_USER,
    [string]$OutDir = "$PSScriptRoot\..\backups"
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

if (-not $Database) { $Database = if ($env:DB_NAME) { $env:DB_NAME } else { "ods_global.net" } }
if (-not $HostName) { $HostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" } }
if (-not $Port) { $Port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" } }
if (-not $User) { $User = if ($env:TEST_ADMIN_DB_USER) { $env:TEST_ADMIN_DB_USER } else { "postgres" } }
if (-not $env:PGPASSWORD) {
    $env:PGPASSWORD = if ($env:TEST_ADMIN_DB_PASSWORD) { $env:TEST_ADMIN_DB_PASSWORD } else { $env:DB_PASSWORD }
}

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$OutDir\backup_${Database}_${Timestamp}.sql"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "STARTING DATABASE BACKUP: $Database" -ForegroundColor Cyan
Write-Host "   Host: ${HostName}:${Port} | User: ${User} | Output: ${BackupFile}"
Write-Host "================================================================"

$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # Check if pg_dump is available in PATH or standard PostgreSQL paths
    $PgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
    if (-not $PgDump) {
        $PgBinDirs = @(
            "C:\Program Files\PostgreSQL\18\bin",
            "C:\Program Files\PostgreSQL\17\bin",
            "C:\Program Files\PostgreSQL\16\bin",
            "C:\Program Files\PostgreSQL\15\bin"
        )
        foreach ($dir in $PgBinDirs) {
            if (Test-Path "$dir\pg_dump.exe") {
                $env:PATH = "$dir;$env:PATH"
                break
            }
        }
    }

    & pg_dump -h $HostName -p $Port -U $User -d $Database --clean --if-exists --no-owner --no-privileges -f $BackupFile

    $Stopwatch.Stop()
    $Duration = [math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)

    if (Test-Path $BackupFile) {
        $Size = (Get-Item $BackupFile).Length
        $SizeKB = [math]::Round($Size / 1024, 2)
        Write-Host "BACKUP COMPLETED SUCCESSFULLY IN ${Duration}s" -ForegroundColor Green
        Write-Host "   File: $BackupFile (${SizeKB} KB)" -ForegroundColor Green
    } else {
        throw "Backup output file was not created."
    }
} catch {
    Write-Host "BACKUP FAILED: $_" -ForegroundColor Red
    exit 1
}
