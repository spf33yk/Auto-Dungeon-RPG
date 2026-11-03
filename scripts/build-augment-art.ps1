param(
  [string]$AtlasSource = 'art/local-originals/augments-v1/atlas-transparent.png',
  [string]$FrameSource = 'art/local-originals/augments-v1/frame-source.png'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$format = Get-Content -Raw 'art/ui/augments-v1/format.json' | ConvertFrom-Json
$atlas = [Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $AtlasSource))
$frame = [Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $FrameSource))
function Export-FittedImage($source, $rect, $width, $height, $path, $transparent) {
  $bitmap = [Drawing.Bitmap]::new($width, $height)
  $graphics = [Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear($(if ($transparent) { [Drawing.Color]::Transparent } else { [Drawing.Color]::Black }))
  $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scale = [Math]::Min($width / $rect.Width, $height / $rect.Height)
  $dw = $rect.Width * $scale; $dh = $rect.Height * $scale
  $dest = [Drawing.RectangleF]::new(($width-$dw)/2, ($height-$dh)/2, $dw, $dh)
  $graphics.DrawImage($source, $dest, $rect, [Drawing.GraphicsUnit]::Pixel)
  if ($transparent) { $bitmap.Save($path, [Drawing.Imaging.ImageFormat]::Png) }
  else {
    $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
    $parameters = [Drawing.Imaging.EncoderParameters]::new(1)
    $parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]86)
    $bitmap.Save($path, $codec, $parameters); $parameters.Dispose()
  }
  $graphics.Dispose(); $bitmap.Dispose()
}
try {
  if ($atlas.Width -ne $format.sourceWidth -or $atlas.Height -ne $format.sourceHeight) { throw 'Atlas dimensions do not match format.json' }
  New-Item -ItemType Directory -Force 'art/local-originals/augments-v1/export' | Out-Null
  foreach ($icon in $format.icons) {
    $column = $icon.index % 4; $row = [Math]::Floor($icon.index / 4)
    $x = $format.columns[$column]+2; $y = $format.rows[$row]+2
    $rect = [Drawing.RectangleF]::new($x, $y, $format.columns[$column+1]-$x-2, $format.rows[$row+1]-$y-2)
    Export-FittedImage $atlas $rect 192 240 "art/local-originals/augments-v1/export/$($icon.id).png" $true
  }
  Export-FittedImage $frame ([Drawing.RectangleF]::new(0,0,$frame.Width,$frame.Height)) 384 576 'art/ui/augments-v1/frame.png' $true
} finally { $atlas.Dispose(); $frame.Dispose() }
Write-Output "Exported $($format.icons.Count) augment illustrations and a transparent frame without changing aspect ratios."

$python = if ($env:AUGMENT_PYTHON) { $env:AUGMENT_PYTHON } else { 'tools/python312/python.exe' }
& $python scripts/encode-augment-webp.py
if ($LASTEXITCODE -ne 0) { throw 'WebP export failed' }
