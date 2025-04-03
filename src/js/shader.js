import * as Main from './main.js';
/* --------------- Declaration --------------- */
let gl = null;
let program = null;
let systemType;
let integerStatus;
let enableColorAdjustment = 1;
let upscaleFactor = 3;
let upscaleShader;
let gameWidth;
let gameHeight;
let gameStride;
let texture;
const textured = document.getElementById("textured")
const bufferCanvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvas-container")
const imgShader = document.getElementById("img-shader")
const settingContainer = document.querySelectorAll(".setting-container")
const messageContainer = document.querySelectorAll(".message-container")
//const shaderElement = document.getElementById("shader");
/* --------------- Function ------------------ */
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

async function loadShaderSource(url) {
    const response = await fetch(url);
    return await response.text();
}

export function updateViewport() {
    gl.useProgram(program);
}

export function updateIntegerScaling () {
    gl.useProgram(program);
    if ((localStorage.getItem ("integer") || "Off") === "On") {
        setupStyle();
        gl.viewport(0, 0, gameWidth, gameHeight);
        gl.uniform2f(gl.getUniformLocation(program, "render_size"), gameWidth, gameHeight);
      } else {
        setupStyle();
        gl.viewport(0, 0, bufferCanvas.width, bufferCanvas.height);
        gl.uniform2f(gl.getUniformLocation(program, "render_size"), bufferCanvas.width, bufferCanvas.height);
      }
}

function setupStyle() {
    const clientWidth = document.documentElement.clientWidth;
    const dpr = window.devicePixelRatio;
    if (systemType === "gbc") {
        gameWidth = 160;
        gameHeight = 144;
        gameStride = 256;
        upscaleShader = 3;
    } else {
        gameWidth = 240;
        gameHeight = 160;
        gameStride = 240;
        upscaleShader = 2;
    }
    if ((localStorage.getItem ("integer") || "Off") === "On") {
        const integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
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
    } else {
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

async function setupShaders() {
    const vertexShaderSource = await loadShaderSource('./shaders/vertexShader.glsl');
    const fragmentShaderSource = await loadShaderSource('./shaders/fragmentShader.glsl');
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
    if (systemType === "gbc") {
        console.log("gbc")
        gl.uniform1f(gl.getUniformLocation(program, "input_gamma"), 2.2);
        gl.uniform3f(gl.getUniformLocation(program, "red_color"), 26. / 32, 0. / 32, 6. / 32);
        gl.uniform3f(gl.getUniformLocation(program, "green_color"), 4. / 32, 24. / 32, 4. / 32);
        gl.uniform3f(gl.getUniformLocation(program, "blue_color"), 2. / 32, 8. / 32, 22. / 32);
    } else {
        console.log("gba")
        gl.uniform1f(gl.getUniformLocation(program, "input_gamma"), 3.7);
        gl.uniform3f(gl.getUniformLocation(program, "red_color"), 1.0, 0.05, 0.0);
        gl.uniform3f(gl.getUniformLocation(program, "green_color"), 0.05, 1.0, 0.05);
        gl.uniform3f(gl.getUniformLocation(program, "blue_color"), 0.0, 0.05, 1.0);
    }
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

async function renderPixel() {
    const pixelData = Main.getPixelData();
    if (!pixelData) return;
    const imageData = new Uint8Array(gameWidth * gameHeight * 4);
    for (let y = 0; y < gameHeight; y++) {
        for (let x = 0; x < gameWidth; x++) {
            const srcIndex = y * gameStride + x;
            const destIndex = (y * gameWidth + x) * 4;
            const color = pixelData[srcIndex];
            imageData[destIndex] = (color & 0xFF);
            imageData[destIndex + 1] = (color >> 8) & 0xFF;
            imageData[destIndex + 2] = (color >> 16) & 0xFF;
            imageData[destIndex + 3] = 255;
        }
    }
    const colorStreng = await Main.getData(gameName, "1", "streng") || 1.0;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gameWidth, gameHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(gl.getUniformLocation(program, "enable_color_adjustment"), enableColorAdjustment);
    gl.uniform1f(gl.getUniformLocation(program, "color_correction_strength"), colorStreng);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(() => renderPixel(gl, texture, gameWidth, gameHeight, gameStride, program));
}

export async function runG() {
    systemType = gameName.slice(-3);
    console.log("systemType", systemType)
    setupStyle();
    setupWebGL();
    await setupShaders();
    setupTexture();
    setupBuffers();
    renderPixel();
}

/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
 
   
})