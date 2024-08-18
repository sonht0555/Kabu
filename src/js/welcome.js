import * as Main from './main.js';
/* --------------- Declaration --------------- */
const romlist = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
/* --------------- Function ------------------ */
async function romList() { 
    await Main.listGame().forEach(gameName => {
        const div = Object.assign(document.createElement("div"), {
            className: "flex-1",
            textContent: gameName,
            onclick: () => {
                Main.loadGame(gameName);
                localStorage.setItem("gameName", gameName);
            }
        });
        romlist.insertBefore(div, romlist.firstChild);
    });
}
async function inputGame(InputFile) {
    const gameName = InputFile.files[0].name;
    localStorage.setItem("gameName", gameName);
    await Main.uploadGame(romInput);
    await delay(500);
    await Main.loadGame(gameName);
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        romList();
    },2000);
    romInput.addEventListener("change", function() {
        inputGame(romInput);
    })
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
});