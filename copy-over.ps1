$tempDir = "C:\Temp\ProjectToZip"
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tempDir

Get-ChildItem -Path . -Recurse -Exclude "node_modules" | Where-Object { $_.PSIsContainer -or $_.Name -notlike "node_modules" } | Copy-Item -Destination $tempDir -Recurse

Compress-Archive -Path "$tempDir\*" -DestinationPath "project.zip"
