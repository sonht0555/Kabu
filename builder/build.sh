# Directories
clear
SRC_DIR="./src"
Docs_DIR="./docs"
Js_DIR="./docs/src"

# Obfuscate JavaScript and Minify CSS
mkdir -p $Js_DIR/js $Js_DIR/css
for file in $SRC_DIR/js/*.js; do
  filename=$(basename $file)
  javascript-obfuscator "$file" --output "$Js_DIR/js/$filename"
done

for file in $SRC_DIR/css/*.css; do
  filename=$(basename $file)
  cleancss -o "$Js_DIR/css/$filename" "$file"
done

# Increment revision in sw.js
revision=$(grep "let revision =" ./sw.js | sed "s/.*'V//;s/'.*//")
major_version=$(echo $revision | cut -d'.' -f1)
minor_version=$(echo $revision | cut -d'.' -f2 | sed 's/^0*//')
minor_version=$((minor_version + 1))

# Handle overflow of minor version
if [ $minor_version -ge 100 ]; then
  minor_version=0
  major_version=$((major_version + 1))
fi

new_revision="V${major_version}.$(printf "%02d" $minor_version)"

# Update revision in sw.js
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/let revision = 'V[0-9]*\.[0-9]*';/let revision = '$new_revision';/" ./sw.js
else
  sed -i "s/let revision = 'V[0-9]*\.[0-9]*';/let revision = '$new_revision';/" ./sw.js
fi

# Increment version in index.html
game_version=$(grep "let gameVer =" ./index.html | sed "s/.*'V//;s/';.*//")
major_version=$(echo $game_version | cut -d'.' -f1)
minor_version=$(echo $game_version | cut -d'.' -f2 | sed 's/^0*//') 
minor_version=$((minor_version + 1))

# Handle overflow of minor version
if [ $minor_version -ge 100 ]; then
  minor_version=0
  major_version=$((major_version + 1))
fi
Vers="V${major_version}.$(printf "%02d" $minor_version)"

# Update version in index.html
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/let gameVer = 'V[0-9]*\.[0-9]*';/let gameVer = '$Vers';/" ./index.html
else
  sed -i "s/let gameVer = 'V[0-9]*\.[0-9]*';/let gameVer = '$Vers';/" ./index.html
fi

# Copy static files
cp ./index.html ./manifest.json ./sw.js ./CNAME ./_headers $Docs_DIR/
mkdir -p $Docs_DIR/img
cp ./img/* $Docs_DIR/img/
mkdir -p $Docs_DIR/src/font/
cp ./src/font/* $Docs_DIR/src/font/
mkdir -p $Docs_DIR/src/core/
cp -r ./src/core/* $Docs_DIR/src/core/
mkdir -p $Docs_DIR/src/library/
cp ./src/library/* $Docs_DIR/src/library/
git add . && git commit -m "--- Build $Vers ---" && git push origin main
clear
echo "╔═════════════════════╗"
echo "║ --- Build $Vers --- ║"
echo "╚═════════════════════╝"

# --- (install minify) ---
# sudo npm install -g javascript-obfuscator
# sudo npm install -g clean-css-cli
# --- (add execute permission) ---
# chmod +x ./builder/build.sh
# --- (run build) ---
# --- (V2.80) ---
# ./builder/build.sh
# cd /c/Users/hoang/OneDrive/Documents/GitHub/Kabu