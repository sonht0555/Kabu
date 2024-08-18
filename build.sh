#!/bin/bash

# Directories
SRC_DIR="./src"
DEST_DIR="./docs"

# Increment revision in sw.js
revision=$(grep "let revision =" ./sw.js | sed "s/.*'V//;s/'.*//")
major_version=$(echo $revision | cut -d'.' -f1)
minor_version=$(echo $revision | cut -d'.' -f2)
minor_version=$((minor_version + 1))

# Handle overflow of minor version
if [ $minor_version -ge 100 ]; then
  minor_version=0
  major_version=$((major_version + 1))
fi

new_revision="V${major_version}.$(printf "%02d" $minor_version)"
echo "Updating revision to $new_revision"

# Update revision in sw.js
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/let revision = 'V[0-9]*\.[0-9]*';/let revision = '$new_revision';/" ./sw.js
else
  sed -i "s/let revision = 'V[0-9]*\.[0-9]*';/let revision = '$new_revision';/" ./sw.js
fi

echo "Revision updated to $new_revision."

# Increment version in index.html
game_version=$(grep "let gameVer =" ./index.html | sed "s/.*'V//;s/';.*//")
major_version=$(echo $game_version | cut -d'.' -f1)
minor_version=$(echo $game_version | cut -d'.' -f2)
minor_version=$((minor_version + 1))

# Handle overflow of minor version
if [ $minor_version -ge 100 ]; then
  minor_version=0
  major_version=$((major_version + 1))
fi

new_game_version="V${major_version}.$(printf "%02d" $minor_version)"
echo "Updating game version to $new_game_version"

# Update version in index.html
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/let gameVer = 'V[0-9]*\.[0-9]*';/let gameVer = '$new_game_version';/" ./index.html
else
  sed -i "s/let gameVer = 'V[0-9]*\.[0-9]*';/let gameVer = '$new_game_version';/" ./index.html
fi

echo "Game version updated to $new_game_version."

# Obfuscate JavaScript and Minify CSS
mkdir -p $DEST_DIR/js $DEST_DIR/css
for file in $SRC_DIR/js/*.js; do
  filename=$(basename $file)
  javascript-obfuscator "$file" --output "$DEST_DIR/js/$filename"
done
echo "JavaScript Obfuscation completed."

for file in $SRC_DIR/css/*.css; do
  filename=$(basename $file)
  cleancss -o "$DEST_DIR/css/$filename" "$file"
done
echo "CSS Minification completed."

# Copy static files
cp ./index.html ./manifest.json ./sw.js $DEST_DIR/
mkdir -p $DEST_DIR/img
cp ./img/* $DEST_DIR/img/
echo "Static files copied."

# --- (install minify) ---
# sudo npm install -g javascript-obfuscator
# sudo npm install -g clean-css-cli
# --- (add execute permission) ---
# chmod +x build.sh
# --- (run build) ---
# ./build.sh
