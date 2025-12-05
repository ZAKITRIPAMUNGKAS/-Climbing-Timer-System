# PowerShell script to run database migration
# Usage: .\run_migration.ps1

$password = Read-Host "Enter MySQL root password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$sqlFile = "database/migration_add_audit_logs.sql"
$database = "fpti_karanganyar"

Write-Host "Running migration: $sqlFile" -ForegroundColor Cyan

# Method 1: Using mysql with -e flag
$sqlContent = Get-Content $sqlFile -Raw
$sqlContent = $sqlContent -replace "USE fpti_karanganyar;", ""  # Remove USE statement as we'll specify database in connection

mysql -u root -p"$passwordPlain" $database -e $sqlContent

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migration failed. Please check the error above." -ForegroundColor Red
}

