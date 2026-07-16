# essence — installer shim (Windows / PowerShell 5.1+).
# Thin wrapper around bin/install.js; every flag passed here is forwarded.
#
# Local clone:
#   pwsh install.ps1 [flags]

$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "essence: Node.js (>=18) required. Install from https://nodejs.org"
    exit 1
}

$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) {
    Write-Error "essence: Node $nodeMajor too old. Need Node >=18."
    exit 1
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$installJs = Join-Path $here "bin/install.js"
if (-not (Test-Path $installJs)) {
    Write-Error "essence: run this from inside a clone of the repo (bin/install.js not found)."
    exit 1
}

node $installJs @args
