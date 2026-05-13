#!/usr/bin/env bash
if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc is not installed. Install pandoc or use VS Code to export BUSINESS_FLOW.md to PDF."
  exit 1
fi
pandoc BUSINESS_FLOW.md -o BUSINESS_FLOW.pdf
echo "BUSINESS_FLOW.pdf generated"
