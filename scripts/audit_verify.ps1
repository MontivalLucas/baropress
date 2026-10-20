$ErrorActionPreference = 'Stop'
$auditRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $auditRoot
$auditLogDir = Join-Path $auditRoot 'docs/audit/logs'
New-Item -ItemType Directory -Path $auditLogDir -Force | Out-Null
$auditResults = [System.Collections.Generic.List[object]]::new()
function Run-AuditCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $auditWatch = [System.Diagnostics.Stopwatch]::StartNew()
    $auditLog = Join-Path $auditLogDir ($Name + '.log')
    & $Executable @Arguments 2>&1 | Tee-Object -FilePath $auditLog
    $auditCode = $LASTEXITCODE
    $auditWatch.Stop()
    $auditResults.Add([pscustomobject]@{name=$Name;command=($Executable + ' ' + ($Arguments -join ' '));exitCode=$auditCode;elapsedSeconds=[math]::Round($auditWatch.Elapsed.TotalSeconds,2);log=('logs/'+$Name+'.log')})
    $auditResults | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $auditLogDir 'results.json') -Encoding utf8
    if ($auditCode -ne 0) { throw "Verificação falhou: $Name. Veja $auditLog" }
}
Run-AuditCheck -Name 'typecheck' -Executable 'npm.cmd' -Arguments @('run','typecheck')
Run-AuditCheck -Name 'frontend-tests' -Executable 'npm.cmd' -Arguments @('test')
Run-AuditCheck -Name 'frontend-build' -Executable 'npm.cmd' -Arguments @('run','build')
Run-AuditCheck -Name 'rust-tests' -Executable 'cargo' -Arguments @('test','--manifest-path','src-tauri/Cargo.toml','--offline')
Run-AuditCheck -Name 'tauri-build' -Executable 'npm.cmd' -Arguments @('run','tauri:build','--','--ci','--bundles','nsis','--','--offline')
