import * as Main from './main.js';
/* --------------- Declaration --------------- */
const mgbaStorage = document.getElementById("mgba-storage");
const savesFile = document.getElementById("savesFile");
const romsFile = document.getElementById("romsFile");
const statesFile = document.getElementById("statesFile");
const screenshotsFile = document.getElementById("screenshotsFile");
/* --------------- Function ------------------ */
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
            Main.downloadFile(filePart, fileName);
            console.log(filePart);
            console.log(fileName);
            console.log(Main.downloadFile(filePart, fileName));
        };
        const deleteButton = document.createElement("div");
        deleteButton.classList.add("delete", "bc");
        actionDiv.appendChild(deleteButton);
        deleteButton.onclick = async () => {
            if (window.confirm("Delete this file?" + fileName)) {
                const romName = fileName.replace(/\....$/, ".gba");
                Main.deleteFile(filePart);
                localStorage.removeItem(`${romName}_dateState${fileName.slice(-1)}`);
                localStorage.removeItem(`${romName}_imageState${fileName.slice(-1)}`);
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
                const oldRomName = fileName.replace(/\....$/, ".gba");
                const newRomName = newFilename.replace(/\....$/, ".gba");
                const oldDateStateKey = `${oldRomName}_dateState${fileName.slice(-1)}`;
                const oldImageStateKey = `${oldRomName}_imageState${fileName.slice(-1)}`;
                const newDateStateKey = `${newRomName}_dateState${newFilename.slice(-1)}`;
                const newImageStateKey = `${newRomName}_imageState${newFilename.slice(-1)}`;
                const dateStateValue = localStorage.getItem(oldDateStateKey);
                const imageStateValue = localStorage.getItem(oldImageStateKey);
                if (dateStateValue !== null) {
                    localStorage.setItem(newDateStateKey, dateStateValue);
                    localStorage.removeItem(oldDateStateKey);
                }
        
                if (imageStateValue !== null) {
                    localStorage.setItem(newImageStateKey, imageStateValue);
                    localStorage.removeItem(oldImageStateKey);
                }
                Main.editFile(filePart, fileName, newFilename);
                localStorageFile();
                dialog.close();
                dialog.remove();
                mgbaStorage.classList.remove("opacity0");
            }
        };
        dialog.showModal();
    }
    const mib = document.createElement("span");
    mib.textContent = humanFileSize(Main.fileSize(filePart));
    mib.classList.add("mib");
    Name.appendChild(mib);
}
export function localStorageFile() {
    const listRoms = Main.listGame();
    const listSaves = Main.listSave();
    const listStates = Main.listState();
    const listCheats = Main.listCheat();
    const listScreenshots = Main.listScreenshot();
    const refreshList = [romsFile, savesFile, statesFile, cheatsFile, screenshotsFile];
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
    for (const screenshotsName of listScreenshots) {
        createElementStorage(screenshotsFile, screenshotsName, `/data/screenshots/${screenshotsName}`)
    }
}
/* --------------- DOMContentLoaded ---------- */
if (coreState === "mGBA") {
    document.addEventListener("DOMContentLoaded", function() {
        upLoadFile.addEventListener("change", function() {
            const fileName = upLoadFile.files[0].name;
            if (fileName.endsWith(".cheats")) {
                Main.uploadCheat(upLoadFile);
            } else if (fileName.endsWith(".gba") || fileName.endsWith(".gbc") || fileName.endsWith(".bc")) {
                Main.uploadGame(upLoadFile);
            } else {
                Main.uploadSavSta(upLoadFile);
            }
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
        setTimeout(() => {
            localStorageFile();
        },3000);
    });
};