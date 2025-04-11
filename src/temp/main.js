import mGBA_v2 from "./mgba.js";

const Module = { canvas: document.getElementById("canvas") };
function initializeCore(coreInitFunction, module) {
    coreInitFunction(module).then(function (module) {
        module.FSInit();
    });
}

initializeCore(mGBA_v2, Module);
setTimeout(() => {
    Module.loadGame(`/data/games/Goodboy Galaxy.zip`);
}, 1000);

setTimeout(() => {
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = 240;
    bufferCanvas.height = 160;
    const gl = bufferCanvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    const canvas = document.getElementById("canvas-1");
    const ctx = canvas.getContext("2d");
    canvas.width = 240;
    canvas.height = 160;
    canvas.style.transform = "scale(1.5)";
    canvas.style.transformOrigin = "top left";
    canvas.style.imageRendering = "pixelated";

    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.oImageSmoothingEnabled = false;

    const vertexShaderSource = `
        attribute vec2 position;
        attribute vec2 texcoord;
        varying vec2 v_texcoord;
        void main() {
            gl_Position = vec4(position, 0, 1);
            v_texcoord = texcoord;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        varying vec2 v_texcoord;
        uniform sampler2D texture;
        void main() {
            gl_FragColor = texture2D(texture, v_texcoord);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        1, 0,
    ]), gl.STATIC_DRAW);

    const texcoordLocation = gl.getAttribLocation(program, "texcoord");
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    function updateFrame() {
        const pixelData = Module.getPixelData();
        const imageData = new Uint8Array(240 * 160 * 4);

        for (let i = 0; i < pixelData.length; i++) {
            const color = pixelData[i];
            const index = i * 4;
            imageData[index] = (color & 0xFF);
            imageData[index + 1] = (color >> 8) & 0xFF;
            imageData[index + 2] = (color >> 16) & 0xFF;
            imageData[index + 3] = 255;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 240, 160, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ctx.drawImage(bufferCanvas, 0, 0);
        requestAnimationFrame(updateFrame);
    }
    updateFrame();
}, 2000);