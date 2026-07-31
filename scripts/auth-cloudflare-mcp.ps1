# Windows OAuth callback via TcpListener (no admin / URL ACL needed)
param(
  [int]$Port = 18765,
  [string]$OutFile = "$env:USERPROFILE\.grok\mcp_oauth_callback.json",
  [int]$TimeoutSec = 300
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $OutFile
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
if (Test-Path $OutFile) { Remove-Item $OutFile -Force }

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Listening on http://127.0.0.1:$Port/callback (timeout ${TimeoutSec}s)"

$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
  if (-not $listener.Pending()) {
    Start-Sleep -Milliseconds 200
    continue
  }
  $client = $listener.AcceptTcpClient()
  $stream = $client.GetStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $request = ""
  while ($true) {
    $line = $reader.ReadLine()
    if ($null -eq $line) { break }
    $request += $line + "`n"
    if ($line -eq "") { break }
  }

  $first = ($request -split "`n")[0]
  $path = "/"
  if ($first -match '^(GET|POST)\s+(\S+)') {
    $path = $Matches[2]
  }

  $qs = @{}
  if ($path -match '\?(.+)$') {
    $query = $Matches[1]
    foreach ($pair in ($query -split '&')) {
      if ($pair -match '^([^=]+)=(.*)$') {
        $k = [Uri]::UnescapeDataString($Matches[1])
        $v = [Uri]::UnescapeDataString(($Matches[2] -replace '\+', ' '))
        $qs[$k] = $v
      }
    }
  }

  $pathOnly = ($path -split '\?')[0]
  if ($pathOnly -eq "/callback") {
    ($qs | ConvertTo-Json -Compress) | Set-Content -Path $OutFile -Encoding UTF8
    $ok = $qs.ContainsKey("code") -and -not $qs.ContainsKey("error")
    $title = if ($ok) { "Authorization Complete" } else { "Authorization Failed" }
    $body = @"
<!DOCTYPE html><html><head><title>$title</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px">
<h1>$title</h1>
<p>You can close this window and return to Grok.</p>
<script>window.close();</script>
</body></html>
"@
    $bytes = [Text.Encoding]::UTF8.GetBytes($body)
    $header = "HTTP/1.1 200 OK`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
    $client.Close()
    $listener.Stop()
    Write-Host "Captured callback -> $OutFile"
    exit 0
  } else {
    $msg = [Text.Encoding]::UTF8.GetBytes("not found")
    $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($msg.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($msg, 0, $msg.Length)
    $client.Close()
  }
}

$listener.Stop()
Write-Host "TIMEOUT"
exit 2
