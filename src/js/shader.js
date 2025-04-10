import * as Main from './main.js';
/* --------------- Declaration --------------- */
let gl = null;
let program = null;
let systemType;
let clientWidth;
let upscaleFactor = 3;
let upscaleShader;
let gameWidth;
let gameHeight;
let gameStride;
let texture;
let integerScaling
let ctx2d = null;
let lut64 = null;
let lut64Streng = null;
let lut64Profile = null;
const textured = document.getElementById("textured")
const bufferCanvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvas-container")
const imgShader = document.getElementById("img-shader")
const settingContainer = document.querySelectorAll(".setting-container")
const messageContainer = document.querySelectorAll(".message-container")
const stateTitle = document.querySelectorAll(".stateTitle, .stateDate")
/* --------------- Function ------------------ */
async function loadLUT64() {
    systemType = gameName.slice(-3);
    const colorStreng = localStorage.getItem(`${gameName}_streng`) || "4.0";
    const colorProfile = (localStorage.getItem(`${gameName}_colorProfile`) || "gba").toLowerCase();
    if (!lut64 || lut64Streng !== colorStreng || lut64Profile !== colorProfile) {
        const filename = `./src/lut/lut64_${colorProfile}_${colorStreng}.bin`
        console.log(filename);
        const res = await fetch(filename);
        const buf = await res.arrayBuffer();
        lut64 = new Uint8Array(buf);
        lut64Streng = colorStreng;
        lut64Profile = colorProfile;
    }
}

async function loadShaderSource(url) {
    const response = await fetch(url);
    return await response.text();
}

function setupStyle(mode) {
    clientWidth = document.documentElement.clientWidth;
    const dpr = window.devicePixelRatio;
    if (systemType === "gbc") {
        gameWidth = 160;
        gameHeight = 144;
        gameStride = 256;
        upscaleShader = 3;
        integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
        localStorage.setItem("screenSize", `0,0,${ gameWidth*(integerScaling/dpr)},${gameHeight*(integerScaling/dpr)}`)
    } else {
        gameWidth = 240;
        gameHeight = 160;
        gameStride = 240;
        upscaleShader = 2;
        integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
        localStorage.setItem("screenSize", `0,0,${gameWidth*(integerScaling/dpr)},${gameHeight*(integerScaling/dpr)}`)
    }
    if (mode === "2d") {
        bufferCanvas.width = gameWidth;
        bufferCanvas.height = gameHeight;
        bufferCanvas.style.zoom = `${integerScaling / dpr}`;
        bufferCanvas.style.imageRendering = "crisp-edges";
        canvasContainer.style.width = `${gameWidth * (integerScaling / dpr)}px`;
        canvasContainer.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        textured.style.width = `${gameWidth * (integerScaling / dpr)}px`;
        textured.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        imgShader.style.transform = `scale(${integerScaling / dpr/  upscaleShader})`;
        settingContainer.forEach(function(element) {
            element.style.width = `${gameWidth * (integerScaling / dpr)}px`;
            element.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        });
        messageContainer.forEach(function(element) {
            element.style.width = `${gameWidth}px`;
            element.style.height = `${gameHeight}px`;
            element.style.zoom = `${integerScaling / dpr}`;
        });
        stateTitle.forEach(function(element) {
            element.classList.remove("fefs")
        });
    } else if (mode === "webgl2") {
        bufferCanvas.width = clientWidth * upscaleFactor;
        bufferCanvas.height = clientWidth * upscaleFactor * (gameHeight / gameWidth);
        bufferCanvas.style.zoom = `${1 / upscaleFactor}`;
        bufferCanvas.style.imageRendering = "";
        canvasContainer.style.width = `${clientWidth}px`;
        canvasContainer.style.height = `${clientWidth * (gameHeight / gameWidth)}px`;
        textured.style.width = `${clientWidth}px`;
        textured.style.height = `${clientWidth * (gameHeight / gameWidth)}px`;
        imgShader.style.transform = `scale(${(clientWidth / gameWidth) / upscaleShader})`;
        settingContainer.forEach(function(element) {
            element.style.width = `${clientWidth}px`;
            element.style.height = `${clientWidth * (gameHeight / gameWidth)}px`;
        });
        messageContainer.forEach(function(element) {
            element.style.width = `${gameWidth}px`;
            element.style.height = `${gameHeight}px`;
            element.style.zoom = `${(clientWidth / gameWidth)}`;
        });
        stateTitle.forEach(function(element) {
            element.classList.add("fefs")
        });
    }
    imgShader.style.width = `${gameWidth * upscaleShader}px`;
    imgShader.style.height = `${gameHeight * upscaleShader}px`;
    imgShader.style.transformOrigin = "top center";
    imgShader.style.setProperty('--bg-size', `${upscaleShader}px ${upscaleShader}px`);
}

function setupWebGL() {
    gl = bufferCanvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL2 not supported");
        return null;
    }
    gl.viewport(0, 0, bufferCanvas.width, bufferCanvas.height);
}

function createShader(type, source) {
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

async function setupShaders() {
    const vertexShaderSource = await loadShaderSource('./src/shaders/vertexShader.glsl');
    const fragmentShaderSource = await loadShaderSource('./src/shaders/fragmentShader.glsl');
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
}

function setupTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(gl.getUniformLocation(program, "game_size"), gameWidth, gameHeight);
    gl.uniform2f(gl.getUniformLocation(program, "render_size"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, "smooth_width"), gameWidth / gl.canvas.width);
    gl.uniform1f(gl.getUniformLocation(program, "smooth_height"), gameHeight / gl.canvas.height);
}

function setupBuffers() {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1, ]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1, 1, 1, 0, 0, 1, 0,
    ]), gl.STATIC_DRAW);
    const texcoordLocation = gl.getAttribLocation(program, "texcoord");
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
}

async function renderPixel(mode) {
    const pixelData = Main.getPixelData();
    if (!pixelData) return;
    await loadLUT64();
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

    if (mode === "webgl2") {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gameWidth, gameHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (mode === "2d") {
        ctx2d = bufferCanvas.getContext("2d");
        ctx2d.imageSmoothingEnabled = false;
        const imageDataObj = new ImageData(imageData, gameWidth, gameHeight);
        createImageBitmap(imageDataObj).then((bitmap) => {
            ctx2d.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
            ctx2d.drawImage(bitmap, 0, 0);
        });
    }

    requestAnimationFrame(() => renderPixel(mode));
}

export async function switchRenderMode(mode) {
    systemType = gameName.slice(-3)
    if (mode === "2d") {
        setupStyle("2d");
        renderPixel("2d");
    } else if (mode === "webgl2") {
        setupStyle("webgl2");
        setupWebGL();
        await setupShaders();
        setupTexture();
        setupBuffers();
        renderPixel("webgl2");
    }
}

/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {})