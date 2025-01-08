import * as Main from './main.js';
/* --------------- Declaration --------------- */
let selectedIndex = 0;
const imgShader = document.getElementById('img-shader') || "Sega";
const brightnessX = localStorage.getItem("brightness") || 1.0;
const contrastX = localStorage.getItem("contrast") || 1.0;
const saturateX = localStorage.getItem("saturate") || 1.0;
const hueRotateX = localStorage.getItem("hueRotate") || 0.0;
const sepiaX = localStorage.getItem("sepia") || 0.0;
const boxes = document.querySelectorAll('.box');
const sdValues = ['Sega', 'Crt', 'Gt-1', 'Gt-2', 'Gt-3', 'Gt-4', 'Line'];
const menuPad = document.getElementById("menu-pad");
const controlSetting = document.getElementById("control-setting");
const SDL2ID = ['A', 'B', 'R', 'L', 'Up', 'Down', 'Left', 'Right'];
/* --------------- Function ------------------ */
// Right
async function Right(boxId, limit, increment, property, localStorageKey) {
    let box = document.getElementById(boxId);
    let currentValue = parseFloat(box.textContent);
    currentValue = Math.min(limit, currentValue + increment);
    box.textContent = currentValue.toFixed(1);
    if (property === 'opacity') {
        imgShader.style.setProperty('--before-opacity', box.textContent);
        localStorage.setItem(localStorageKey, box.textContent);
    } else {
        localStorage.setItem(localStorageKey, box.textContent);
        await delay(100);
        const brightnessX = localStorage.getItem("brightness") || 1;
        const contrastX = localStorage.getItem("contrast") || 1;
        const saturateX = localStorage.getItem("saturate") || 1;
        const sepiaX = localStorage.getItem("sepia") || 0;
        canvas.style.filter = `brightness(${brightnessX}) contrast(${contrastX}) saturate(${saturateX}) hue-rotate(${hueRotateX}deg) sepia(${sepiaX})`;
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
        localStorage.setItem(localStorageKey, box.textContent);
    } else {
        localStorage.setItem(localStorageKey, box.textContent);
        await delay(100);
        const brightnessX = localStorage.getItem("brightness") || 1;
        const contrastX = localStorage.getItem("contrast") || 1;
        const saturateX = localStorage.getItem("saturate") || 1;
        const sepiaX = localStorage.getItem("sepia") || 0;
        canvas.style.filter = `brightness(${brightnessX}) contrast(${contrastX}) saturate(${saturateX}) hue-rotate(${hueRotateX}deg) sepia(${sepiaX})`;
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
    // Box1
    const gameName = localStorage.getItem("gameName") || "xxxx xx";
    let cheats = JSON.parse(localStorage.getItem(`${gameName}_Cheats`)) || [];
    const lastCheatCode = cheats.length > 0 ? cheats[cheats.length - 1].code : 'xxxx xx';
    box1.textContent = lastCheatCode;
    // Box2
    if (localStorage.getItem("autoStateCheck") === "On") {
        box2.textContent = 'On'
    } else {
        box2.textContent = 'Off'
        const autoStateCheck = 'Off'
        localStorage.setItem("autoStateCheck", autoStateCheck)
    }
    // Box3
    box3.textContent = localStorage.getItem("selectedShader") || "Sega";
    // Box4
    box4.textContent = localStorage.getItem("opacity") || 1.0;
    // Box5 
    box5.textContent = localStorage.getItem("brightness") || 1.0;
    // Box6
    box6.textContent = localStorage.getItem("contrast") || 1.0;
    // Box7
    box7.textContent = localStorage.getItem("saturate") || 1.0;
    // Box8
    box8.textContent = localStorage.getItem("sepia") || 0.0;
    // Box3-8 Content
    imgShader.classList.add(localStorage.getItem("selectedShader"))
    canvas.style.filter = `brightness(${brightnessX}) contrast(${contrastX}) saturate(${saturateX}) hue-rotate(${hueRotateX}deg) sepia(${sepiaX})`;
    // inputContainer.style.filter = `brightness(${brightnessX}) contrast(${contrastX}) saturate(${saturateX}) hue-rotate(${hueRotateX}deg) sepia(${sepiaX})`;
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
        document.getElementById('A').addEventListener(eventType, () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box0').classList.contains('selected')) {
                    setTimeout(() => {
                        if (navigator.onLine) {
                            window.location.reload(true);
                        } else {
                            window.location.href = window.location.href;
                        }
                    }, 50);
                    navigator.serviceWorker.controller.postMessage({
                        type: 'DELETE_CACHE'
                    });
                }
                if (document.getElementById('box1').classList.contains('selected')) {
                    let box1 = document.getElementById('box1');
                    const gameName = localStorage.getItem("gameName");
                    const cheatName = gameName.replace(".gba", ".cheats");
                    let cheats = JSON.parse(localStorage.getItem(`${gameName}_Cheats`)) || [];
                    const lastCheatCode = cheats.length > 0 ? cheats[cheats.length - 1].code : 'xxxx xx';
                    const newCheatCode = window.prompt("Edit cheat code", lastCheatCode);
                    if (newCheatCode === null || newCheatCode.trim() === "") {
                        alert("Invalid cheat code!");
                        return;
                    }
                    cheats = cheats.map(cheat => ({ enable: false, code: cheat.code }));
                    const newCheat = { enable: true, code: newCheatCode.trim() };
                    cheats.push(newCheat);
                    localStorage.setItem(`${gameName}_Cheats`, JSON.stringify(cheats));
                    const display = 
                        `cheats = ${cheats.length}\n` +
                        cheats
                            .map((cheat, index) => 
                                `cheat${index}_enable = ${cheat.enable}\ncheat${index}_code = "${cheat.code}"`
                            )
                            .join("\n");
                    const blob = new Blob([display], { type: "text/plain" });
                    const file = new File([blob], cheatName);
                    Main.uploadCheats(file, gameName, newCheatCode.trim(), true, box1);
                    console.log(display);
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
        document.getElementById('Right').addEventListener(eventType, () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box2').classList.contains('selected')) {
                    let box2 = document.getElementById('box2');
                    box2.textContent = box2.textContent === 'On' ? 'Off' : 'On';
                    if (box2.textContent === 'On') {
                        const autoStateCheck = "On"
                        localStorage.setItem("autoStateCheck", autoStateCheck)
                        notiMessage("Auto Switches Slots", 1500);
                    } else {
                        const autoStateCheck = "Off"
                        localStorage.setItem("autoStateCheck", autoStateCheck)
                        notiMessage("Manual Switches Slots", 1500);
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
                    console.log(box3.textContent);
                    sdValues.forEach(shaderClass => imgShader.classList.remove(shaderClass));
                    currentShaderClass = box3.textContent;
                    imgShader.classList.add(currentShaderClass);
                    localStorage.setItem("selectedShader", currentShaderClass);
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
        document.getElementById('Left').addEventListener(eventType, () => {
            if (menuPad.classList.contains("active")) {
                if (document.getElementById('box2').classList.contains('selected')) {
                    let box2 = document.getElementById('box2');
                    box2.textContent = box2.textContent === 'On' ? 'Off' : 'On';
                    if (box2.textContent === 'On') {
                        const autoStateCheck = "On"
                        localStorage.setItem("autoStateCheck", autoStateCheck)
                        notiMessage("Auto Switches Slots", 1500);
                    } else {
                        const autoStateCheck = "Off"
                        localStorage.setItem("autoStateCheck", autoStateCheck)
                        notiMessage("Manual Switches Slots", 1500);
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
                    localStorage.setItem("selectedShader", currentShaderClass);
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
                Main.resumeGame();
                notiMessage("Resumed!", 2000);
            } else {
                Main.pauseGame();
                notiMessage("Paused!", 2000);
            }
        })
    });
})
