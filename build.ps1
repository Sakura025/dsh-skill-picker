# Build the distributable zip plus the npm tarball from the repo tree.
#
# The zip stages only runtime files (no tests, no node_modules) so a friend can
# unzip it straight into a profile's node_modules. The tarball is what
# `dsh plugin add` / pnpm would consume.
#
# Usage: pwsh -File build.ps1

$ErrorActionPreference = 'Stop'

$repo = $PSScriptRoot
$dist = Join-Path (Split-Path $repo -Parent) 'dist'
$stage = Join-Path $env:TEMP ('dsh-skill-picker-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Force -Path $dist | Out-Null
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$runtime = @('package.json', 'cordis.patch.yml', 'index.js', 'client.js', 'icon.svg', 'README.md', 'LICENSE')
foreach ($file in $runtime) {
	Copy-Item (Join-Path $repo $file) $stage -Force
}
Copy-Item (Join-Path $repo 'locale') (Join-Path $stage 'locale') -Recurse -Force

$version = (Get-Content (Join-Path $repo 'package.json') -Raw | ConvertFrom-Json).version
$zip = Join-Path $dist "dsh-skill-picker-$version.zip"
Remove-Item $zip -Force -ErrorAction SilentlyContinue

# Compress-Archive would flatten the wrapper only if given '*', so stage a
# named wrapper directory to keep the archive self-describing.
$wrapper = Join-Path $env:TEMP ('pkgwrap-' + [guid]::NewGuid().ToString('N'))
$named = Join-Path $wrapper "dsh-skill-picker-$version"
New-Item -ItemType Directory -Force -Path $named | Out-Null
Copy-Item (Join-Path $stage '*') $named -Recurse -Force
Compress-Archive -Path $named -DestinationPath $zip -CompressionLevel Optimal

Write-Host ("zip : {0} ({1:N0} bytes)" -f $zip, (Get-Item $zip).Length)

# Validate the archive the way a consumer would.
$check = Join-Path $env:TEMP ('ziptest-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $zip -DestinationPath $check
$root = Join-Path $check "dsh-skill-picker-$version"
foreach ($file in $runtime) {
	$left = (Get-FileHash (Join-Path $repo $file)).Hash
	$right = (Get-FileHash (Join-Path $root $file)).Hash
	if ($left -ne $right) { throw "archive mismatch: $file" }
}
foreach ($file in @('en.json', 'zh.json')) {
	$left = (Get-FileHash (Join-Path $repo "locale/$file")).Hash
	$right = (Get-FileHash (Join-Path $root "locale/$file")).Hash
	if ($left -ne $right) { throw "archive mismatch: locale/$file" }
}
Write-Host "zip : byte-identical to the repo tree"
Write-Host ("zip sha256: {0}" -f (Get-FileHash $zip -Algorithm SHA256).Hash)

Remove-Item $stage, $wrapper, $check -Recurse -Force -ErrorAction SilentlyContinue
