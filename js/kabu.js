import mGBA from "./mgba.js";
let gameVer = 'V1.20';
let turboState = 1;
let clickState = 0;
let countAutoSave = 0;
let countUpload = 0;
var timeoutId;
var lockNotiTime;
let clickTimer;
var clientId = 'knh3uz2mx2hp2eu';
var clientSecret = 'nwb3dnfh09rhs31';
const dropboxCloud = document.getElementById("dropboxCloud");
const input = document.getElementById("input-container");
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
const dropboxBackup = document.getElementById("dropboxBackup");
const stateList = document.getElementById("stateList");
const mgbaStorage = document.getElementById("mgba-storage");
const appVer = document.getElementById("appVer");
/*----------------BackEnd----------------*/
startGBA(Module)
appVer.textContent = gameVer
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
            await notiMessage("Online!", 2000);
            await startTimer();
            await delay(2000);
            await notiMessage(gameVer, 2000);
            localStorage.setItem("internetStatus", "on");
        } else {
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
        if (slotStateNumbers === 1) {
            document.getElementById("led00").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led01").style.fill = "#78C850";
            document.getElementById("led02").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led03").style.fill = "rgba(255, 255, 245, 0.2)";
        } else if(slotStateNumbers === 2) {
            document.getElementById("led00").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led01").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led02").style.fill = "#78C850";
            document.getElementById("led03").style.fill = "rgba(255, 255, 245, 0.2)";
        } else if(slotStateNumbers === 3) {
            document.getElementById("led00").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led01").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led02").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led03").style.fill = "#78C850";
        }else {
            document.getElementById("led00").style.fill = "#78C850";
            document.getElementById("led01").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led02").style.fill = "rgba(255, 255, 245, 0.2)";
            document.getElementById("led03").style.fill = "rgba(255, 255, 245, 0.2)";
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
            romlist.insertBefore(div, romlist.firstChild);
            div.textContent = gameName;
            //div.textContent = gameName.substring(0, gameName.lastIndexOf('.'));
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
        if (savedTurboState !== null) {
            turboState = parseInt(savedTurboState);
            await turboF(turboState);
        }
        await delay(2000);
        await statusShow();
        setInterval(() => {saveStatePeriodically()}, 60000);
        setInterval(() => {saveStateInCloud()}, 3600000);
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
    const slotState = parseInt(localStorage.getItem("slotStateSaved"));
    const ledId = slotState === 1 ? "led01" : slotState === 2 ? "led02" : slotState === 3 ? "led03" : "led00";
    try {
        for (let i = 0; i <= 3; i++) {
            document.getElementById("led0" + i).style.fill = "rgba(255, 255, 245, 0.2)";
        }
        await delay(1000); 
        document.getElementById(ledId).style.fill = "#78C850";
        await Module.saveState(0);
        await Module.FSSync();
        await screenShot(0);
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
        const ledId = slotState === 1 ? "led01" : slotState === 2 ? "led02" : slotState === 3 ? "led03" : "led00";
        const img = localStorage.getItem(`${gameName}_imageState0`);
        const date = localStorage.getItem(`${gameName}_dateState0`);
        if (navigator.onLine) {
            if (uId) {
                for (let i = 0; i <= 3; i++) {
                    document.getElementById("led0" + i).style.fill = "rgba(255, 255, 245, 0.2)";
                }
                await delay(1000); 
                document.getElementById(ledId).style.fill = "#E0C068";
                await delay(1000);
                await dpUploadFile(stateName, Module.downloadFile(`/data/states/${stateName}`));
                if (img !== null) {
                    const textContent = `${img}\n\n${date}`;
                    const blob = new Blob([textContent], { type: "text/plain" });
                    await dpUploadFile(`${gameName}_slot0.txt`, blob);
                } else {
                    console.log("No screenshot!");
                }
                await lockNoti("", `Cloud upload ${++countUpload} time(s)`, 2000)
            } else {
                console.log("Unable to upload to Cloud!");
            }
        } else {
            console.log("Online!");
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
    const gameName = localStorage.getItem("gameName");
    var message = document.getElementById("noti-mess");
    if (message.style.opacity === "0.4") {
      clearTimeout(timeoutId);
      message.style.opacity = "0";
    }
    message.textContent = messageContent;
    message.style.opacity = "0.4";
    timeoutId = setTimeout(() => {
      message.textContent = gameName.substring(0, gameName.lastIndexOf('.'));
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
        back.classList.add("storage", "right", "gap-10");
        dialog.appendChild(back);
        const closeButton = document.createElement("div");
        closeButton.classList.add("home", "bc", "flex-1");
        back.appendChild(closeButton);
        const blank1 = document.createElement("div");
        blank1.classList.add("flex-1");
        back.appendChild(blank1);
        const blank2 = document.createElement("div");
        blank2.classList.add("flex-1");
        back.appendChild(blank2);
        const blank3 = document.createElement("div");
        blank3.classList.add("flex-1");
        back.appendChild(blank3);
        mgbaStorage.classList.add("opacity0");
        closeButton.onclick = () => {
            dialog.close();
            dialog.remove();
            mgbaStorage.classList.remove("opacity0");
        };
        const Name = document.createElement("div");
        Name.classList.add("flex-1", "rom-item", "hw", "cw");
        Name.textContent = fileName;
        dialog.appendChild(Name);
        const actionDiv = document.createElement("div");
        actionDiv.classList.add("actionDiv", "hw", "cw", "gap-16");
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
            if (window.confirm("Delete this file?" + fileName)) {
                const romName = fileName.replace(/\....$/, ".gba");
                Module.deleteFile(filePart);
                localStorage.removeItem(`${romName}_dateState${fileName.slice(-1)}`);
                localStorage.removeItem(`${romName}_imageState${fileName.slice(-1)}`);
                setTimeout(() => {Module.FSSync()},500);
                localStorageFile();
                dialog.close();
                dialog.remove();
                mgbaStorage.classList.remove("opacity0");
            }
        };
        const renameButton = document.createElement("div");
        renameButton.classList.add("rename", "bc");
        actionDiv.appendChild(renameButton);
        renameButton.onclick = async () => {
            const newFilename = window.prompt("Edit filename", fileName);
            if (newFilename !== null) {
                Module.editFileName(filePart, fileName, newFilename);
                setTimeout(() => {Module.FSSync()},500);
                localStorageFile();
                dialog.close();
                dialog.remove();
                mgbaStorage.classList.remove("opacity0");
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
    const getNameRom = localStorage.getItem("gameName");
    const noneImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMjUyNTI1Ii8+CjxwYXRoIG9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02NyAyOEg1M1Y0Mkg2N1YyOFpNNjUgMjlINjZWMzBWMzFWMzJWMzNWMzRWMzVWMzZWMzdWMzhWMzlWNDBWNDFINTRWNDBINTVWMzlINTZWMzhINTdWMzdINThWMzZINTlWMzVINjBWMzRINjFWMzNINjJWMzJINjNWMzFINjRWMzBINjVWMjlaIiBmaWxsPSIjRkZGRkY1Ii8+Cjwvc3ZnPgo=';
    const stateName = getNameRom.replace(".gba", `.ss${saveSlot}`);
    const data = localStorage.getItem(`${getNameRom}_imageState${saveSlot}`) || noneImage;
    const date = localStorage.getItem(`${getNameRom}_dateState${saveSlot}`);
    while (imageStateDiv.firstChild) {
        imageStateDiv.removeChild(imageStateDiv.firstChild);
    }
    let image = new Image();
    image.src = data;
    imageStateDiv.appendChild(image);
    document.getElementById(dateState).textContent = date;

    imageStateDiv.onclick = () => {
        stateList.classList.toggle("visible");
        statePageButton.classList.toggle("active");
        led(saveSlot);
        notiMessage(`Loaded State [${saveSlot}]`, 2000);
        setTimeout(() => {
            loadState(saveSlot);
            localStorage.setItem("slotStateSaved", saveSlot)
        }, 100);
    };

    imageStateDiv.addEventListener("touchstart", function() {
        if (localStorage.getItem(`${getNameRom}_imageState${saveSlot}`)) {
            clearTimeout(clickTimer);
            clickTimer = setTimeout(function() {
                Module.deleteFile(`/data/states/${stateName}`);
                localStorage.removeItem(`${getNameRom}_dateState${saveSlot}`);
                localStorage.removeItem(`${getNameRom}_imageState${saveSlot}`);
                setTimeout(() => {
                    while (imageStateDiv.firstChild) {
                        imageStateDiv.removeChild(imageStateDiv.firstChild);
                    }
                    notiMessage("Deleted State!", 2000);
                    let image = new Image();
                    image.src = noneImage;
                    imageStateDiv.appendChild(image);
                    document.getElementById(dateState).textContent = localStorage.getItem(`${getNameRom}_dateState${saveSlot}`);
                }, 200);
            }, 1500);
        } else {
            console.log ("Do not have State!")
        }
    });

    imageStateDiv.addEventListener("touchend", function() {
        clearTimeout(clickTimer);
    });
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
        romList();
    },2000);
    setTimeout(() => {
        localStorageFile();
    },3000);

    setTimeout(() => {
        romInput.accept = ".gba,.gbc,.gb";
        upLoadFile.accept = ".gba,.gbc,.gb,.sav,.ss0,.ss1,.ss2,.ss3,.cheats";
        led(parseInt(localStorage.getItem("slotStateSaved")));
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
        if (parseInt(localStorage.getItem("autoStateCheck")) === 1) {
            document.getElementById("autoStateCheck").checked = true;
        } else {
            document.getElementById("autoStateCheck").checked = false;
            const autoStateCheck = 0
            localStorage.setItem("autoStateCheck", autoStateCheck)
        }
    },0);
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
        notiMessage(`Loaded State [${slotStateNumbers}]`, 1500);
    }
    setTimeout(() => {
        clickState = 0
    }, 300);
})
//Button Save State
saveStateButton.addEventListener("click", function() {
    clickState++;
    if (clickState === 2) {
        if (parseInt(localStorage.getItem("autoStateCheck")) === 1) {
            const slotStateNumbers = parseInt((localStorage.getItem("slotStateSaved") % 3) + 1) || 1;
            saveState(slotStateNumbers);
            notiMessage(`Saved State [${slotStateNumbers}]`, 1500);
            localStorage.setItem("slotStateSaved", slotStateNumbers)
        } else {
            const slotStateNumbers = parseInt(localStorage.getItem("slotStateSaved")) || 1;
            saveState(slotStateNumbers);
            notiMessage(`Saved State [${slotStateNumbers}]`, 1500);
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
    while (romlist.firstChild) {
        romlist.removeChild(romlist.firstChild);
    }
    setTimeout(() => {
        romList();
    },100);
})
//Buton Open Local Storage
openLocalStorage.addEventListener("click", function() {
    const uId = localStorage.getItem("uId");
    storage.classList.remove("disable");
    intro.classList.add("disable");
    ingame.classList.add("disable");

    if (uId === null || uId === "") {
        dropboxRestore.classList.remove("active");
        dropboxBackup.classList.remove("active");
        dropboxCloud.classList.remove("active");
    } else {
        dropboxRestore.classList.add("active");
        dropboxBackup.classList.add("active");
        dropboxCloud.classList.add("active");
    }
})
//Buton Open Save States Page
statePageButton.addEventListener("click", function() {
    LoadstateInPage(0, "state00", "dateState00")
    LoadstateInPage(1, "state01", "dateState01")
    LoadstateInPage(2, "state02", "dateState02")
    LoadstateInPage(3, "state03", "dateState03")
    stateList.classList.toggle("visible");
    statePageButton.classList.toggle("active");
})
//Auto Save States In Page
autoStateCheck.addEventListener("click", function() {
    if (this.checked) {
        const autoStateCheck = 1
        localStorage.setItem("autoStateCheck", autoStateCheck)
        console.log("autoStateCheck",parseInt(localStorage.getItem("autoStateCheck")))
        notiMessage("Auto Switches Slots", 1500);

    } else {
        const autoStateCheck = 0
        localStorage.setItem("autoStateCheck", autoStateCheck)
        console.log("autoStateCheck",parseInt(localStorage.getItem("autoStateCheck")))
        notiMessage("Manual Switches Slots", 1500);
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
            Module.SDL2();
            input.classList.remove("cs22");
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
async function authorizeWithDropbox() {
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
//Get url Parameter
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&#]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
//Get access token & refresh token from authorization code
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
           // window.location.href = redirectUri;           
        } else {
            console.log("Do not receive access token & refresh token")
        }
    };
    xhr.send('code=' + authorizationCode + '&grant_type=' + grantType + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&redirect_uri=' + encodeURIComponent(redirectUri));
}
//Cloud Refresh Token 
async function dpRefreshToken() {
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
            await lockNoti("", "Refreshing token...", 3000)
            await delay(1000);
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
    const uId = localStorage.getItem("uId");
	var uploadArg = JSON.stringify({
		"autorename": true,
		"mode": 'overwrite',
		"mute": true,
		"strict_conflict": false,
		"path": '/' + uId + '/' + fileName,
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
            console.log("Kabu storage ↦ Cloud ◆", fileName);
			return obj
		}
	}
	return false
}
//Cloud Download File
async function dpDownloadFile(fileName) {
    const uId = localStorage.getItem("uId");
    var downloadArg = JSON.stringify({"path": '/' + uId + '/' + fileName});
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken"),
                "Dropbox-API-Arg": downloadArg,
            }
        });
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
        console.log("Cloud ↦ Kabu storage ◆", file.name);
        if (fileName.endsWith(".txt")) {
            const textContent = await file.text();
            const [img, date] = textContent.split("\n\n");
            const gameName = fileName.substring(0, fileName.lastIndexOf("gba") + 3);
            const slotNumber = fileName.charAt(fileName.length - 5);
            localStorage.setItem(`${gameName}_dateState${slotNumber}`, date);
            localStorage.setItem(`${gameName}_imageState${slotNumber}`, img);
        } else {
            Module.uploadSaveOrSaveState(file, () => {
                localStorageFile();
                Module.FSSync();
            });
        }
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
dropboxRestore.addEventListener("click", async function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        window.alert("Cloud login required!");
    } else {
        var requestData = {
            path: '/' + uId
        };
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
                const totalFiles = data.entries.filter(entry => entry[".tag"] === "file").length;
                const confirmMessage = `Do you want to restore ${totalFiles} files in Cloud?`;
                if (window.confirm(confirmMessage)) {
                    for (const entry of data.entries) {
                        if (entry[".tag"] === "file") {
                            await lockNoti("Restoring...", entry.name, 3000)
                            await dpDownloadFile(entry.name);
                        }
                    }
                } else {
                    console.log("Restore canceled by user.");
                }
                return true;
            }
        }
        return false;
    }
});
dropboxBackup.addEventListener("click", async function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        window.alert("Cloud login required!");
    } else {
        const directories = ["states", "saves"];
        let totalFilesUploaded = 0;
        for (const directory of directories) {
            const fileList = Module[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]().filter(
                (file) => file !== "." && file !== ".."
            );
            totalFilesUploaded += fileList.length;
        }
        if (window.confirm(`Do you want to backup ${totalFilesUploaded} files in Kabu?`)) {
            for (const directory of directories) {
                const fileList = Module[`list${directory.charAt(0).toUpperCase() + directory.slice(1)}`]().filter(
                    (file) => file !== "." && file !== ".."
                );
                for (const fileName of fileList) {
                    const fileData = await Module.downloadFile(`/data/${directory}/${fileName}`);
                    try {
                        await lockNoti("Backing up...", fileName, 3000)
                        await dpUploadFile(fileName, fileData);
                        if (fileName.endsWith(".ss0") || fileName.endsWith(".ss1") || fileName.endsWith(".ss2") || fileName.endsWith(".ss3")  ) {
                            const gameName = fileName.substring(0, fileName.lastIndexOf('.'));
                            const slotNumber = fileName.charAt(fileName.length - 1);
                            const img = localStorage.getItem(`${gameName}.gba_imageState${slotNumber}`);
                            const date = localStorage.getItem(`${gameName}.gba_dateState${slotNumber}`);
                            if (img !== null) {
                                const textContent = `${img}\n\n${date}`;
                                const blob = new Blob([textContent], { type: "text/plain" });
                                await lockNoti("Backing up...", `${gameName}.gba_slot${slotNumber}.txt`, 3000)
                                await dpUploadFile(`${gameName}.gba_slot${slotNumber}.txt`, blob); 
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to upload file ${fileName}:`, error);
                    }
                }
            }
        } else {
            console.log("Restore canceled by user.");
        }
    }
});
dropboxCloud.addEventListener("click", function() {
    const uId = localStorage.getItem("uId");
    if (uId === null || uId === "") {
        authorizeWithDropbox();
    } else {
        if (window.confirm(`Do you want to logout?`)) {
            localStorage.setItem("uId", "");
            dropboxRestore.classList.remove("active");
            dropboxBackup.classList.remove("active");
            dropboxCloud.classList.remove("active");
        }
    }
});
async function lockNoti(title, detail, second) {
    const lockNoti = document.getElementById("lockNoti");
    const notiTitle = document.getElementById("notiTitle");
    const notiDetail = document.getElementById("notiDetail");
    if (lockNotiTime) {
        clearTimeout(lockNotiTime);
    }
    notiTitle.textContent = title;
    notiDetail.textContent = detail;
    lockNoti.classList.remove("visible");
    lockNotiTime = setTimeout(() => {
        lockNoti.classList.add("visible");
    }, second);
}
async function startTimer() {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    setInterval(function() {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
            if (minutes >= 60) {
                minutes = 0;
                hours++;
            }
        }
        let timeString = hours + "h" + pad(minutes) + "." + pad(seconds);
        document.getElementById("timer").textContent = timeString;
    }, 1000);
}

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

const tesst = document.getElementById("tesst");
tesst.addEventListener("click", async function() {
   
});