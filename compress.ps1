if (-not (Test-Path -Path 'build' -PathType Container))
{
    mkdir build
}

rm build/*

cp src/nodelib.js build

cat (Get-Item 'src/*.js' | where Name -notmatch 'nodelib\.js') | ac build/nodelib.js
cp 'src/*.css' build

minify build/nodelib.js --outFile build/nodelib.min.js

