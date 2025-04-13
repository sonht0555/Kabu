import * as Main from './main.js';
/* --------------- Declaration --------------- */
let clickState = 0;
let clickTimeout;
let clickTurbo = 0
let turboState = 1;
let volumeLevels = [1, 0, 0.25, 0.5, 0.75];
let volumeIndex = 0;
const turboButton = document.getElementById("turbo");
/* --------------- Function --------------- */
function buttonPress(buttonName, isPress) {
    if (buttonName.includes("-")) {
        const [primaryButton, secondaryButton] = buttonName.toLowerCase().split("-");
        isPress ? Main.buttonPress(primaryButton) : Main.buttonUnpress(primaryButton);
        isPress ? Main.buttonPress(secondaryButton) : Main.buttonUnpress(secondaryButton);
    } else {
        isPress ? Main.buttonPress(buttonName.toLowerCase()) : Main.buttonUnpress(buttonName.toLowerCase());
    }
}
// Save State
async function saveState(slot) {
    await Main.saveState(slot);
    await Main.screenShot(slot);
}
// Load State
async function loadState(slot) {
    await Main.loadState(slot);
}
// Turbo
export async function turboF(turboState) {
    if (turboState === 1) {
        Main.notiMessage("[_] 1x Speed", 1500);
        turboButton.classList.remove("turbo-medium");
        turboButton.classList.remove("turbo-fast");
        Main.setFastForwardMultiplier(1);
    } else if (turboState === 2) {
        Main.notiMessage("[_] 2x Speed", 1500);
        turboButton.classList.add("turbo-medium");
        turboButton.classList.remove("turbo-fast");
        Main.setFastForwardMultiplier(2);
    } else if (turboState === 3) {
        Main.notiMessage("[_] 4x Speed", 1500);
        turboButton.classList.remove("turbo-medium");
        turboButton.classList.add("turbo-fast");
        Main.setFastForwardMultiplier(4);
    }
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    const dpadButtons = ["Up", "Down", "Left", "Right", "Up-left", "Up-right", "Down-left", "Down-right"];
    const otherButtons = ["A", "B", "Start", "Select", "L", "R"];
    let activeDpadTouches = new Map();
    let activeOtherTouches = new Map();

    function handleButtonPress(buttonId, isPressed) {
        if (!buttonId) return;
        buttonPress(buttonId, isPressed);
        const element = document.getElementById(buttonId);
        if (element) {
            if (isPressed) {
                element.classList.add('touched');
            } else {
                element.classList.remove('touched');
            }
        }
    }
    
    function getButtonIdFromTouch(touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const button = element?.closest("[id]");
        return button ? button.id : null;
    }
    
    document.addEventListener("touchstart", (event) => {
        for (let touch of event.changedTouches) {
            const buttonId = getButtonIdFromTouch(touch);
            if (!buttonId) continue;
            if (dpadButtons.includes(buttonId)) {
                if (activeDpadTouches.has(touch.identifier)) {
                    handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                }
                activeDpadTouches.set(touch.identifier, buttonId);
                handleButtonPress(buttonId, true);
            } else if (otherButtons.includes(buttonId)) {
                if (activeOtherTouches.has(touch.identifier)) {
                    handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                }
                activeOtherTouches.set(touch.identifier, buttonId);
                handleButtonPress(buttonId, true);
            }
        }
    });

    document.addEventListener("touchmove", (event) => {
        for (let touch of event.changedTouches) {
            const buttonId = getButtonIdFromTouch(touch);
            if (!buttonId) continue;
            
            if (dpadButtons.includes(buttonId)) {
                if (activeDpadTouches.has(touch.identifier) && activeDpadTouches.get(touch.identifier) !== buttonId) {
                    handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                    activeDpadTouches.set(touch.identifier, buttonId);
                    handleButtonPress(buttonId, true);
                }
            } else if (otherButtons.includes(buttonId)) {
                if (activeOtherTouches.has(touch.identifier) && activeOtherTouches.get(touch.identifier) !== buttonId) {
                    handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                    activeOtherTouches.set(touch.identifier, buttonId);
                    handleButtonPress(buttonId, true);
                }
            }
        }
    });
    
    document.addEventListener("touchend", (event) => {
        for (let touch of event.changedTouches) {
            if (activeDpadTouches.has(touch.identifier)) {
                handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                activeDpadTouches.delete(touch.identifier);
            }
            if (activeOtherTouches.has(touch.identifier)) {
                handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                activeOtherTouches.delete(touch.identifier);
            }
        }
    });
    
    document.addEventListener("touchcancel", (event) => {
        for (let touch of event.changedTouches) {
            if (activeDpadTouches.has(touch.identifier)) {
                handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                activeDpadTouches.delete(touch.identifier);
            }
            if (activeOtherTouches.has(touch.identifier)) {
                handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                activeOtherTouches.delete(touch.identifier);
            }
        }
    });
    
     // Joy Stick
    let currentDirection = '';
    const updateButtonState = (direction, isPressed) => {
        const directions = direction.split('-');
        directions.forEach(dir => {
            if (isPressed) {
                Main.buttonPress(dir);
            } else {
                Main.buttonUnpress(dir);
            }
        });
    };
    dynamic.on('move', (evt, data) => {
        const angle = data.angle.degree;
        let dpadDirection = '';
        if (angle >= 337.5 || angle < 22.5) {
            dpadDirection = 'Right';
        } else if (angle >= 22.5 && angle < 67.5) {
            dpadDirection = 'Up-right';
        } else if (angle >= 67.5 && angle < 112.5) {
            dpadDirection = 'Up';
        } else if (angle >= 112.5 && angle < 157.5) {
            dpadDirection = 'Up-left';
        } else if (angle >= 157.5 && angle < 202.5) {
            dpadDirection = 'Left';
        } else if (angle >= 202.5 && angle < 247.5) {
            dpadDirection = 'Down-left';
        } else if (angle >= 247.5 && angle < 292.5) {
            dpadDirection = 'Down';
        } else if (angle >= 292.5 && angle < 337.5) {
            dpadDirection = 'Down-right';
        }
        if (dpadDirection !== currentDirection) {
            updateButtonState(currentDirection, false);
            updateButtonState(dpadDirection, true);
            currentDirection = dpadDirection;
        }
    });
    dynamic.on('end', () => {
        updateButtonState(currentDirection, false);
        currentDirection = '';
    });
});
let lastSaveTime = 0;
["touchend"].forEach(eventType => {
    // Save State Button
    const er = document.getElementById("R");
    er.addEventListener(eventType, async (event) => {
        let clickX = 0;
        let width = er.offsetWidth;
        if (event.type.startsWith("touch")) {
            const touch = event.touches[0] || event.changedTouches[0];
            const rect = er.getBoundingClientRect();
            clickX = touch.clientX - rect.left;
        } else {
            const rect = er.getBoundingClientRect();
            clickX = event.clientX - rect.left;
        }
        if (clickX > width / 4) return;
        const now = Date.now();
        if (now - lastSaveTime < 1000) return;
        clickState++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(async () => {
            if (clickState === 2) {
                lastSaveTime = Date.now();
                const autoStateCheck = await Main.getData(gameName, "1", "stateAuto") || await Main.setData(gameName, "1", "stateAuto", "On");
                const slotStateNumbers = autoStateCheck === "On"
                    ? (parseInt(await Main.getData(gameName, "1", "slotStateSaved") % 3) + 1) || 1
                    : parseInt(await Main.getData(gameName, "1", "slotStateSaved")) || 1;
                await delay(100);
                await saveState(slotStateNumbers);
                await delay(50);
                await Main.setData(gameName, "1", "slotStateSaved", slotStateNumbers);
                await delay(50);
                canvas.classList.add('glitch-effect');
                setTimeout(() => {
                canvas.classList.remove('glitch-effect');
                }, 500);
                await Main.ledSave("#20A5A6");
                await delay(50);
                await Main.notiMessage(`[${autoStateCheck === "On" ? slotStateNumbers : "?"}] Saved.`, autoStateCheck === "On" ? 2000 : 1000);
                
            } else if (clickState === 3) {
                volumeIndex = (volumeIndex + 1) % volumeLevels.length;
                let newVolume = volumeLevels[volumeIndex];
                Main.setVolume(newVolume);
                Main.notiMessage(`[_] Volume: ${newVolume * 100}%`, 1000);
            }  
            clickState = 0;
        }, 300);
    });
    // Load State Button
    const el = document.getElementById("L");
    el.addEventListener(eventType, async (event) => {
        let clickX = 0;
        let width = el.offsetWidth;
        if (event.type.startsWith("touch")) {
            const touch = event.touches[0] || event.changedTouches[0];
            const rect = el.getBoundingClientRect();
            clickX = touch.clientX - rect.left;
        } else {
            const rect = el.getBoundingClientRect();
            clickX = event.clientX - rect.left;
        }
        if (clickX < (width * 3) / 4) return;
        clickState++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(async () => {
            if (clickState === 2) {
                const slotStateNumbers = await Main.getData(gameName, "1", "slotStateSaved") || 1;
                loadState(slotStateNumbers);
                Main.notiMessage(`[_] Loaded.`, 1000);
                await delay(50);
                await Main.ledSave("#20A5A6");
            } else if (clickState === 3) {
                let setApiAzure = localStorage.getItem("ApiAzure");
                let ApiAzure = prompt("apiKey,endpoint", setApiAzure);
                if (ApiAzure !== null && ApiAzure !== "") {
                    localStorage.setItem("ApiAzure", ApiAzure);                
                }
            }
            clickState = 0;
        }, 300);
    });
    // Turbo Button
    turboButton.addEventListener(eventType, async () => {
        clickTurbo++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(async () => {
            if (clickTurbo === 2) {
                turboState = (turboState % 3) + 1;
                turboF(turboState);
                await Main.setData(gameName, "1", "turboState", turboState)
            }
            clickTurbo = 0;
        }, 300);
    });
    rewind.addEventListener("pointerdown", () => { Main.rewind(true); Main.notiMessage(`Rewind_..`, 20000);});
    rewind.addEventListener("pointerup", () => { Main.rewind(false);  Main.notiMessage(`Resumed!`, 1000);});
})