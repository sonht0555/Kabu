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
let imageDataObj = null;
/* --------------- Function ------------------ */
async function loadLUT64() {
    systemType = gameName.slice(-3);
    const temperatureStreng = localStorage.getItem(`${gameName}_streng`) || "4.0";
    const temperature = (localStorage.getItem(`${gameName}_temperature`) || "warm").toLowerCase();
    if (!lut64 || lut64Streng !== temperatureStreng || lut64Profile !== temperature) {
        const filename = `./src/lut/lut64_${temperature}_${temperatureStreng}.bin`
        console.log(filename);
        const res = await fetch(filename);
        const buf = await res.arrayBuffer();
        lut64 = new Uint8Array(buf);
        lut64Streng = temperatureStreng;
        lut64Profile = temperature;
    }
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
    } else if (mode === "webgl") {
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

function setupWebGL_Shader() {
    // Webgl setup
    gl = bufferCanvas.getContext("webgl", {alpha: false,depth: false,antialias: false,premultipliedAlpha: false,preserveDrawingBuffer: false,powerPreference: 'low-power',});
    gl.viewport(0, 0, bufferCanvas.width, bufferCanvas.height);

    // Shader setup
    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }
    const vs = `attribute vec2 position;attribute vec2 texcoord;varying vec2 v_texcoord;void main() {gl_Position = vec4(position, 0.0, 1.0);v_texcoord = texcoord;}`;
    const fs = `precision mediump float;varying vec2 v_texcoord;uniform sampler2D texture;void main() {gl_FragColor = texture2D(texture, v_texcoord);}`;
    const vertexShader = createShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
}

function setupTexture_Buffer() {
    // Texture setup
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Buffer setup
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "position"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "position"));

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "texcoord"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "texcoord"));
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

    if (mode === "webgl") {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gameWidth, gameHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (mode === "2d") {
        if (!ctx2d) {
            ctx2d = bufferCanvas.getContext("2d" ,{ alpha: false });
            ctx2d.imageSmoothingEnabled = false;
        }
        if (!imageDataObj) {
            imageDataObj = new ImageData(gameWidth, gameHeight);
        } else {
            imageDataObj.data.set(imageData);
        }
        createImageBitmap(imageDataObj).then((bitmap) => {
            ctx2d.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
            ctx2d.drawImage(bitmap, 0, 0);
            bitmap.close();
        });
    }

    requestAnimationFrame(() => renderPixel(mode));
}

export async function switchRenderMode(mode) {
    systemType = gameName.slice(-3)
    if (mode === "2d") {
        setupStyle("2d");
        renderPixel("2d");
    } else if (mode === "webgl") {
        setupStyle("2d");
        setupWebGL_Shader();
        setupTexture_Buffer();
        renderPixel("webgl");
    }
}