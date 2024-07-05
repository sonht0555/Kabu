import mGBA from "./emulator/mgba.js";
let Module = null;
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
export function getModule() {
    return Module;
}