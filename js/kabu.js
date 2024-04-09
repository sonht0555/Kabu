import mGBA from "./mgba.js";
let turboState = 1;
let clickState = 0;
let countAutoSave = 0;
let countUpload = 0;
var timeoutId;
var clientId = 'knh3uz2mx2hp2eu'; // App Key
var clientSecret = 'nwb3dnfh09rhs31'; // App Secret
const dropboxCloud = document.getElementById("dropboxCloud");
const storage = document.getElementById("storage");
const intro = document.getElementById("intro");
const ingame = document.getElementById("in-game");
const upLoadFile = document.getElementById("upLoadFile");
const romlist = document.getElementById("rom-list");
const menuPad = document.getElementById("menu-pad");
const listPad = document.getElementById("menu-list-pad");
const loadStateButton = document.getElementById("loadStateButton");
const saveStateButton = document.getElementById("saveStateButton");
const statePageButton = document.getElementById("statePageButton");
const autoStateCheck = document.getElementById("autoStateCheck");
const romInput = document.getElementById("fileInput");
const turbo = document.getElementById("turbo");
const savedTurboState = localStorage.getItem("turboState");
const SDL2ID = ['A','B','R','L','Up','Down','Left','Right'];
const backToHome = document.getElementById("backToHome");
const openLocalStorage = document.getElementById("openLocalStorage");
const savesFile = document.getElementById("savesFile");
const romsFile = document.getElementById("romsFile");
const statesFile = document.getElementById("statesFile");
const saveCheatsButton = document.getElementById("saveCheat");
const Module = {canvas: document.getElementById("canvas")};
const dropboxRestore = document.getElementById("dropboxRestore");
/*----------------BackEnd----------------*/
startGBA(Module)
//Start GBA
async function startGBA(Module) {
    try {
        const moduleInstance = await mGBA(Module);
        const mGBAVersion = moduleInstance.version.projectName + " " + moduleInstance.version.projectVersion;
        console.log("Version: ", mGBAVersion);
        moduleInstance.FSInit();
    } catch (error) {
        console.error("Error starting GBA:", error);
    }
}
//Status Show
async function statusShow() {
    try {
        if(navigator.onLine){
            await notiMessage("Have internet!", 3000);
            await delay(1000);
            localStorage.setItem("internetStatus", "on");
            console.log("Have internet!")
        } else {
            await notiMessage("No internet!", 3000);
            localStorage.setItem("internetStatus", "off");
        }

    } catch (error) {
        console.error("Error starting statusShow:", error);
    }
}
//Delay ms
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//Led Notification
async function led(slotStateNumbers) {
    try {
        if (slotStateNumbers===1) {
            document.getElementById("led01").style.fill = "#78C850";
            document.getElementById("led02").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led03").style.fill = "rgba(255, 255, 245, 0.2)";
        } else if(slotStateNumbers===2) {
            document.getElementById("led02").style.fill = "#78C850";
            document.getElementById("led03").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led01").style.fill = "rgba(255, 255, 245, 0.2)";
        } else if(slotStateNumbers===3) {
            document.getElementById("led03").style.fill = "#78C850";
            document.getElementById("led02").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led01").style.fill = "rgba(255, 255, 245, 0.2)";
        }else if(slotStateNumbers===0) {
        }
    } catch (error) {
        console.error("Error Led:", error);

    }
}
//Rom List
async function romList() {
    try {
        const listRoms = Module.listRoms().filter(
            (file) => file !== "." && file !== "..");
        for (const gameName of listRoms) {
            const div = document.createElement("div");
            div.className = "flex-1";
            romlist.appendChild(div);
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
        const slotStateSaved = localStorage.getItem("slotStateSaved");
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
                await statusShow();
        } else {
            await Module.loadGame(`/data/games/${gameName}`);
            await statusShow();
        }
        await delay(3000);
        await led(slotStateSaved);
        if (savedTurboState !== null) {
            turboState = parseInt(savedTurboState);
            await turboF(turboState);
        }
        setInterval(() => {saveStatePeriodically()}, 10000);
        setInterval(() => {saveStateInCloud()}, 180000);
    } catch (error) {
        console.error("Error loadGame:", error);
    }
}
//Save State
async function saveState(slot) {
    try {
        await Module.saveState(slot);
        await Module.FSSync();
        await screenShot(slot);
        await led(slot);
    } catch (error) {
        console.error("Error saveState:", error);
    }      
}
//Load State
async function loadState(slot) {
    try {
        await Module.loadState(slot);
    } catch (error) {
        console.error("Error loadState:", error);
    }      
}
//Auto Save Game In Local Every 10s
async function saveStatePeriodically() {
    try {
        const slotState = parseInt(localStorage.getItem("slotStateSaved"));
        const ledId = slotState === 1 ? "led01" : (slotState === 2 ? "led02" : "led03");
        for (let i = 1; i <= 3; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(255, 255, 245, 0.2)";
        }
        await delay(1000); 
        document.getElementById(ledId).style.fill = "#78C850";
        await saveState(0);
        console.log(`Auto save ${++countAutoSave} time(s)`);
    } catch (error) {
        console.error("Error saveStatePeriodically: ", error);
    }   
}
async function saveStateInCloud() {
    try {
        const slotState = parseInt(localStorage.getItem("slotStateSaved"));
        const gameName = localStorage.getItem("gameName");
        const stateName = gameName.replace(".gba", ".ss0");
        const uId = localStorage.getItem("uId");
        const ledId = slotState === 1 ? "led01" : (slotState === 2 ? "led02" : "led03");
        for (let i = 1; i <= 3; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(255, 255, 245, 0.2)";
        }
        await delay(1000); 
        document.getElementById(ledId).style.fill = "#E0C068";
        if (navigator.onLine) {
            if (uId) {
                await delay(1000);
                await dpUploadFile(stateName, Module.downloadFile(`/data/states/${stateName}`));
                notiMessage(`Upload in Cloud [${++countUpload}] time`, 1500)
                console.log(`Auto upload in Cloud ${++countUpload} time(s)`);
            } else {
                console.log("Unable to upload to Cloud!");
            }
        } else {
            console.log("No internet!");
        }        
    } catch (error) {
        console.error("Error saveStateInCloud:", error);
    }   
}
//Save Rom in LocalStorage
async function uploadRom(romFile) {
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
//Save .Sav and .ss0,1,2 in LocalStorage
async function uploadSavSta(SavStaFile) {
    try {
        const file = SavStaFile.files[0];
        await Module.uploadSaveOrSaveState(file, () => {
            console.log("Save/State uploaded successfully:", file.name);
            localStorageFile();
            Module.FSSync();
        });
    } catch (error) {
        console.error("Error uploadSavSta:", error);
    }  
}
//Save Cheat in LocalStorage
async function uploadCheat(cheatFile) {
    try {
       const file = cheatFile.files[0];
       await Module.uploadCheats(file, () => {
            console.log("Cheat uploaded successfully:", file.name);
            localStorageFile();
            Module.FSSync();
        });
    } catch (error) {
        console.error("Error uploadCheat:", error);
    }  
}
//Format Date Time
function formatDateTime(milliseconds) {
    const date = new Date(milliseconds);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${hours}:${minutes} - ${day}.${month}`;
}
//Download File
async function downloadFile(filepath, filename) {
    try {
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
    } catch (error) {
        console.error("Error downloadFile:", error);
    }
}
//Notification Message
async function notiMessage(messageContent, second) {
    var message = document.getElementById("noti-mess");
    if (message.style.opacity === "0.4") {
      clearTimeout(timeoutId);
      message.style.opacity = "0";
    }
    message.textContent = messageContent;
    message.style.opacity = "0.4";
    timeoutId = setTimeout(() => {
      message.textContent = localStorage.getItem("gameName");
      message.style.opacity = "0.2";
    }, second);
}
//Virtual GamePad
function buttonPress(buttonName, isPress) {
    if (buttonName.includes("-")) {
        const [primaryButton, secondaryButton] = buttonName.toLowerCase().split("-");
        isPress ? Module.buttonPress(primaryButton) : Module.buttonUnpress(primaryButton);
        isPress ? Module.buttonPress(secondaryButton) : Module.buttonUnpress(secondaryButton);
    } else {
        isPress ? Module.buttonPress(buttonName.toLowerCase()) : Module.buttonUnpress(buttonName.toLowerCase());
    }
}
//Turbo
async function turboF(turboState) {
    try {
        if (turboState === 1) {
            notiMessage("Normal Speed", 2000);
            turbo.classList.remove("turbo-medium");
            turbo.classList.remove("turbo-fast");
            Module.setMainLoopTiming(0, 16);
        } else if (turboState === 2) {
            notiMessage("Medium Speed", 2000);
            turbo.classList.add("turbo-medium");
            turbo.classList.remove("turbo-fast");
            Module.setMainLoopTiming(0, 8);
        } else if (turboState === 3) {
            notiMessage("Fast Speed", 2000);
            turbo.classList.remove("turbo-medium");
            turbo.classList.add("turbo-fast");
            Module.setMainLoopTiming(0, 1);
        }
    } catch (error) {
        console.error("Error turboF:", error);
    }
}
//File Size
function humanFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1e3 : 1024;
    const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(dp) + ' ' + units[u];
}
//Element Storage
function createElementStorage(parent, fileName, filePart) {
    const Name = document.createElement("div");
    Name.classList.add("flex-1", "rom-item", "rom");
    parent.appendChild(Name);
    const span = document.createElement("span");
    span.textContent = fileName;
    span.classList.add("flex-1");
    Name.appendChild(span);
    span.onclick = () => {
        const dialog = document.createElement("dialog");
        dialog.onclose = () => dialog.remove();
        parent.appendChild(dialog);
        const back = document.createElement("div");
        back.classList.add("storage");
        dialog.appendChild(back);
        const closeButton = document.createElement("div");
        closeButton.classList.add("home", "bc");
        back.appendChild(closeButton);
        closeButton.onclick = () => {
            dialog.close();
            dialog.remove();
        };
        const Name = document.createElement("div");
        Name.classList.add("flex-1", "rom-item", "hw", "cw");
        Name.textContent = fileName;
        dialog.appendChild(Name);
        const actionDiv = document.createElement("div");
        actionDiv.classList.add("actionDiv", "hw", "cw");
        dialog.appendChild(actionDiv);
        const downloadButton = document.createElement("div");
        downloadButton.classList.add("download", "bc");
        actionDiv.appendChild(downloadButton);
        downloadButton.onclick = () => {
            downloadFile(filePart, fileName);
        };
        const deleteButton = document.createElement("div");
        deleteButton.classList.add("delete", "bc");
        actionDiv.appendChild(deleteButton);
        deleteButton.onclick = async () => {
            if (window.confirm("Delete this file? " + fileName)) {
                Module.deleteFile(filePart);
                setTimeout(() => {Module.FSSync()},500);
                localStorageFile();
                dialog.close();
                dialog.remove();
            }
        };
        const renameButton = document.createElement("div");
        renameButton.classList.add("rename", "bc");
        actionDiv.appendChild(renameButton);
        renameButton.onclick = async () => {
            const newFilename = window.prompt("Edit filename for " + fileName, fileName);
            if (newFilename !== null) {
                Module.editFileName(filePart, fileName, newFilename);
                setTimeout(() => {Module.FSSync()},500);
                localStorageFile();
                dialog.close();
                dialog.remove();
            }
        };
        dialog.showModal();
    }
    const mib = document.createElement("span");
    mib.textContent = humanFileSize(Module.fileSize(filePart));
    mib.classList.add("mib");
    Name.appendChild(mib);
}
//local Storage File
function localStorageFile() {
    const listRoms = Module.listRoms().filter((file) => file !== "." && file !== "..");
    const listSaves = Module.listSaves().filter((file) => file !== "." && file !== "..");
    const listStates = Module.listStates().filter((file) => file !== "." && file !== "..");
    const listCheats = Module.listCheats().filter((file) => file !== "." && file !== "..");
    const refreshList = [romsFile, savesFile, statesFile, cheatsFile];
    for (const refresh of refreshList) {
        while (refresh.firstChild) {
            refresh.lastChild.remove();
        }
    }
    for (const romsName of listRoms) {
        createElementStorage(romsFile, romsName, `/data/games/${romsName}`);
    }
    for (const statesName of listStates) {
        createElementStorage(statesFile, statesName, `/data/states/${statesName}`);
    }
    for (const savesName of listSaves) {
        createElementStorage(savesFile, savesName, `/data/saves/${savesName}`)
    }
    for (const cheatsName of listCheats) {
        createElementStorage(cheatsFile, cheatsName, `/data/cheats/${cheatsName}`)
    }
}
//Load States In Page
function LoadstateInPage(saveSlot, divs, dateState) {
    const imageStateDiv = document.getElementById(divs);
    imageStateDiv.onclick = () => {
        const stateList = document.getElementById("stateList");
        stateList.classList.toggle("visible");
        statePageButton.classList.toggle("active");
        led(saveSlot);
        notiMessage(`Loaded State in Slot [${saveSlot}]`, 2000);
        setTimeout(() => {
            loadState(saveSlot);
            localStorage.setItem("slotStateSaved", saveSlot)
        }, 100);
    };
    while (imageStateDiv.firstChild) {
        imageStateDiv.removeChild(imageStateDiv.firstChild);
    }
    const getNameRom = localStorage.getItem("gameName");
    if (!getNameRom) {
        console.error("No game name identified.");
        return;
    }
    const data = localStorage.getItem(`${getNameRom}_imageState${saveSlot}`) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMjUyNTI1Ii8+CjxwYXRoIG9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02NyAyOEg1M1Y0Mkg2N1YyOFpNNjUgMjlINjZWMzBWMzFWMzJWMzNWMzRWMzVWMzZWMzdWMzhWMzlWNDBWNDFINTRWNDBINTVWMzlINTZWMzhINTdWMzdINThWMzZINTlWMzVINjBWMzRINjFWMzNINjJWMzJINjNWMzFINjRWMzBINjVWMjlaIiBmaWxsPSIjRkZGRkY1Ii8+Cjwvc3ZnPgo=';
    const date = localStorage.getItem(`${getNameRom}_dateState${saveSlot}`);
    let image = new Image();
    image.src = data;
    imageStateDiv.appendChild(image);
    document.getElementById(dateState).textContent = date;
}
//Capture Screenshot
async function screenShot(saveSlot) {
    try {
        Module.screenShot(() => {
            var resizedCanvas = document.createElement('canvas');
            var resizedContext = resizedCanvas.getContext('2d');
            var screen = document.getElementById('canvas');
            resizedCanvas.height = screen.clientHeight;
            resizedCanvas.width = screen.clientWidth;
            resizedContext.drawImage(screen, 0, 0, resizedCanvas.width, resizedCanvas.height);
            let data = resizedCanvas.toDataURL();
            const currentTime = Date.now();
            const date = formatDateTime(currentTime);
            const getNameRom = localStorage.getItem("gameName");
            if (!getNameRom) {
                console.error("No game name identified.");
                return;
            }
            localStorage.setItem(`${getNameRom}_dateState${saveSlot}`, date);
            localStorage.setItem(`${getNameRom}_imageState${saveSlot}`, data);
        });
    } catch (error) {
        console.error("Error screenShot:", error);
    }
}
//DOM Content Loaded
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        localStorageFile();
        romList();
    },1000);

    setTimeout(() => {
        romInput.accept = ".gba,.gbc,.gb";
        upLoadFile.accept = ".gba,.gbc,.gb,.sav,.ss0,.ss1,.ss2,.ss3,.cheats";
        led(parseInt(localStorage.getItem("slotStateSaved")));
        if (parseInt(localStorage.getItem("autoStateCheck") | 1) === 1) {
            autoStateCheck.checked = true;
        }
        listPad.classList.add("inactive");
        
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
            // Joystick
            let currentDirection = '';
            const updateButtonState = (direction, isPressed) => {
                const directions = direction.split('-');
                directions.forEach(dir => {
                    if (isPressed) {
                        Module.buttonPress(dir);
                    } else {
                        Module.buttonUnpress(dir);
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
              //  console.log('DPAD Direction: ' + dpadDirection);
            });
            dynamic.on('end', () => {
                updateButtonState(currentDirection, false);
                currentDirection = '';
            });
            // Joystick
        })
    },0);
    setTimeout(() => {
           // const fileName = 'Pokemon - Emerald Version (U).ss0'
          //  dpDownloadFile(fileName);
    }, 3000);
    handleDropboxCallback();
})
/*----------------FrontEnd----------------*/
//Buton Upload File
upLoadFile.addEventListener("change", function() {
    const fileName = upLoadFile.files[0].name;
    if (fileName.endsWith(".cheats")) {
        uploadCheat(upLoadFile);
    } else if (fileName.endsWith(".gba") || fileName.endsWith(".gbc") || fileName.endsWith(".bc")) {
        uploadRom(upLoadFile);
    } else {
        uploadSavSta(upLoadFile);
    }
})
//Button Rom Input
romInput.addEventListener("change", function() {
    notiMessage();
    inputGame(romInput);
})
//Buton Menu In GamePad
menuPad.addEventListener("click", function() {
    menuPad.classList.toggle("active");
    listPad.classList.toggle("active");
    if (listPad.classList.contains("active")) {
        listPad.classList.remove("inactive");
    } else {
        listPad.classList.add("inactive");
    }
})
//Button Load State
loadStateButton.addEventListener("click", function() {
    clickState++;
    if (clickState === 2) {
        const slotStateNumbers = localStorage.getItem("slotStateSaved") || 1;
        loadState(slotStateNumbers);
        notiMessage(`Loaded State in Slot [${slotStateNumbers}]`, 1500);
    }
    setTimeout(() => {
        clickState = 0
    }, 300);
})
//Button Save State
saveStateButton.addEventListener("click", function() {
    clickState++;
    if (clickState === 2) {
        if (parseInt(localStorage.getItem("autoStateCheck") || 1) === 1) {
            const slotStateNumbers = parseInt((localStorage.getItem("slotStateSaved") % 3) + 1) || 1;
            saveState(slotStateNumbers);
            notiMessage(`Saved State in Slot [${slotStateNumbers}]`, 1500);
            console.log("slotStateNumbers",slotStateNumbers);
            localStorage.setItem("slotStateSaved", slotStateNumbers)
        } else {
            const slotStateNumbers = parseInt(localStorage.getItem("slotStateSaved")) || 1;
            saveState(slotStateNumbers);
            notiMessage(`Saved State in Slot [${slotStateNumbers}]`, 1500);
            localStorage.setItem("slotStateSaved", slotStateNumbers)
        }
    }
    setTimeout(() => {
        clickState = 0
    }, 300);
})
//Button Turbo
turbo.addEventListener("click", function() {
    turboState = (turboState % 3) + 1;
    turboF(turboState);
    localStorage.setItem("turboState", turboState);
})
//Buton Back Local Storage
backToHome.addEventListener("click", function() {
    storage.classList.add("disable");
    intro.classList.remove("disable");
    ingame.classList.add("disable");
})
//Buton Open Local Storage
openLocalStorage.addEventListener("click", function() {
    storage.classList.remove("disable");
    intro.classList.add("disable");
    ingame.classList.add("disable");
})
//Buton Open Save States Page
statePageButton.addEventListener("click", function() {
    LoadstateInPage(0, "state00", "dateState00")
    LoadstateInPage(1, "state01", "dateState01")
    LoadstateInPage(2, "state02", "dateState02")
    LoadstateInPage(3, "state03", "dateState03")
    const stateList = document.getElementById("stateList");
    stateList.classList.toggle("visible");
    statePageButton.classList.toggle("active");
})
//Auto Save States In Page
autoStateCheck.addEventListener("click", function() {
    if (this.checked) {
        const autoStateCheck = 1
        localStorage.setItem("autoStateCheck", autoStateCheck)
        notiMessage("Auto Switches Slots", 2000);

    } else {
        const autoStateCheck = 0
        localStorage.setItem("autoStateCheck", autoStateCheck)
        notiMessage("Manual Switches Slots", 2000);
    }
})
//Buton Cheats
saveCheatsButton.addEventListener("click", function() {
    const gameName = localStorage.getItem("gameName");
    const cheatName = gameName.replace(".gba", ".cheats");
    const defaultCheatContent = "cheats = 1\n";
    let cheatEnable = false;
    let cheatsContent = defaultCheatContent;
    const newCheatCode = window.prompt("Edit cheat code", localStorage.getItem(`${gameName}_savedCheats`) || 'xxxx xx');
    if (newCheatCode !== null) {
        const enableCheat = confirm("CANCEL is disable a cheat / OK is enable a cheat");
        cheatEnable = enableCheat;
        cheatsContent += `cheat0_enable = ${cheatEnable}\ncheat0_code = "${newCheatCode}"`;
        const blob = new Blob([cheatsContent], {
            type: "text/plain"
        });
        const file = new File([blob], cheatName);
        Module.uploadCheats(file, () => {
            Module.autoLoadCheats();
            setTimeout(() => {
                Module.FSSync();
            }, 500);
            if (cheatEnable) {
                localStorage.setItem(`${gameName}_savedCheats`, newCheatCode);
                notiMessage("Cheat enabled!", 1500);
            }
        });
    }
})
//SDL2 Enable
SDL2ID.forEach(function(id) {
    const button = document.getElementById(id);
    if(button) {
        button.addEventListener("touchstart", function() {
            const stateList = document.getElementById("stateList");
            if (listPad.classList.contains("active")) {
                listPad.classList.remove("active");
                listPad.classList.add("inactive");
                menuPad.classList.remove("active");
            }
            if (stateList.classList.contains("visible")){
            } else {
                statePageButton.classList.remove("active");
                stateList.classList.add("visible");
            }
        });
    }
})
//Uses OAuth 2.0
function authorizeWithDropbox() {
    var redirectUri = window.location.href.split('?')[0];
    var responseType = 'code';
    var tokenAccessType = 'offline';
    var authorizeUrl = 'https://www.dropbox.com/oauth2/authorize?client_id=' + clientId + '&response_type=' + responseType + '&token_access_type=' + tokenAccessType + '&redirect_uri=' + encodeURIComponent(redirectUri);
    window.location.href = authorizeUrl;
}
//Callback to Dropbox
function handleDropboxCallback() {
    var authorizationCode = getUrlParameter('code');
    if (authorizationCode) {
        getAccessToken(authorizationCode);
        console.log("Authorization Code:",authorizationCode)
    } else {
        console.log("Do not receive authorization")
    }
}
// Hàm trợ giúp để lấy tham số từ URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&#]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
// Hàm để lấy access token và refresh token từ authorization code
async function getAccessToken(authorizationCode) {
    var grantType = 'authorization_code';
    var redirectUri = window.location.href.split('?')[0];
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.dropbox.com/oauth2/token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var accessToken = response.access_token;
            var refreshToken = response.refresh_token;
            var uId = response.uid;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("uId", uId);
            window.location.href = redirectUri;           
        } else {
            console.log("Do not receive access token & refresh token")
        }
    };
    xhr.send('code=' + authorizationCode + '&grant_type=' + grantType + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&redirect_uri=' + encodeURIComponent(redirectUri));
}
dropboxCloud.addEventListener("click", function() {
    authorizeWithDropbox();
});
//Cloud Refresh Token 
async function dpRefreshToken() {
	console.log("Refreshing token...");
	if (!(localStorage.getItem("refreshToken"))) {
		throw "No refresh token";
	}

	try {
		const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `refresh_token=${localStorage.getItem("refreshToken")}&grant_type=refresh_token&client_id=knh3uz2mx2hp2eu&client_secret=nwb3dnfh09rhs31`
		});

		const data = await response.json();
		if (!data.error) {
			localStorage.setItem("accessToken", data.access_token);
      console.log("New Access Token",data.access_token);
			return true;
		} else {
			alert(data.error_description || "Failed to refresh Dropbox token.");
		}
	} catch (error) {
		console.error("Error while refreshing token:", error);
	}

	return false;
}
//Cloud Upload File
async function dpUploadFile(fileName, fileData) {
	var uploadArg = JSON.stringify({
		"autorename": true,
		"mode": 'overwrite',
		"mute": true,
		"strict_conflict": false,
		"path": '/' + localStorage.getItem("uId") + '/' + fileName,
	})
	var blob = new Blob([fileData], {
		type: "application/octet-stream"
	})
	for (var retry = 0; retry < 2; retry++) {
		var resp = await fetch('https://content.dropboxapi.com/2/files/upload', {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
				'Dropbox-API-Arg': uploadArg,
				'Content-Type': 'application/octet-stream'
			},
			body: blob
		})
		if (resp.status != 200) {
			if (resp.status == 401) {
				var ret = await dpRefreshToken()
				if (!ret) {
					throw "Unable to refresh token"
				}
				continue
			} else {
				throw "Upload failed, unknown http status: " + resp.status
			}
		} else {
			var obj = await resp.json()
			return obj
		}
	}
	return false
}
//Cloud Download File
async function dpDownloadFile(fileName) {
    var downloadArg = JSON.stringify({"path": '/' + localStorage.getItem("uId") + '/' + fileName});
    
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Dropbox-API-Arg": downloadArg,
            }
        });
        console.log("Download ↦ Cloud status ◆", resp.status);
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken();
                if (!ret) {
                    throw "Unable to refresh token";
                }
                continue;
            } else {
                throw "Download failed, unknown http status:" + resp.status;
            }
        }

        const file = new File([await resp.blob()], fileName);
        Module.uploadSaveOrSaveState(file, () => {
            console.log("Cloud ↦ Kabu storage ◆", file.name);
            localStorageFile();
            Module.FSSync();
        });

        return file;
    }

    return false;
}
//Cloud Check File Exists
async function checkFileExists(fileName) {
    var requestData = { path: '/' + localStorage.getItem("uId") + '/' + fileName };
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        console.log("status: ", resp.status);
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken();
                if (!ret) {
                    throw "Unable to refresh token";
                }
                continue;
            } else {
                throw "Download failed, unknown http status: " + resp.status;
            }
        }else {
            const obj = await resp.json();
            console.log("Có game nhé");
            return obj
		}
     
    }
    return false;
}
async function downloadAndUploadAllFiles() {
    var requestData = { path: '/' + localStorage.getItem("uId") };
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        console.log("status: ", resp.status);
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken();
                if (!ret) {
                    throw "Unable to refresh token";
                }
                continue;
            } else {
                throw "Download failed, unknown http status: " + resp.status;
            }
        } else {
            const data = await resp.json();
            console.log("Files in directory:", data.entries);
            const filesToUpload = data.entries.filter(entry => entry[".tag"] === "file");
            uploadFilesSequentially(filesToUpload);
            return true;
        }
    }
    return false;
}

async function uploadFilesSequentially(files) {
    for (const fileEntry of files) {
        const fileName = fileEntry.name;
        const filePath = fileEntry.path_lower;
        const fileResp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Dropbox-API-Arg": JSON.stringify({ "path": filePath }),
            }
        });
        if (fileResp.status === 200) {
            const blob = await fileResp.blob();
            const file = new File([blob], fileName);
            Module.uploadSaveOrSaveState(file, () => {
                console.log("Cloud ↦ Kabu storage ◆", file.name);
                Module.FSSync();
            });
            localStorageFile();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        } else {
            console.error("Error downloading file:", fileName);
        }
    }
}

// Gọi hàm để tải và up tất cả các tệp trong thư mục của người dùng
dropboxRestore.addEventListener("click", function() {
    downloadAndUploadAllFiles();
});

