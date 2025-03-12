import mGBA_v2 from "./mgba.js";
/*/ --------------- Initialization ----------- */
const Module = {canvas: document.getElementById("canvas")};
function initializeCore(coreInitFunction, module) {
    coreInitFunction(module).then(function (module) {
        module.FSInit();
    });
}

initializeCore(mGBA_v2, Module);
setTimeout(() => {
    Module.loadGame(`/data/games/Goodboy Galaxy.zip`);
    Module.displaySet(false);
}, 1000);

setTimeout(() => {
    function updateFrame() {
        const canvas = document.getElementById("canvas-1");
        const ctx = canvas.getContext("2d");
        canvas.width = 240;
        canvas.height = 160;
    
        const pixelData = Module.getPixelData();
        const imageData = ctx.createImageData(240, 160);
    
        for (let i = 0; i < pixelData.length; i++) {
            const color = pixelData[i];
            const index = i * 4;
            
            imageData.data[index] = (color & 0xFF);          // Blue → Red
            imageData.data[index + 1] = (color >> 8) & 0xFF; // Green (không đổi)
            imageData.data[index + 2] = (color >> 16) & 0xFF;// Red → Blue
            imageData.data[index + 3] = 255;                 // Alpha luôn là 255
        }
        ctx.putImageData(imageData, 0, 0);
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}, 2000);
