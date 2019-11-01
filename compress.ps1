if (-not (Test-Path -Path 'build' -PathType Container))
{
    mkdir build
}

New-Item -name nodelib.js -path build -itemType file

cat src/*.js | sc build/nodelib.js
cp src/*.css build

minify build/nodelib.js --outFile build/nodelib.min.js
rm build/nodelib.js
