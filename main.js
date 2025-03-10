import mGBA_v2 from "./mgba.js";
/*/ --------------- Initialization ----------- */
const Module = {canvas: document.getElementById("canvas")};
function initializeCore(coreInitFunction, module) {
    coreInitFunction(module).then(function(module) {
        module.FSInit();
    });
}

initializeCore(mGBA_v2, Module);
setTimeout(() => {
Module.loadGame(`/data/games/Goodboy Galaxy.zip`);
}, 1000);

setTimeout(() => {
    console.log(Module);
    console.log(Object.keys(Module));
    console.log(Module._GBIORegisterNames);
    console.log(Module._GBA_LUX_LEVELS);
}, 3000);