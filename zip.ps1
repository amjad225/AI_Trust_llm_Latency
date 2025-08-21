Get-ChildItem -Path . -Recurse -Exclude "node_modules" | Compress-Archive -DestinationPath project.zip
