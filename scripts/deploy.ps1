$ErrorActionPreference = "Stop"

$HostName = "13.212.196.15"
$RemoteUser = "ec2-user"
$Key = $env:DEPLOY_SSH_KEY
$RemoteBase = "/home/ec2-user/workspace/standalone-build"

if (-not [string]::IsNullOrWhiteSpace($Key) -and !(Test-Path $Key)) {
  throw "SSH key file not found: $Key. Set DEPLOY_SSH_KEY to a valid private key path."
}

$SshKeyArgs = @()
if (-not [string]::IsNullOrWhiteSpace($Key)) {
  $SshKeyArgs = @("-i", $Key)
}

Write-Host "Building app locally..."
bun run build

if (!(Test-Path ".next\standalone\server.js")) {
  throw "Standalone build not found. Check next.config.js and make sure output='standalone'."
}

Write-Host "Preparing release folder..."
Remove-Item -Recurse -Force ".\release" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ".\release\standalone\.next" -Force | Out-Null

Copy-Item -Recurse -Force ".next\standalone\*" ".\release\standalone\"

if (Test-Path ".\public") {
  Copy-Item -Recurse -Force ".\public" ".\release\standalone\"
}

Copy-Item -Recurse -Force ".next\static" ".\release\standalone\.next\"

Write-Host "Packing release..."
Remove-Item -Force ".\release\standalone.tar.gz" -ErrorAction SilentlyContinue
tar -czf ".\release\standalone.tar.gz" -C ".\release" "standalone"

Write-Host "Ensuring remote folder exists..."
ssh @SshKeyArgs "$RemoteUser@$HostName" "mkdir -p $RemoteBase"

Write-Host "Uploading release..."
scp @SshKeyArgs ".\release\standalone.tar.gz" "$RemoteUser@$HostName`:$RemoteBase/standalone.tar.gz"

Write-Host "Extracting and reloading with PM2..."
ssh @SshKeyArgs "$RemoteUser@$HostName" "cd $RemoteBase && rm -rf current && mkdir -p current && tar -xzf standalone.tar.gz -C current --strip-components=1 && ~/.bun/bin/pm2 startOrReload ecosystem.config.js --env production && ~/.bun/bin/pm2 save"

Write-Host "Done."