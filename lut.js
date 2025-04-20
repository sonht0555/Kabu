const fs = require('fs');

function createColorToLutIndexMap() {
    const map = new Uint32Array(0xFFFFFF + 1);
    
    for (let color = 0; color <= 0xFFFFFF; color++) {
        const r = (color & 0xFF) >> 2;
        const g = ((color >> 8) & 0xFF) >> 2;
        const b = ((color >> 16) & 0xFF) >> 2;
        
        const lutIndex = ((r * 64 * 64) + (g * 64) + b) * 3;
        map[color] = lutIndex;
    }
    
    return map;
}

const map = createColorToLutIndexMap();
const buffer = Buffer.from(map.buffer);
fs.writeFileSync('colorToLutIndex.bin', buffer);
