# Wrayth agent — uninstall the Windows Service and remove files.
$ErrorActionPreference = "SilentlyContinue"
$svcName = "WraythAgent"
if (Get-Service -Name $svcName -ErrorAction SilentlyContinue) {
  Stop-Service -Name $svcName -Force
  sc.exe delete $svcName | Out-Null
}
Remove-Item -Recurse -Force "C:\Program Files\Wrayth"
Remove-Item -Recurse -Force "C:\ProgramData\Wrayth"
Write-Host "Wrayth Agent removed."
