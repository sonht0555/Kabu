import mGBA from "../core/mgba.js";
import * as gamepPad from './gamepad.js';
import {localStorageFile} from "./storage.js";
import {dpUploadFile} from "./cloud.js";
import {shaderData} from "./setting.js"
/*/ --------------- Initialization ----------- */
const Module = {canvas: document.getElementById("canvas")};
function initializeCore(coreInitFunction, module) {
    coreInitFunction(module).then(function(module) {
        module.FSInit();
    });
}
initializeCore(mGBA, Module);
/* --------------- Declaration --------------- */
let countAutoSave = 0;
let turboState = 1;
let countUpload = 0;
const canvas = document.getElementById("canvas");
const savedTurboState = localStorage.getItem("turboState");
const controlSetting = document.getElementById("control-setting");
/* --------------- Function ------------------ */
// System Tray
function handleVisibilityChange(event) {
    if (document.visibilityState === 'hidden' || event?.type === 'beforeunload' || event?.persisted) {
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
    if (savedTurboState !== null) {
        turboState = parseInt(savedTurboState);
        await gamepPad.turboF(turboState);
    }
    await delay(200);
    await Module.SDL2();
    await delay(800);
    await led(parseInt(localStorage.getItem("slotStateSaved")));
    await notiMessage(gameVer, 1000);
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
    const gameName = localStorage.getItem("gameName");
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
export async function uploadGame(gameName) {
    const file = gameName.files[0];
    Module.uploadRom(file, () => {
        Module.FSSync();
    });
}
export async function loadGame(gameName) {
    const stateName = gameName.replace(/\.(gba|gbc|gb|zip)$/, ".ss0");
    const statesList = Module.listStates().filter((file) => file !== "." && file !== "..");
    intro.classList.add("disable");
    errorLogElements[0].style.bottom = "0";
    ingame.classList.remove("disable");
    // check file extension
    if (gameName.endsWith(".gbc") || gameName.endsWith(".gb")) {
        canvas.classList.add("gbc");
        areaTrans.classList.add("gbc1");
        localStorage.setItem("screenSize", `0,0,${window.innerWidth - 230},${(window.innerWidth - 230) * 9 / 10}`)
    } else {
        localStorage.setItem("screenSize", `0,0,${window.innerWidth - 150},${(window.innerWidth - 150) * 2 / 3}`)
    }
    // check save state in local
    if (statesList.includes(stateName)) {
        await Module.loadGame(`/data/games/${gameName}`);
        if (confirm("Do you want to load save state?")) {
            await Module.loadState(0);
            localStorage.setItem("gameName", gameName);
            await shaderData();
            console.log(gameName);
        }
    } else {
        await Module.loadGame(`/data/games/${gameName}`);
        localStorage.setItem("gameName", gameName);
        await shaderData();
        console.log(gameName);
    }
    // show status ingame
    await statusShow();
}
export async function saveState(slot) {
    await Module.saveState(slot);
    await Module.FSSync();
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
    const data = Module.downloadFile(filepath);
    return data;
}
export async function uploadFileInCloud(filepath) {
    Module.uploadAll(filepath, () => {
        localStorageFile();
        Module.FSSync();
    });
}
export async function uploadFile(filepath) {
    const file = filepath.files[0];
    Module.uploadAll(file, () => {
        localStorageFile();
        Module.FSSync();
    });
}
export async function editFile(filepath, filename, newFilename) {
    await Module.editFileName(filepath, filename, newFilename);
    await Module.FSSync()
}
export async function deleteFile(filepath) {
    await Module.deleteFile(filepath);
    await Module.FSSync()
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
export function embedTextInPngFile(base64, text, fileName) {
    let byteCharacters = atob(base64.split(',')[1]);
    let byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
    }
    let textChunk = new TextEncoder().encode("tEXtComment\x00" + text);
    let newArray = new Uint8Array(byteArray.length + textChunk.length);
    newArray.set(byteArray, 0);
    newArray.set(textChunk, byteArray.length);
    let blob = new Blob([newArray], { type: "image/png" });
    let file = new File([blob], fileName, { type: "image/png" });

    return file;
}
export function extractTextFromPngBase64(base64) {
    let byteCharacters = atob(base64.split(',')[1]);
    let textMarker = "tEXtComment\x00";
    let textStart = byteCharacters.indexOf(textMarker);
    if (textStart !== -1) {
        return byteCharacters.substring(textStart + textMarker.length);
    }
    return null;
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
    const gameName = localStorage.getItem("gameName").replace(/\.(gba|gbc|gb|zip)$/, "");
    const fileName = `${gameName}_${saveSlot}.png`;
    await Module.screenshot(fileName);
    await Module.FSSync();
    const base64 = await fileToBase64(Module.downloadFile(`/data/screenshots/${fileName}`));
    const embeddedFile = embedTextInPngFile(base64, formatDateTime(Date.now()), fileName);
    Module.uploadAll(embeddedFile, () => {localStorageFile();Module.FSSync();});
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
export function uploadCheats(file,gameName,newCheatCode,cheatEnable,box1) {
    Module.uploadAll(file, () => {
        Module.autoLoadCheats();
        setTimeout(() => {
            Module.FSSync();
        }, 500);
        if (cheatEnable) {
            localStorage.setItem(`${gameName}_savedCheats`, newCheatCode);
            notiMessage("Cheat Enabled!", 1500);
        }
        box1.textContent = localStorage.getItem(`${gameName}_savedCheats` || 'Off');
    });
}
export function setVolume(number) {
    Module.setVolume(number);
}