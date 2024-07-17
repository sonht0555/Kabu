// --------------- import ---------------
import mGBA from "./emulator/mgba.js";
import {localStorageFile} from "./storage.js";
import {romList} from "./welcome.js";
// --------------- declaration ---------------
const Module = {canvas: document.getElementById("canvas")};
// --------------- initialization ---------------
export async function startGBA(Module) {
    try {
        Module = await mGBA(Module);
        const mGBAVersion = Module.version.projectName + " " + Module.version.projectVersion;
        console.log("Version: ", mGBAVersion);
        Module.FSInit();
        const event = new CustomEvent("gbaInitialized", { detail: { Module } });
        window.dispatchEvent(event);
    } catch (error) {
        console.error("Error starting GBA:", error);
    }
}
startGBA(Module);
export async function getModule() {
    return Module;
}
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        romList();
    },2000);
    setTimeout(() => {
        localStorageFile();
    },3000);
});