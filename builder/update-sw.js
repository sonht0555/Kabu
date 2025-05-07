const fs = require('fs');
const path = require('path');
const baseDir = './'; 
const swFile = './sw.js'; 
const urlsToCacheStart = 'var urlsToCache = ['; 
const urlsToCacheEnd = '];';
function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (file.startsWith('.')) {
            return;
        }
        if (file === 'docs' || file === '' || file === 'builder') {
            return;
        }
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else {
            fileList.push('./' + path.relative(baseDir, filePath).split(path.sep).join('/'));
        }
    });
    return fileList;
}
let filesToCache = getFiles(baseDir).filter(file => {
    return !file.includes('node_modules') && !file.includes('update-cache-files.js') && !file.includes('package.json');});
if (!filesToCache.includes('/')) {
    filesToCache.unshift('/');
}
let swContent = fs.readFileSync(swFile, 'utf8');
const urlsToCacheContent = `var urlsToCache = [\n    ${filesToCache.map(file => `'${file}'`).join(',\n    ')}\n];`;
const updatedSwContent = swContent.replace(
    new RegExp(`${urlsToCacheStart}[\\s\\S]*?${urlsToCacheEnd}`, 'm'),
    urlsToCacheContent
);
fs.writeFileSync(swFile, updatedSwContent, 'utf8');
console.log(`Updated urlsToCache in ${swFile}`);
// node ./builder/update-sw.js