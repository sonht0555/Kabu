import mGBA from "../core/mgba.js";
import * as gamepPad from './gamepad.js';
import { localStorageFile } from "./storage.js";
import {dpUploadFile,dpRefreshToken} from "./cloud.js";
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
    const img = localStorage.getItem(`${gameName}_imageState0`);
    const date = localStorage.getItem(`${gameName}_dateState0`);
    if (navigator.onLine) {
        if (uId) {
            await ledSave("#E0C068");
            await delay(1000);
            await dpUploadFile(stateName, Module.downloadFile(`/data/states/${stateName}`));
            if (img !== null) {
                const textContent = `${img}\n\n${date}`;
                const blob = new Blob([textContent], {
                    type: "text/plain"
                });
                await dpUploadFile(`${gameName}_slot0.txt`, blob);
            } else {
                console.log("No screenshot!");
            }
            await lockNoti("", `Cloud upload ${++countUpload} time(s)`, 2000)
        } else {
            console.log("Unable to upload to Cloud!");
        }
    } else {
        console.log("Online!");
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
        if (count2 === 3600) {saveStateInCloud(); count2=0};
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
            console.log(gameName);
        }
    } else {
        await Module.loadGame(`/data/games/${gameName}`);
        localStorage.setItem("gameName", gameName);
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
export async function uploadFile(fileName) {
    const file = fileName.files[0];
    Module.uploadSaveOrSaveState(file, () => {
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
export async function findScreenshot(gameName, slot) {
    try {
        let screenshots = await listScreenshot();
        for (const file of screenshots) {
            if (typeof file !== "string") continue;
            const parts = file.split("*").map(part => part.trim());
            if (parts.length >= 3 && parts[0] === gameName.trim() && parseInt(parts[1], 10) === parseInt(slot, 10)) {
                const filePath = `/data/screenshots/${file}`;
                const base64Promise = Module.downloadFile(filePath);
                const base64 = await fileToBase64(base64Promise);
                const time = parts[2].replace(/\.png$/, "");
                return [base64,time];
            }
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}
export async function deleteScreenshot(screenshotName, saveSlot) {
    const screenshots = await listScreenshot();
    for (const file of screenshots) {
        if (typeof file !== "string") continue;
        const parts = file.split("*").map(part => part.trim());
        if (parts.length >= 3 && parts[0] === screenshotName && parseInt(parts[1], 10) === parseInt(saveSlot, 10)) {
            const filePathToDelete = `/data/screenshots/${file}`;
            await Module.deleteFile(filePathToDelete);
            await Module.FSSync();
        }
        }
}
export function fileSize(filePart) {
    const result = Module.fileSize(filePart)
    return result;
}
export async function uploadCheat(cheatFile) {
    try {
       const file = cheatFile.files[0];
       await Module.uploadCheats(file, () => {
            console.log("Cheat uploaded successfully:", file.name);
            localStorageFile()
            Module.FSSync();
        });
    } catch (error) {
        console.error("Error uploadCheat:", error);
    }  
}
export async function uploadSavSta(SavStaFile) {
    try {
        const file = SavStaFile.files[0];
        await Module.uploadSaveOrSaveState(file, () => {
            console.log("Save/State uploaded successfully:", file.name);
            localStorageFile()
            Module.FSSync();
        });
    } catch (error) {
        console.error("Error uploadSavSta:", error);
    }  
}
export async function uploadSaveOrSaveState(file) {
    Module.uploadSaveOrSaveState(file, () => {
        localStorageFile();
        Module.FSSync();
    });
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
    const screenshotName = localStorage.getItem("gameName").replace(/\.(gba|gbc|gb|zip)$/, "");
    const currentTime = Date.now();
    const date = formatDateTime(currentTime);
    const screenshots = await listScreenshot();
    for (const file of screenshots) {
        if (typeof file !== "string") continue;
        const parts = file.split("*").map(part => part.trim());
        if (parts.length >= 3 && parts[0] === screenshotName && parseInt(parts[1], 10) === parseInt(saveSlot, 10)) {
            const filePathToDelete = `/data/screenshots/${file}`;
            await Module.deleteFile(filePathToDelete);
            await Module.FSSync()
        }
    }
    await Module.screenshot(`${screenshotName}*${saveSlot}*${date}.png`);
    await Module.FSSync();
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
    Module.uploadCheats(file, () => {
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