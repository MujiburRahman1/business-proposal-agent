# Start DealPilot ADK agent with MongoDB MCP (web UI on port 8080)
$AgentDir = Split-Path -Parent $PSScriptRoot
Set-Location $AgentDir

if (-not (Test-Path ".\.venv\Scripts\adk.exe")) {
    Write-Host "Installing ADK dependencies..."
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

Write-Host "Starting DealPilot agent at http://127.0.0.1:8080"
Write-Host "Select 'dealpilot' in the top-left dropdown."
.\.venv\Scripts\adk.exe web --port 8080
