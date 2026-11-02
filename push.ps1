# Publish this repo to GitHub: create it when absent, push, then apply the
# description, topics, and issue/PR settings from .github/repo-metadata.json.
#
# The token is read from $env:GH_PAT and never written to disk or to
# .git/config; the in-memory credential helper is removed in `finally`.
#
# Usage:
#   $env:GH_PAT = 'ghp_xxx'
#   powershell -ExecutionPolicy Bypass -File .\push.ps1
#
# Optional:
#   -Owner <login>   override the repository owner (defaults to the token owner)
#   -Repo  <name>    override the repository name (default dsh-skill-picker)

param(
	[string]$Owner = 'Sakura025',
	[string]$Repo = 'dsh-skill-picker',
	[string]$RepoDir = $PSScriptRoot,
	[string]$Token = $env:GH_PAT
)

$ErrorActionPreference = 'Stop'
$git = 'C:\Users\32361\.dsh\tools\mingit\cmd\git.exe'

if ([string]::IsNullOrWhiteSpace($Token)) { throw 'GH_PAT is empty; export the token first.' }
if (-not (Test-Path $RepoDir)) { throw "repo dir missing: $RepoDir" }

$headers = @{
	Authorization          = "Bearer $Token"
	Accept                 = 'application/vnd.github+json'
	'X-GitHub-Api-Version' = '2022-11-28'
	'User-Agent'           = 'dsh-skill-picker-push'
}

function Invoke-GitHub {
	param([string]$Method, [string]$Uri, $Body)
	$args = @{ Method = $Method; Uri = $Uri; Headers = $headers; TimeoutSec = 40 }
	if ($null -ne $Body) {
		$args.Body = ($Body | ConvertTo-Json -Depth 8)
		$args.ContentType = 'application/json'
	}
	return Invoke-RestMethod @args
}

# 1. Identify the token owner.
$me = Invoke-GitHub -Method Get -Uri 'https://api.github.com/user'
Write-Host "token owner    : $($me.login)"
if ($me.login -ne $Owner) {
	Write-Warning "token belongs to '$($me.login)'; using that account as the repo owner"
	$Owner = $me.login
}
$full = "$Owner/$Repo"

$branch = (& $git -C $RepoDir rev-parse --abbrev-ref HEAD).Trim()
$head = (& $git -C $RepoDir rev-parse HEAD).Trim()
Write-Host "local branch   : $branch @ $head"

# 2. Create the repository when it does not exist yet.
$metadata = $null
$metadataPath = Join-Path $RepoDir '.github/repo-metadata.json'
if (Test-Path $metadataPath) { $metadata = Get-Content $metadataPath -Raw | ConvertFrom-Json }

$exists = $true
try {
	Invoke-GitHub -Method Get -Uri "https://api.github.com/repos/$full" | Out-Null
} catch {
	if ($_.Exception.Response.StatusCode.value__ -eq 404) { $exists = $false } else { throw }
}

if (-not $exists) {
	$body = @{
		name           = $Repo
		description    = if ($metadata) { $metadata.description } else { 'Skill picker for the DeepSeek Harness composer.' }
		private        = $false
		has_issues     = $true
		has_wiki       = $false
		has_projects   = $false
		auto_init      = $false
		default_branch = 'main'
	}
	$created = Invoke-GitHub -Method Post -Uri 'https://api.github.com/user/repos' -Body $body
	Write-Host "created        : $($created.html_url)"
} else {
	Write-Host "repository     : https://github.com/$full (exists)"
}

# 3. Push with an in-memory credential helper.
$remote = "https://github.com/$full.git"
$prevHelper = (& $git -C $RepoDir config --get credential.helper) 2>$null
& $git -C $RepoDir config credential.helper '!f() { echo username=x-access-token; echo "password=$GH_PAT"; }; f'
$env:GH_PAT = $Token
try {
	& $git -C $RepoDir remote remove origin 2>$null | Out-Null
	& $git -C $RepoDir remote add origin $remote
	& $git -C $RepoDir push -u origin $branch 2>&1 | ForEach-Object { Write-Host $_ }
	if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }
} finally {
	& $git -C $RepoDir config --unset-all credential.helper 2>$null | Out-Null
	if ($prevHelper) { & $git -C $RepoDir config credential.helper $prevHelper }
	Remove-Item Env:\GH_PAT -ErrorAction SilentlyContinue
}

# 4. Apply repository metadata: description, homepage, topics, merge policy.
if ($null -ne $metadata) {
	$patch = @{
		description      = $metadata.description
		homepage         = "https://github.com/$full#readme"
		has_issues       = [bool]$metadata.has_issues
		has_projects     = [bool]$metadata.has_projects
		has_wiki         = [bool]$metadata.has_wiki
		has_discussions  = [bool]$metadata.has_discussions
		allow_squash_merge      = [bool]$metadata.allow_squash_merge
		allow_merge_commit      = [bool]$metadata.allow_merge_commit
		allow_rebase_merge      = [bool]$metadata.allow_rebase_merge
		delete_branch_on_merge  = [bool]$metadata.delete_branch_on_merge
	}
	Invoke-GitHub -Method Patch -Uri "https://api.github.com/repos/$full" -Body $patch | Out-Null
	Write-Host "description    : $($metadata.description)"

	if ($metadata.topics) {
		Invoke-GitHub -Method Put -Uri "https://api.github.com/repos/$full/topics" -Body @{ names = @($metadata.topics) } | Out-Null
		Write-Host "topics         : $($metadata.topics -join ', ')"
	}
}

Write-Host ''
Write-Host "published      : https://github.com/$full"
Write-Host "commit         : $head"
