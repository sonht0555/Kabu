
npm install @thenick775/mgba-wasm@1.0.20 --prefix ./temp-mgba && \
cp ./temp-mgba/node_modules/@thenick775/mgba-wasm/dist/mgba.js ./src/core/ && \
cp ./temp-mgba/node_modules/@thenick775/mgba-wasm/dist/mgba.wasm ./src/core/ && \
rm -rf temp-mgba && \
prettier --write ./src/core/mgba.js && \
sed -i '' '/Module.getSave = () => FS.readFile(Module.saveName);/{
    r ./builder/replacement.txt
    d
}' ./src/core/mgba.js

# chmod +x ./builder/build.sh
# ./builder/build.sh