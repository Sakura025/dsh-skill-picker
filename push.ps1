# Push the skill-picker repo to GitHub.
#
# Usage (token never written to disk; it lives only in this process):
#   $env:GH_PAT = 'ghp_xxx'
#   pwsh -File push.ps1
#
# Creates the repo when absent, then force-pushes main. Idempotent: re-running
# on an existing repo just pushes the current commit.

param(
	[string]$Owner = 'Sakura025',
	[string]$Repo = 'dsh-skill-picker',
	[string]$RepoDir = 'D:\工作区\toolkit\dsh-skill-picker-repo',
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

# 1. Who is this token?
$me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
Write-Host "authenticated as: $($me.login)"
if ($me.login -ne $Owner) {
	Write-Warning "token belongs to '$($me.login)', not '$Owner' — continuing with the token owner as repo owner"
	$Owner = $me.login
}

$full = "$Owner/$Repo"
$branch = & $git -C $RepoDir rev-parse --abbrev-ref HEAD
$head = & $git -C $RepoDir rev-parse HEAD
Write-Host "local branch: $branch @ $head"

# 2. Ensure the repository exists.
$exists = $true
try {
	Invoke-RestMethod -Uri "https://api.github.com/repos/$full" -Headers $headers -TimeoutSec 30 | Out-Null
} catch {
	if ($_.Exception.Response.StatusCode.value__ -eq 404) { $exists = $false }
	else { throw }
}

if (-not $exists) {
	$body = @{
		name          = $Repo
		description   = 'Skill picker for the DeepSeek Harness composer: browse skills in Chinese by lifecycle phase and insert them as /name.'
		private       = $false
		has_issues    = $true
		has_wiki      = $false
		auto_init     = $false
		default_branch = 'main'
	} | ConvertTo-Json
	$created = Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 30
	Write-Host "created: $($created.html_url)"
} else {
	Write-Host "repository already exists: https://github.com/$full"
}

# 3. Push with an in-memory credential helper so the token is never persisted.
$remote = "https://github.com/$full.git"
$prevHelper = & $git -C $RepoDir config --get credential.helper 2>$null
$helper = '!f() { echo username=x-access-token; echo "password=$GH_PAT"; }; f'
& $git -C $RepoDir config credential.helper $helper
$env:GH_PAT = $Token

try {
	& $git -C $RepoDir remote remove origin 2>$null
	& $git -C $RepoDir remote add origin $remote
	& $git -C $RepoDir push -u origin $branch 2>&1
	if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }
} finally {
	& $git -C $RepoDir config --unset credential.helper 2>$null
	if ($prevHelper) { & $git -C $RepoDir config credential.helper $prevHelper }
	Remove-Item Env:\GH_PAT -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host "pushed: https://github.com/$full"
Write-Host "commit: $head"
