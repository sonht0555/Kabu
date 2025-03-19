import mGBA_v1 from "../core/1.1.0/mgba.js";
import mGBA_v2 from "../core/2.0.0/mgba.js";
import * as gamepPad from './gamepad.js';
import {localStorageFile} from "./storage.js";
import {dpUploadFile} from "./cloud.js";
import {shaderData} from "./setting.js"
import {wrapContent} from "./state.js"
/*/ ----------------- Switch Ver ------------- */
const versions = { "1.1.0": mGBA_v1, "2.0.0": mGBA_v2 };
let currentVersion = localStorage.getItem("GBAver") || "1.1.0";
let mGBA = versions[currentVersion]; 
document.getElementById("GBAver").textContent = `Wasm_©${currentVersion}`;
document.getElementById("GBAver").addEventListener("click", () => {
    const versionKeys = Object.keys(versions);
    let index = versionKeys.indexOf(currentVersion);
    currentVersion = versionKeys[(index + 1) % versionKeys.length];
    localStorage.setItem("GBAver", currentVersion);
    document.getElementById("GBAver").textContent = `Wasm_©${currentVersion}`;
    setTimeout(() => { window.location.reload(); }, 1000);
});
/*/ --------------- Initialization ----------- */
const Module = {canvas: document.getElementById("canvas-1")};
function initializeCore(coreInitFunction, module) {
    coreInitFunction(module).then(function(module) {
        module.FSInit();
    });
}
initializeCore(mGBA, Module);
/* --------------- Declaration --------------- */
let countAutoSave = 0;
let countUpload = 0;
const canvas = document.getElementById("canvas");
const controlSetting = document.getElementById("control-setting");
/* --------------- Function ------------------ */
// System Tray
function handleVisibilityChange(event) {
    if (document.visibilityState === 'hidden' || event?.type === 'beforeunload' || event?.persisted) {
        Module.FSSync();
        pauseGame();
        canvas.classList.add("visible");
    } else {
        setTimeout(() => {
            canvas.classList.remove("visible");
        }, 600);
        if (controlSetting.classList.contains("visible")) {
            resumeGame();
        }
    }
}
// Status In-game
async function statusShow() {
    document.addEventListener('pagehide', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleVisibilityChange);
    restoreArea();
    startTimer();
    await gamepPad.turboF(parseInt(await getData(gameName, "0", "turboState")));
    await delay(200);
    await Module.SDL2();
    await delay(800);
    await led(parseInt(await getData(gameName, "0", "slotStateSaved")));
    await notiMessage(`W_©${currentVersion}`, 1000);
    await wrapContent();
}
// Auto Save Every 1m
async function saveStatePeriodically() {
    await ledSave("#20A5A6");
    await Module.saveState(0);
    await Module.FSSync();
    await screenShot(0);
    console.log(`Auto save ${++countAutoSave} time(s)`);
}
// Auto Save In Cloud Every 1h
async function saveStateInCloud() {
    const stateName = gameName.replace(/\.(zip|gb|gbc|gba)$/, ".ss0")
    const uId = localStorage.getItem("uId");
    if (navigator.onLine) {
        if (uId) {
            await ledSave("#E0C068");
            await delay(1000);
            await dpUploadFile(stateName, Module.downloadFile(`/data/states/${stateName}`),"state");
            await lockNoti("", `Cloud upload ${++countUpload} time(s)`, 2000)
        }
    }
}
// Time In-game
function startTimer() {
    let [hours, minutes, seconds, count1, count2] = [0, 0, 0, 0, 0];
    setInterval(() => {
        seconds++;
        count1++;
        count2++;
        if (seconds === 60)[seconds, minutes] = [0, minutes + 1];
        if (minutes === 60)[minutes, hours] = [0, hours + 1];
        document.getElementById("timer").textContent = `${hours}h${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
        if (count1 === 60) {saveStatePeriodically();count1 = 0};
        if (count2 === 1800) {saveStateInCloud(); count2=0};
    }, 1000);
}
/* --------------- Export Function --------------- */
export async function uploadGame(romName) {
    const file = romName.files[0];
    Module.uploadRom(file, () => {
        Module.FSSync();
    });
}
export async function loadGame(romName) {
    const stateName = romName.replace(/\.(gba|gbc|gb|zip)$/, ".ss0");
    const statesList = Module.listFiles("states").filter((file) => file !== "." && file !== "..");
    intro.classList.add("disable");
    errorLogElements[0].style.bottom = "0";
    ingame.classList.remove("disable");
    // check file extension
    if (romName.endsWith(".gbc") || romName.endsWith(".gb")) {
        canvas.classList.add("gbc");
        areaTrans.classList.add("gbc1");
        localStorage.setItem("screenSize", `0,0,${window.innerWidth - 230},${(window.innerWidth - 230) * 9 / 10}`)
    } else {
        localStorage.setItem("screenSize", `0,0,${window.innerWidth - 150},${(window.innerWidth - 150) * 2 / 3}`)
    }
    // check save state in local
    if (statesList.includes(stateName)) {
        await Module.loadGame(`/data/games/${romName}`);
        if (confirm("Do you want to load save state?")) {
            await delay(100);
            await Module.loadState(0);
            await shaderData();
        }
    } else {
        await Module.loadGame(`/data/games/${romName}`);
        setTimeout(() => {
        shaderData();
        }, 4000);
    }
    // show status ingame
    Dslay();
    await statusShow();
}
export async function saveState(slot) {
    await Module.saveState(slot);
}
export async function loadState(slot) {
    await Module.loadState(slot);
}
export async function downloadFile(filepath, filename) {
    const save = Module.downloadFile(filepath);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.download = filename;
    const blob = new Blob([save], {
        type: "application/octet-stream",
    });
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(blob);
    a.remove();
}
export function downloadFileInCloud(filepath) {
    try {
        const data = Module.downloadFile(filepath);
        return data;
    } catch (error) {
        return null;
    }
}
export async function uploadFileInCloud(filepath) {
    Module.uploadAll(filepath, async () => {
        localStorageFile();
        await Module.FSSync();
    });
}
export async function uploadFile(filepath) {
    const file = filepath.files[0];
    Module.uploadAll(file, async () => {
        localStorageFile();
        await Module.FSSync();
    });
}
export async function editFile(filepath, filename, newFilename) {
    await Module.editFileName(filepath, filename, newFilename);
}
export async function deleteFile(filepath) {
    try {
        await Module.deleteFile(filepath);
        return true;
    } catch (error) {
        console.error(filepath)
        return null;
    }
}
export function listFiles(name) {
    const result = Module.listFiles(name).filter((file) => file !== "." && file !== "..");
    return result;
}
export function listGame() {
    const result = Module.listRoms().filter((file) => file !== "." && file !== "..");
    return result;
}
export function listSave() {
    const result = Module.listSaves().filter((file) => file !== "." && file !== "..");
    return result;
}
export function listState() {
    const result = Module.listStates().filter((file) => file !== "." && file !== "..");
    return result;
}
export function listCheat() {
    const result = Module.listCheats().filter((file) => file !== "." && file !== "..");
    return result;
}
export function listScreenshot() {
    const result = Module.listScreenshots().filter((file) => file !== "." && file !== "..");
    return result;
}
export function fileSize(filePart) {
    const result = Module.fileSize(filePart)
    return result;
}
export async function resumeGame() {
    Module.resumeGame();
    Module.SDL2();
    notiMessage("Resumed!", 2000);
}
export async function pauseGame() {
    Module.pauseGame();
    Module.SDL2();
    notiMessage("Paused!", 2000);
}
export async function buttonPress(key) {
    Module.buttonPress(key)
}
export async function buttonUnpress(key) {
    Module.buttonUnpress(key)
}
export async function screenShot(saveSlot) {
    const pngName = gameName.replace(/\.(gba|gbc|gb|zip)$/, `_${saveSlot}.png`);
    const backupText = await getData(gameName, saveSlot, "All") || "";
    console.log(backupText);
    await Module.screenshot(pngName);
    await setData(gameName, saveSlot, "saveTime", formatDateTime(Date.now()),backupText);
}
export async function dowloadScreenShot(file) {
    try {
        const base64 = await fileToBase64(Module.downloadFile(file));
        return base64;
    } catch {}
}
export async function captureOCR(name) {
    Module.screenshot(name);
    const file = Module.downloadFile(`/data/screenshots/${name}`);
    return file;
}
export async function setFastForwardMultiplier(number) {
    Module.setFastForwardMultiplier(number);
}
export async function uploadCheats(file) {
        Module.autoLoadCheats();
        Module.uploadAll(file, async () => {
    });
}
export function setVolume(number) {
    Module.setVolume(number);
}
export async function setData(romName, slot, type, text, string = "") {
    const gameName = romName.replace(/\.(gba|gbc|gb|zip|cheats)$/, "");
    const filePath = `/data/screenshots/${gameName}_${slot}.png`;
    let base64;
    try {
        base64 = await fileToBase64(Module.downloadFile(filePath));
    } catch (error) {
        await Module.screenshot(`${gameName}_${slot}.png`);
        await delay(200);
        base64 = await fileToBase64(Module.downloadFile(filePath));
    }
    let byteCharacters = atob(base64.split(',')[1]);
    let textMarker = `tEXtComment\x00`;
    let textStart = byteCharacters.indexOf(textMarker);
    let saveData = {};
    if (textStart !== -1 || string.trim() !== "") {
        let textData = textStart !== -1 
            ? byteCharacters.substring(textStart + textMarker.length) 
            : string;
        let regex = /(\w+)\s*:\s*([^|]*)/g;
        let match;
        while ((match = regex.exec(textData)) !== null) {
            saveData[match[1].trim()] = match[2].trim();
        }
    
        if (textStart !== -1) {
            byteCharacters = byteCharacters.substring(0, textStart);
        }
    }
    saveData[type] = text;
    let saveString = Object.entries(saveData)
        .map(([key, value]) => `${key} : ${value}`)
        .join(" | ");
    let textChunk = new TextEncoder().encode(`${textMarker} ${saveString}`);
    let newArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)).concat([...textChunk]));
    let file = new File([new Blob([newArray], { type: "image/png" })], `${gameName}_${slot}.png`, { type: "image/png" });
    Module.uploadAll(file, async () => {
    });
}
export async function getData(romName, slot, type) {
    try {
        const gameName = romName.replace(/\.(gba|gbc|gb|zip|cheats)$/, "");
        const filePath = `/data/screenshots/${gameName}_${slot}.png`;
        let base64;
        try {
            base64 = await fileToBase64(Module.downloadFile(filePath));
        } catch (error) {
            return null;
        }
        let byteCharacters = atob(base64.split(',')[1]);
        let textMarker = "tEXtComment\x00";
        let textStart = byteCharacters.indexOf(textMarker);
        if (textStart !== -1) {
            let textData = byteCharacters.substring(textStart + textMarker.length);
            if (type === "All") return textData.trim();
            let regex = new RegExp(`${type}\\s*:\\s*(.*?)\\s*(?=\\||$)`);
            let match = textData.match(regex);
            if (match) return match[1].trim();
        }
    } catch (error) {
        console.error({romName, slot, type})
        return null;
    }
}
export async function ledSave(color) {
    const slotState = parseInt(await getData(gameName, "0", "slotStateSaved"));
    const ledId = slotState === 1 ? "led01" : slotState === 2 ? "led02" : slotState === 3 ? "led03" : slotState === 4 ? "led04" : slotState === 5 ? "led05" : slotState === 6 ? "led06" : slotState === 7 ? "led07" : "led00";
    try {
        for (let i = 0; i <= 7; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(245, 232, 209, 0.4)";
        }
        await delay(1000);
        for (let i = 0; i <= 7; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(245, 232, 209, 0.4)";
        }
        document.getElementById(ledId).style.fill = color;
    } catch (error) {
        console.error("Error ledSave:", error);
    }
};
export async function notiMessage(messageContent, second, showCanvas = false) {
    var message = document.getElementById("noti-mess");
    const slotState = parseInt(await getData(gameName, "0", "slotStateSaved")) || 0;
    if (message.style.opacity === "0.4") {
        clearTimeout(messageTimeout);
        message.style.opacity = "0";
    }
    message.textContent = messageContent;
    message.style.opacity = "0.4";
    messageTimeout = setTimeout(() => {
        message.textContent = `[${slotState}] ${gameName.substring(0, gameName.lastIndexOf('.'))}`;
        message.style.opacity = "0.4";
    }, second);
    if (showCanvas) {
        canvas.classList.add("visible");
        setTimeout(() => {
            canvas.classList.remove("visible");
        }, 600);
    }
}
export async function FSSync() {
    Module.FSSync();
}
export const rewind = (type) => Module.toggleRewind?.(type) || null;

export function Dslay() {
  const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = 240*3;
    bufferCanvas.height = 160*3;
    const gl = bufferCanvas.getContext("webgl", { antialias: false });
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = 240*3;
    canvas.height = 160*3;
    canvas.style.transform = "scale(0.5)";
    canvas.style.transformOrigin = "top left";
    canvas.style.imageRendering = "pixelated";
    canvas.style.imageRendering = "-moz-crisp-edges";
    canvas.style.imageRendering = "-webkit-optimize-contrast";
    canvas.style.imageRendering = "crisp-edges";
    canvas.style.willChange = "transform";

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
    precision highp float;
    varying vec2 v_texcoord;
    uniform sampler2D texture;
    uniform float input_gamma;
    uniform float color_correction_strength;
    uniform vec3 red_color;
    uniform vec3 green_color;
    uniform vec3 blue_color;
    uniform float border_strength;

    void main() {
        vec4 orig_color = texture2D(texture, v_texcoord);
        
        // Chỉnh gamma đầu vào
        vec3 color = pow(orig_color.rgb, vec3(input_gamma));
        
        // Điều chỉnh màu dựa trên ma trận màu
        color.rgb = color.r * red_color + color.g * green_color + color.b * blue_color;

        vec2 pixelPos = gl_FragCoord.xy;
        vec2 gridSize = vec2(240.0 * 3.0, 160.0 * 3.0); // Kích thước game mới (1440x960)
        vec2 cellSize = gridSize / vec2(240.0, 160.0);  // Kích thước mỗi pixel logic

        float borderSize = 4.0 / 3.0; // 4px vật lý → 1.33px logic (vì DPR = 3)

        vec2 grid = mod(pixelPos, cellSize); // Vị trí trong mỗi ô pixel

        // Tạo viền dày đúng 4px vật lý (≈ 1.33px logic)
        float borderX = step(cellSize.x - borderSize, grid.x);
        float borderY = step(cellSize.y - borderSize, grid.y);
        float border = max(borderX, borderY); // Viền xuất hiện trên cả trục X & Y

        color.rgb *= 1.0 - border * border_strength; // Áp dụng hiệu ứng đường viền

        // Chỉnh gamma đầu ra
        color.rgb = pow(color.rgb, vec3(1.0 / 2.2));
        
        // Giới hạn giá trị trong khoảng 0 - 1
        color = clamp(color, 0., 1.);
  
        // Kết hợp với màu gốc
        orig_color.rgb = mix(orig_color.rgb, color, color_correction_strength);

        gl_FragColor = orig_color;
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
    const inputGammaLocation = gl.getUniformLocation(program, "input_gamma");
    const colorCorrectionStrengthLocation = gl.getUniformLocation(program, "color_correction_strength");
    const redColorLocation = gl.getUniformLocation(program, "red_color");
    const greenColorLocation = gl.getUniformLocation(program, "green_color");
    const blueColorLocation = gl.getUniformLocation(program, "blue_color");
    const borderStrengthLocation = gl.getUniformLocation(program, "border_strength");

    gl.uniform1f(inputGammaLocation, 3.7);
    gl.uniform1f(colorCorrectionStrengthLocation, 1.0);
    gl.uniform3f(redColorLocation, 1.0, 0.05, 0.0); 
    gl.uniform3f(greenColorLocation, 0.05, 1.0, 0.05); 
    gl.uniform3f(blueColorLocation, 0.0, 0.05, 1.0);  
    gl.uniform1f(borderStrengthLocation, 0.4); // Giảm sáng viền 50%

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
};