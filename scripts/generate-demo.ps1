param([string]$ParagraphId = '', [string]$ProfileId = '', [switch]$Force)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$story = Get-Content -LiteralPath (Join-Path $projectRoot 'content/story.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($ParagraphId -and -not ($story.paragraphs.id -contains $ParagraphId)) { throw 'Bilinmeyen paragraf kimligi.' }
if ($ProfileId -and $ProfileId -notin @('demo-standard', 'demo-slow')) { throw 'Bilinmeyen demo profili.' }
$voice = New-Object -ComObject SAPI.SpVoice
$token = New-Object -ComObject SAPI.SpObjectToken
$token.SetId('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_trTR_Tolga')
$voice.Voice = $token
foreach ($demoProfile in @(@{id='demo-standard'; rate=0}, @{id='demo-slow'; rate=-2})) {
  if ($ProfileId -and $demoProfile.id -ne $ProfileId) { continue }
  $folder = Join-Path $projectRoot ('assets/audio/' + $demoProfile.id)
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
  $voice.Rate = $demoProfile.rate
  foreach ($paragraph in $story.paragraphs) {
    if ($ParagraphId -and $paragraph.id -ne $ParagraphId) { continue }
    $file = Join-Path $folder ($paragraph.id + '.wav')
    $metadataFile = $file + '.json'
    $identity = $story.id + '|' + $story.textVersion + '|' + $paragraph.id + '|' + $paragraph.text + '|' + $token.Id + '|' + $demoProfile.rate
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    $hash = [BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($identity))).Replace('-', '').ToLowerInvariant()
    $hasher.Dispose()
    if (-not $Force -and (Test-Path -LiteralPath $file) -and (Get-Item -LiteralPath $file).Length -gt 1000 -and (Test-Path -LiteralPath $metadataFile)) {
      $previous = Get-Content -LiteralPath $metadataFile -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($previous.identityHash -eq $hash) { continue }
    }
    $stream = New-Object -ComObject SAPI.SpFileStream
    $stream.Format.Type = 22
    $stream.Open($file, 3)
    $voice.AudioOutputStream = $stream
    $voice.Speak($paragraph.text) | Out-Null
    $stream.Close()
    @{ bookId=$story.id; textVersion=$story.textVersion; paragraphId=$paragraph.id; profile=$demoProfile.id; voice=$token.GetDescription(); rate=$demoProfile.rate; identityHash=$hash } | ConvertTo-Json | Set-Content -LiteralPath $metadataFile -Encoding UTF8
    Write-Output ($demoProfile.id + '/' + $paragraph.id + '.wav')
  }
}


