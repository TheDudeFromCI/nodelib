Write-Output "Compressing project..."

if (-not (Test-Path -Path 'build' -PathType Container)) {
    mkdir build
}

Remove-Item build/*

Copy-Item src/nodelib.js build

Get-Content (Get-Item 'src/*.js' | Where-Object Name -notmatch 'nodelib\.js') | Add-Content build/nodelib.js
Copy-Item 'src/*.css' build/nodelib.theme.css

minify build/nodelib.js --outFile build/nodelib.min.js

