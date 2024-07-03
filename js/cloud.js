import { getModule } from "./initialize.js";
let Module = null;
window.addEventListener("gbaInitialized", (event) => {
    Module = event.detail.Module;
});

export async function taskA() {
    if (Module) {
        Module.pauseGame();
    } else {
        console.error("Module chưa sẵn sàng.");
    }
}