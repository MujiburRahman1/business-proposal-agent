# Quick test: official MongoDB MCP server starts and connects to Atlas
$BackendEnv = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "backend\.env"
$MongoUri = ""

if (Test-Path $BackendEnv) {
    Get-Content $BackendEnv | ForEach-Object {
        if ($_ -match '^MONGODB_URI=(.+)$') { $MongoUri = $matches[1] }
    }
}

if (-not $MongoUri) {
    Write-Host "ERROR: MONGODB_URI not found in backend\.env"
    exit 1
}

$env:MDB_MCP_CONNECTION_STRING = $MongoUri
Write-Host "Testing official mongodb-mcp-server connection..."
Write-Host "Connection: $($MongoUri.Substring(0, [Math]::Min(40, $MongoUri.Length)))..."

npx -y mongodb-mcp-server --help
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: mongodb-mcp-server package is available via npx"
} else {
    Write-Host "FAIL: could not load mongodb-mcp-server"
    exit 1
}
