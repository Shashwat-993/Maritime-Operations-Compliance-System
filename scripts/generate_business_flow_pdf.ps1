# PowerShell script to convert BUSINESS_FLOW.md to PDF using pandoc
if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
  Write-Error "pandoc is not installed. Install pandoc or use VS Code Markdown preview to print to PDF."
  exit 1
}

pandoc BUSINESS_FLOW.md -o BUSINESS_FLOW.pdf
Write-Output "BUSINESS_FLOW.pdf generated"
