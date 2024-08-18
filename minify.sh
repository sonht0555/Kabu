# Obfuscate JavaScript
JS_SRC_DIR="./src/js"
JS_DEST_DIR="./src/jsm"
mkdir -p $JS_DEST_DIR
for file in $JS_SRC_DIR/*.js
do
  filename=$(basename $file)
  javascript-obfuscator "$file" --output "$JS_DEST_DIR/$filename"
done
echo "JavaScript Obfuscation completed."

# Minify CSS
CSS_SRC_DIR="./src/css"
CSS_DEST_DIR="./src/cssm"
mkdir -p $CSS_DEST_DIR
for file in $CSS_SRC_DIR/*.css
do
  filename=$(basename $file)
  cleancss -o "$CSS_DEST_DIR/$filename" $file
done
echo "CSS Minification completed."


# --- (install minify) ---
# sudo npm install -g javascript-obfuscator
# sudo npm install -g clean-css-cli
# --- (add execute permission) ---
# chmod +x minify.sh
# --- (run minify) ---
# ./minify.sh