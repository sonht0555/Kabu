import * as Main from './main.js';
/* --------------- Declaration --------------- */
let clickState = 0;
let clickTimeout;
let clickTurbo = 0
let turboState = 1;
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
        notiMessage("1x Speed", 1500);
        turbo.classList.remove("turbo-medium");
        turbo.classList.remove("turbo-fast");
        Main.setFastForwardMultiplier(1);
    } else if (turboState === 2) {
        notiMessage("2x Speed", 1500);
        turbo.classList.add("turbo-medium");
        turbo.classList.remove("turbo-fast");
        Main.setFastForwardMultiplier(2);
    } else if (turboState === 3) {
        notiMessage("4x Speed", 1500);
        turbo.classList.remove("turbo-medium");
        turbo.classList.add("turbo-fast");
        Main.setFastForwardMultiplier(4);
    }
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    ["A", "B", "Start", "Select", "L", "R", "Up", "Down", "Left", "Right", "Up-left", "Up-right", "Down-left", "Down-right"].forEach((buttonId) => {
        const element = document.getElementById(buttonId);
        let currentButton = null;
        ["mousedown", "touchstart"].forEach((startEventName) => {
            element.addEventListener(startEventName, () => {
                currentButton = element;
                buttonPress(buttonId, true);
                element.classList.add('touched');
            });
        });
        ["mouseup", "touchend", "touchcancel"].forEach((endEventName) => {
            element.addEventListener(endEventName, () => {
                if (currentButton) {
                    buttonPress(buttonId, false);
                    currentButton = null;
                    element.classList.remove('touched');
                }
            });
        });
        element.addEventListener("touchmove", (event) => {
            const touch = event.touches[0];
            const newButton = document.elementFromPoint(touch.clientX, touch.clientY);
            if (newButton !== currentButton && event.touches.length === 1) {
                if (currentButton) {
                    const touchendEvent = new Event("touchend");
                    currentButton.dispatchEvent(touchendEvent);
                }
                if (newButton) {
                    const touchstartEvent = new Event("touchstart");
                    newButton.dispatchEvent(touchstartEvent);
                }
                currentButton = newButton;
            }
        });
        document.addEventListener("touchend", (event) => {
            if (event.touches.length === 0) {
                if (currentButton) {
                    const touchendEvent = new Event("touchend");
                    currentButton.dispatchEvent(touchendEvent);
                    currentButton = null;
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
    })
});
["mouseup", "touchend", "touchcancel"].forEach(eventType => {
    // Save State Button
    saveStateButton.addEventListener(eventType, () => {
        clickState++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            if (clickState === 2) {
                const autoStateCheck = localStorage.getItem("autoStateCheck") || localStorage.setItem("autoStateCheck", "On");
                if (autoStateCheck === "On") {
                    const slotStateNumbers = parseInt((localStorage.getItem("slotStateSaved") % 7) + 1) || 1;
                    saveState(slotStateNumbers);
                    localStorage.setItem("slotStateSaved", slotStateNumbers);
                    ledSave("#DD5639");
                    notiMessage(`[${slotStateNumbers}] Saved State`, 2000);
                    console.log(localStorage.getItem("autoStateCheck"));
                } else {
                    const slotStateNumbers = parseInt(localStorage.getItem("slotStateSaved")) || 1;
                    console.log(localStorage.getItem("autoStateCheck"));
                    saveState(slotStateNumbers);
                    localStorage.setItem("slotStateSaved", slotStateNumbers);
                    ledSave("#DD5639");
                    notiMessage(`[${slotStateNumbers}] Saved State`, 2000);
                }
            }
            clickState = 0;
        }, 300);
    });
    // Load State Button
    loadStateButton.addEventListener(eventType, () => {
        clickState++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            if (clickState === 2) {
                const slotStateNumbers = localStorage.getItem("slotStateSaved") || 1;
                loadState(slotStateNumbers);
                notiMessage(`[${slotStateNumbers}] Loaded State`, 1500);
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
    turboButton.addEventListener(eventType, () => {
        clickTurbo++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            if (clickTurbo === 2) {
                turboState = (turboState % 3) + 1;
                turboF(turboState);
                localStorage.setItem("turboState", turboState);
            }
            clickTurbo = 0;
        }, 300);
    });
})