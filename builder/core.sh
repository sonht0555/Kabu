
npm install @thenick775/mgba-wasm@1.1.0 --prefix ./temp-mgba && \
cp ./temp-mgba/node_modules/@thenick775/mgba-wasm/dist/mgba.js ./src/core/ && \
cp ./temp-mgba/node_modules/@thenick775/mgba-wasm/dist/mgba.wasm ./src/core/ && \
rm -rf temp-mgba && \
prettier --write ./src/core/mgba.js && \
sed -i '' -e '/Module.getSave = () => FS.readFile(Module.saveName);/{
    r ./builder/data/module-core.txt
    d
}' -e "/dir = \"\/data\/states\/\";/{
    r ./builder/data/module-update-1.txt
    d
}" -e "s/uploadSaveOrSaveState/uploadAll/g" ./src/core/mgba.js

# chmod +x ./builder/core.sh
# ./builder/core.sh