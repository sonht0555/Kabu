import mGBA_v2 from "./mgba.js";

/*/ --------------- Initialization ----------- */
const Module = { canvas: document.getElementById("canvas") };
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
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = 240;
    bufferCanvas.height = 160;
    const bufferCtx = bufferCanvas.getContext("2d");

    const canvas = document.getElementById("canvas-1");
    const ctx = canvas.getContext("2d");
    canvas.width = 240; // Giữ nguyên kích thước gốc
    canvas.height = 160;

    // Scale bằng CSS thay vì vẽ trực tiếp
    canvas.style.transform = "scale(1.5)";
    canvas.style.transformOrigin = "top left";
    canvas.style.imageRendering = "pixelated";
    
    function updateFrame() {
        const pixelData = Module.getPixelData();
        const imageData = bufferCtx.createImageData(240, 160);

        for (let i = 0; i < pixelData.length; i++) {
            const color = pixelData[i];
            const index = i * 4;
            
            imageData.data[index] = (color & 0xFF);          // Blue → Red
            imageData.data[index + 1] = (color >> 8) & 0xFF; // Green (không đổi)
            imageData.data[index + 2] = (color >> 16) & 0xFF;// Red → Blue
            imageData.data[index + 3] = 255;                 // Alpha luôn là 255
        }
        bufferCtx.putImageData(imageData, 0, 0);
        
        // Tắt làm mịn pixel
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;
        
        ctx.drawImage(bufferCanvas, 0, 0, 240, 160); // Giữ nguyên size khi vẽ

        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}, 2000);
