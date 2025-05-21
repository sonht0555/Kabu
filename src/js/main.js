import stable from "../core/4.0.8/mgba.js";
import latest from "../core/4.0.9/mgba.js";
import * as gamepPad from './gamepad.js';
import {localStorageFile} from "./storage.js";
import {dpUploadFile} from "./cloud.js";
import {shaderData} from "./setting.js"
import {wrapContent} from "./state.js"
/*/ ----------------- Switch Ver ------------- */
const versions = {
    "Stable": stable,  
    "Latest": latest, 
};
let currentVersion = localStorage.getItem("GBAver") || "Stable";
let Mode = versions[currentVersion]; 
document.getElementById("GBAver").textContent = `Wasm_${currentVersion}`;
document.getElementById("GBAver").addEventListener("click", () => {
    const versionKeys = Object.keys(versions);
    let index = versionKeys.indexOf(currentVersion);
    currentVersion = versionKeys[(index + 1) % versionKeys.length];
    localStorage.setItem("GBAver", currentVersion);
    document.getElementById("GBAver").textContent = `Wasm_©${currentVersion}`;
    setTimeout(() => { window.location.reload(); }, 1000);
});
/*/ --------------- Initialization ----------- */
let Module = null;
function initializeCore(coreInitFunction) {
    const coreInstance = { canvas: document.getElementById("canvas") };
    return coreInitFunction(coreInstance).then((core) => {
        core.FSInit();
        Module = core;
    });
}    
initializeCore(Mode);
/* --------------- Declaration --------------- */
let countAutoSave = 0;
let countUpload = 0;
const canvas = document.getElementById("canvas");
const loadingIcon = document.getElementById("loading-icon");
let canSave = true;
let canSync = true;
let visible = true;
/* --------------- Function ------------------ */
// System Tray
function handleVisibilityChange(event) {
    if (document.visibilityState === 'hidden' || event?.type === 'beforeunload' || event?.persisted) {
        FSSync();
        canvas.classList.add("visible");
        pauseGame();
    } else {
        if (!visible) return;
        visible = false;
        try {
            setTimeout(() => {
                canvas.classList.remove("visible");
            }, 300);
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setTimeout(() => {
                visible = true;
            }, 400);
        }
        resumeGame();
    }
}
// Status In-game
async function statusShow() {
    document.addEventListener('pagehide', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleVisibilityChange);
    setupStyle();
    setTimeout(() => {
        canvas.classList.remove("visible");
        restoreArea();
    }, 300);
    notiMessage(`Wasm_©${currentVersion}`, 2000);
    shaderData();
    startTimer();
    await gamepPad.turboF(parseInt(await getData(gameName, "1", "turboState")));
    await delay(200);
    await Module.SDL2();
    await delay(800);
    await led(parseInt(await getData(gameName, "1", "slotStateSaved")));
    await wrapContent();
}
// Auto Save Every 1m
async function saveStatePeriodically() {
    await ledSave("#20A5A6");
    await Module.saveState(1);
    await screenShot(1);
    await FSSync();
    console.log(`Auto save ${++countAutoSave} time(s)`);
}
// Auto Save In Cloud Every 1h
async function saveStateInCloud() {
    const stateName = gameName.replace(/\.(zip|gb|gbc|gba)$/, ".ss1")
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
        FSSync();
    });
}
export async function loadGame(romName) {
    const stateName = romName.replace(/\.(gba|gbc|gb|zip)$/, ".ss1");
    const statesList = await listFiles("states");
    intro.classList.add("disable");
    errorLogElements[0].style.bottom = "0";
    ingame.classList.remove("disable");
    // check save state in local
    if (statesList.includes(stateName)) {
        await Module.loadGame(`/data/games/${romName}`);
        if (confirm("Do you want to load save state?")) {
            await delay(100);
            await Module.loadState(1);
        }
    } else {
        await Module.loadGame(`/data/games/${romName}`);
    }
    // show status ingame
        if (romName.endsWith(".gbc") || romName.endsWith(".gb")) {
            document.querySelectorAll(".stateImg").forEach(function(element) {
                element.classList.add("gbcs")
                console.log("element.style.aspectRatio");
            });
        } else if (romName.endsWith(".gba") || romName.endsWith(".zip")) {
            document.getElementById("state-container").style.paddingRight = `54px`;
            document.getElementById("state-container").style.gap = `2px`;
            document.querySelectorAll(".stateInfo").forEach(function(element) {
                element.style.padding = `4px 5px 2px 5px`;
            });
        }
    await statusShow();
}
export async function saveState(slot) {
    if (!canSave) return;
    canSave = false;
    try {
        await Module.saveState(slot);
        await loadding();
    } catch (error) {
        console.error('Sync error:', error);
    } finally {
        setTimeout(() => {
            canSave = true;
        }, 2000);
    }
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
        await FSSync();
    });
}
export async function uploadFile(filepath) {
    const file = filepath.files[0];
    Module.uploadAll(file, async () => {
        localStorageFile();
        await FSSync();
    });
}
export async function resumeGame() {
    await Module.resumeGame();
        if (Mode === "mGBA_1") {
        await Module.resumeAudio();
    }
    Module.SDL2();
    notiMessage("[_] Resumed!", 2000);
}
export async function pauseGame() {
    await Module.pauseGame();
        if (Mode === "mGBA_1") {
        await Module.pauseAudio();
    }
    notiMessage("[_] Paused!", 2000);
}
export async function loadding() {
    await Module.pauseGame();
    if (Mode === "mGBA_1") {
        await Module.pauseAudio();
    }
    loadingIcon.classList.remove("visible");
    await delay(1000);
    loadingIcon.classList.add("visible");
    await delay(200);
    await Module.resumeGame();
    if (Mode === "mGBA_1") {
        await Module.resumeAudio();
    }
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
    await Module.deleteFile(`/data/screenshots/${name}`);
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
    const slotState = parseInt(await getData(gameName, "1", "slotStateSaved"));
    const ledId = slotState === 2 ? "led02" : slotState === 3 ? "led03" : "led01";
    try {
        for (let i = 1; i <= 3; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(245, 232, 209, 0.14)";
        }
        await delay(1000);
        for (let i = 1; i <= 3; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(245, 232, 209, 0.14)";
        }
        document.getElementById(ledId).style.fill = color;
    } catch (error) {
        console.error("Error ledSave:", error);
    }
};
export async function notiMessage(messageContent, second, showCanvas = false) {
    var message = document.getElementById("noti-mess");
    document.getElementById("inputText").textContent = ""
    const slotState = parseInt(await getData(gameName, "1", "slotStateSaved")) || 0;
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
    if (!canSync) return;
    canSync = false;
    try {
        await Module.FSSync();
    } catch (error) {
        console.error('Sync error:', error);
    } finally {
        setTimeout(() => {
            canSync = true;
        }, 3000);
    }
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
export async function quickReload() {
    Module.quickReload();
}
export const rewind = (type) => Module.toggleRewind?.(type) || null;
export function setCoreSettings(type, number) {
    if (typeof Module.setCoreSettings === "function") {
        Module.setCoreSettings(type, number);
    } else {
        return null;
    }
}