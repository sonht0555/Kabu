// --- import ---
import { statusShow,delay } from "./kabu.js";
import { localStorageFile } from "./storage.js";
// --- initialization ---
let Module = null;
window.addEventListener("gbaInitialized", (event) => {
    Module = event.detail.Module;
});
const romlist = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
//Rom List
export async function romList() {
    try {
        const listRoms = Module.listRoms().filter(
            (file) => file !== "." && file !== "..");
        for (const gameName of listRoms) {
            const div = document.createElement("div");
            div.className = "flex-1";
            romlist.insertBefore(div, romlist.firstChild);
            div.textContent = gameName;
            div.onclick = () => {
                loadGame(gameName);
                localStorage.setItem("gameName", gameName);
            };
        }
    } catch (error) {
        console.error("Error starting romList:", error);
    }
}
//Input ROM
async function inputGame(InputFile) {
    try {
        const gameName = InputFile.files[0].name;
        await uploadRom(romInput);
        await loadGame(gameName);
        localStorage.setItem("gameName", gameName);
    } catch (error) {
        console.error("Error InputGame:", error);
    }
}
//Load Game
async function loadGame(gameName) {
    try {
        localStorage.setItem("gameName", gameName);
        const stateName = gameName.replace(/\.(gba|gbc|gb)$/, ".ss0");
        const statesList = Module.listStates();
        intro.classList.add("disable");
        ingame.classList.remove("disable");
        if (gameName.endsWith(".gbc") || gameName.endsWith(".gb")) {
            canvas.classList.add("gbc");
        }
        await delay(100);
        if (statesList.includes(stateName)) {
            await Module.loadGame(`/data/games/${gameName}`);
                if (confirm("Do you want to load save state?")) {
                    await Module.loadState(0);
                }
        } else {
            await Module.loadGame(`/data/games/${gameName}`);
        }
        await statusShow();
    } catch (error) {
        console.error("Error loadGame:", error);
    }
}
//Save Rom in LocalStorage
export async function uploadRom(romFile) {
    try {
        const file = romFile.files[0];
        await Module.uploadRom(file, () => {
            console.log("ROM uploaded successfully:", file.name);
            localStorageFile();
            Module.FSSync();
        });
    } catch (error) {
        console.error("Error uploadRom:", error);
    }   
}
document.addEventListener("DOMContentLoaded", function() {
    romInput.addEventListener("change", function() {
        inputGame(romInput);
    })
});