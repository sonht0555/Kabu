import * as Main from './main.js';
/* --------------- Declaration --------------- */
let selectedIndex = 0;
let cheatX, stateAutoX, shaderX, opacityX, brightnessX, contrastX, saturateX, sepiaX ;
const boxes = document.querySelectorAll('.box');
const sdValues = ['Sega', 'Crt', 'Gt-1', 'Gt-2', 'Gt-3', 'Gt-4', 'Gt-5', 'Gt-6', 'Gt-7', 'Gt-8', 'Gt-9', 'Gt-10', 'Line'];
const menuPad = document.getElementById("menu-pad");
const controlSetting = document.getElementById("control-setting");
const SDL2ID = ['A', 'B', 'R', 'L', 'Up', 'Down', 'Left', 'Right'];
const imgShader = document.getElementById('img-shader') || "Sega";
export async function shaderData() {
    cheatX = await Main.getData(gameName, "0", "cheatCode") || "xx xxx";
    box1.textContent = cheatX;
    stateAutoX = await Main.getData(gameName, "0", "stateAuto") || "On";
    box2.textContent = stateAutoX;
    shaderX = await Main.getData(gameName, "0", "shader") || "Sega"
    box3.textContent = shaderX;
    opacityX = await Main.getData(gameName, "0", "opacity") || 1.0;
    box4.textContent = opacityX;
    brightnessX = await Main.getData(gameName, "0", "brightness") || 1.0;
    box5.textContent = brightnessX;
    contrastX = await Main.getData(gameName, "0", "contrast") || 1.0;
    box6.textContent = contrastX;
    saturateX = await Main.getData(gameName, "0", "saturate") || 1.0;
    box7.textContent = saturateX;
    sepiaX = await Main.getData(gameName, "0", "sepia") || 0.0;
    box8.textContent = sepiaX;
    imgShader.classList.add(shaderX);
    imgShader.style.setProperty('--before-opacity', opacityX);
    canvas.style.filter = `brightness(${brightnessX}) contrast(${contrastX}) saturate(${saturateX}) sepia(${sepiaX})`;
    console.log({gameName, cheatX, stateAutoX, shaderX, opacityX, brightnessX, contrastX, saturateX, sepiaX});
}
/* --------------- Function ------------------ */
// Right
async function Right(boxId, limit, increment, property, localStorageKey) {
    let box = document.getElementById(boxId);
    let currentValue = parseFloat(box.textContent);
    currentValue = Math.min(limit, currentValue + increment);
    box.textContent = currentValue.toFixed(1);
    if (property === 'opacity') {
        imgShader.style.setProperty('--before-opacity', box.textContent);
        await Main.setData(gameName, "0",localStorageKey ,box.textContent);
        await delay(100);
        await shaderData();
    } else {
        await Main.setData(gameName, "0",localStorageKey ,box.textContent);
        await delay(100);
        await shaderData();
    }
}
// Left
async function Left(boxId, limit, decrement, property, localStorageKey) {
    let box = document.getElementById(boxId);
    let currentValue = parseFloat(box.textContent);
    currentValue = Math.max(limit, currentValue - decrement);
    box.textContent = currentValue.toFixed(1);
    if (property === 'opacity') {
        imgShader.style.setProperty('--before-opacity', box.textContent);
        await Main.setData(gameName, "0",localStorageKey ,box.textContent);
        await delay(100);
        await shaderData();
    } else {
        await Main.setData(gameName, "0",localStorageKey ,box.textContent);
        await delay(100);
        await shaderData();
    }
}
// SDL2ID
SDL2ID.forEach(function(id) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener("touchstart", function() {
            if (!areaTrans.classList.contains("visible")) {
                areaTrans.classList.toggle("visible");
            }
        });
    }
})
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    let currentShaderClass = sdValues[0];
    const updateSelection = () => {
        boxes.forEach((box, index) => {
            if (index === selectedIndex) {
                box.classList.add('selected');
            } else {
                box.classList.remove('selected');
            }
        });
    };
    updateSelection();
    ["mouseup", "touchend", "touchcancel"].forEach(eventType => {
        document.getElementById('A').addEventListener(eventType, async () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box0').classList.contains('selected')) {
                    setTimeout(() => {
                        if (navigator.onLine) {
                            window.location.reload(true);
                        } else {
                            window.location.href = window.location.href;
                        }
                    }, 50);
                    // navigator.serviceWorker.controller.postMessage({
                    //     type: 'DELETE_CACHE'
                    // });
                }              
                if (document.getElementById('box1').classList.contains('selected')) {
                    let box1 = document.getElementById('box1');
                    const cheatName = gameName.replace(/\.(gba|gbc|gb|zip)$/, ".cheats");
                    let data = await Main.downloadFileInCloud(`/data/cheats/${cheatName}`) ?? new TextEncoder().encode("");
                    let textData = new TextDecoder().decode(data);
                    let cheatX = textData.match(/cheat\d+_code = "(.*?)"/g)?.map(c => ({ enable: false, code: c.split('"')[1] })) || [];
                    const lastCheatCode = cheatX.length > 0 ? cheatX.at(-1).code : 'Off';
                    let newCheatCode = window.prompt("Edit cheat code", lastCheatCode) || "Off";
                    cheatX = cheatX.map(cheat => ({ enable: false, code: cheat.code }));
                    cheatX.push({ enable: true, code: newCheatCode.trim() });
                    const display = `cheats = ${cheatX.length}\n` + 
                        cheatX.map((cheat, i) => `cheat${i}_enable = ${cheat.enable}\ncheat${i}_code = "${cheat.code}"`).join("\n");
                    const blob = new Blob([display], { type: "text/plain" });
                    const file = new File([blob], cheatName);
                    Main.uploadCheats(file, gameName);
                    await Main.setData(gameName, "0", "cheatCode", newCheatCode.trim());
                    await delay(200)
                    await shaderData();
                    console.log( display);
                }              
            }
        });
        document.getElementById('Up').addEventListener(eventType, () => {
            if (menuPad.classList.contains("active")) {
                if (selectedIndex > 0) {
                    selectedIndex--;
                    updateSelection();
                }
            }
        });
        document.getElementById('Down').addEventListener(eventType, () => {
            if (menuPad.classList.contains("active")) {
                if (selectedIndex < boxes.length - 1) {
                    selectedIndex++;
                    updateSelection();
                }
            }
        });
        document.getElementById('Right').addEventListener(eventType, async () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box2').classList.contains('selected')) {
                    let box2 = document.getElementById('box2');
                    box2.textContent = box2.textContent === 'On' ? 'Off' : 'On';
                    if (box2.textContent === 'On') {
                        const autoStateCheck = "On"
                        await Main.setData(gameName, "0","stateAuto" ,autoStateCheck);
                        document.getElementById("box2").textContent = autoStateCheck;
                        Main.notiMessage("Auto Switches Slots", 1500);
                    } else {
                        const autoStateCheck = "Off"
                        await Main.setData(gameName, "0","stateAuto" ,autoStateCheck);
                        document.getElementById("box2").textContent = autoStateCheck;
                        Main.notiMessage("Manual Switches Slots", 1500);
                    }
                }
                if (document.getElementById('box3').classList.contains('selected')) {
                    let box3 = document.getElementById('box3');
                    let currentIndex = sdValues.indexOf(box3.textContent);
                    if (currentIndex < sdValues.length - 1) {
                        box3.textContent = sdValues[currentIndex + 1];
                    } else {
                        box3.textContent = sdValues[0];
                    }
                    sdValues.forEach(shaderClass => imgShader.classList.remove(shaderClass));
                    currentShaderClass = box3.textContent;
                    imgShader.classList.add(currentShaderClass);
                    await Main.setData(gameName, "0","shader" ,currentShaderClass);
                    await shaderData();
                }
                if (document.getElementById('box4').classList.contains('selected')) {
                    Right('box4', 1, 0.1, 'opacity', 'opacity');
                }
                if (document.getElementById('box5').classList.contains('selected')) {
                    Right('box5', 2, 0.1, 'brightness', 'brightness');
                }
                if (document.getElementById('box6').classList.contains('selected')) {
                    Right('box6', 2, 0.1, 'contrast', 'contrast');
                }
                if (document.getElementById('box7').classList.contains('selected')) {
                    Right('box7', 4, 0.1, 'saturate', 'saturate');
                }
                if (document.getElementById('box8').classList.contains('selected')) {
                    Right('box8', 1, 0.1, 'sepia', 'sepia');
                }
            }
        });
        document.getElementById('Left').addEventListener(eventType, async () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box2').classList.contains('selected')) {
                    let box2 = document.getElementById('box2');
                    box2.textContent = box2.textContent === 'On' ? 'Off' : 'On';
                    if (box2.textContent === 'On') {
                        const autoStateCheck = "On"
                        await Main.setData(gameName, "0","stateAuto" ,autoStateCheck);
                        document.getElementById("box2").textContent = autoStateCheck;
                        Main.notiMessage("Auto Switches Slots", 1500);
                    } else {
                        const autoStateCheck = "Off"
                        await Main.setData(gameName, "0","stateAuto" ,autoStateCheck);
                        document.getElementById("box2").textContent = autoStateCheck;
                        Main.notiMessage("Manual Switches Slots", 1500);
                    }
                }
                if (document.getElementById('box3').classList.contains('selected')) {
                    let box3 = document.getElementById('box3');
                    let currentIndex = sdValues.indexOf(box3.textContent);
                    if (currentIndex > 0) {
                        box3.textContent = sdValues[currentIndex - 1];
                    } else {
                        box3.textContent = sdValues[sdValues.length - 1];
                    }
                    sdValues.forEach(shaderClass => imgShader.classList.remove(shaderClass));
                    currentShaderClass = box3.textContent;
                    imgShader.classList.add(currentShaderClass);
                    await Main.setData(gameName, "0","shader" ,currentShaderClass);
                    await shaderData();
                }
                if (document.getElementById('box4').classList.contains('selected')) {
                    Left('box4', 0, 0.1, 'opacity', 'opacity');
                }
                if (document.getElementById('box5').classList.contains('selected')) {
                    Left('box5', 0, 0.1, 'brightness', 'brightness');
                }
                if (document.getElementById('box6').classList.contains('selected')) {
                    Left('box6', 0, 0.1, 'contrast', 'contrast');
                }
                if (document.getElementById('box7').classList.contains('selected')) {
                    Left('box7', 0, 0.1, 'saturate', 'saturate');
                }
                if (document.getElementById('box8').classList.contains('selected')) {
                    Left('box8', 0, 0.1, 'sepia', 'sepia');
                }
            }
        });
        menuPad.addEventListener(eventType, () => {
            menuPad.classList.toggle("active");
            controlSetting.classList.toggle("visible");
            if (controlSetting.classList.contains("visible")) {
                statePageButton.style.removeProperty("pointer-events");
                Main.resumeGame();
            } else {
                statePageButton.style.setProperty("pointer-events", "none", "important");
                Main.pauseGame();
            }
        })
    });
})
