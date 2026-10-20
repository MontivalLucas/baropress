param([string]$TaskInputDoc,[string]$TaskOutputPdf)
$ErrorActionPreference = 'Stop'
$taskWord = $null
$taskDocument = $null
try {
    $taskWord = New-Object -ComObject Word.Application
    $taskWord.Visible = $false
    $taskWord.DisplayAlerts = 0
    $taskDocument = $taskWord.Documents.Open($TaskInputDoc, $false, $true)
    $taskDocument.Repaginate()
    $taskDocument.ExportAsFixedFormat($TaskOutputPdf, 17)
    Write-Output "Word PDF export completed"
} finally {
    if ($null -ne $taskDocument) { $taskDocument.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($taskDocument) }
    if ($null -ne $taskWord) { $taskWord.Quit(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($taskWord) }
}
