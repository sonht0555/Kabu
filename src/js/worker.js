onmessage = function(e) {
    const { pixelData, gameWidth, gameHeight, gameStride, lut64 } = e.data;
    const imageData = new Uint8ClampedArray(gameWidth * gameHeight * 4);

    for (let y = 0; y < gameHeight; y++) {
        for (let x = 0; x < gameWidth; x++) {
            const srcIndex = y * gameStride + x;
            const destIndex = (y * gameWidth + x) * 4;
            const color = pixelData[srcIndex];
            const r = (color & 0xFF) >> 2;
            const g = ((color >> 8) & 0xFF) >> 2;
            const b = ((color >> 16) & 0xFF) >> 2;
            const lutIndex = ((r * 64 * 64) + (g * 64) + b) * 3;
            imageData[destIndex]     = lut64[lutIndex];
            imageData[destIndex + 1] = lut64[lutIndex + 1];
            imageData[destIndex + 2] = lut64[lutIndex + 2];
            imageData[destIndex + 3] = 255;
        }
    }

    postMessage(imageData);
};
