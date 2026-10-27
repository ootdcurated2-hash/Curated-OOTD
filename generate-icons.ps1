Add-Type -AssemblyName System.Drawing

function Create-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$rect,
        [float]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2.0
    $arc = New-Object System.Drawing.RectangleF($rect.X, $rect.Y, $diameter, $diameter)
    
    # Top-left
    $path.AddArc($arc, 180, 90)
    
    # Top-right
    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)
    
    # Bottom-right
    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)
    
    # Bottom-left
    $arc.X = $rect.Left
    $path.AddArc($arc, 90, 90)
    
    $path.CloseFigure()
    return $path
}

function Generate-AppIcon {
    param(
        [int]$size,
        [string]$outputPath
    )
    
    $srcImage = [System.Drawing.Image]::FromFile('public/icon-512-transparent.png')
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Clear transparent
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Draw soft subtle gradient background with rounded squircle/rounded rectangle
    # Soft luxury fashion pink gradient: #fff5f8 to #ffe1eb
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 255, 248, 250), # #fff8fa
        [System.Drawing.Color]::FromArgb(255, 255, 226, 237), # #ffe2ed
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    
    # Fill the entire canvas for maskable icon
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    
    # Optional subtle inner glow/circle
    $centerCircleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
    $circleSize = $size * 0.85
    $circleOffset = ($size - $circleSize) / 2
    $g.FillEllipse($centerCircleBrush, $circleOffset, $circleOffset, $circleSize, $circleSize)
    
    # Calculate logo drawing area (safe zone with 66% width for PWA maskable compliance)
    $logoWidth = $size * 0.65
    $logoHeight = $size * 0.65
    $logoX = ($size - $logoWidth) / 2
    $logoY = ($size - $logoHeight) / 2
    
    # Draw logo with high quality
    $destRect = New-Object System.Drawing.RectangleF($logoX, $logoY, $logoWidth, $logoHeight)
    $g.DrawImage($srcImage, $destRect)
    
    # Clean up
    $bgBrush.Dispose()
    $centerCircleBrush.Dispose()
    $g.Dispose()
    $srcImage.Dispose()
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated $outputPath ($size x $size)"
}

Generate-AppIcon -size 512 -outputPath "public/icon-512.png"
Generate-AppIcon -size 192 -outputPath "public/icon-192.png"
Generate-AppIcon -size 180 -outputPath "public/apple-touch-icon.png"
