import * as Main from './main.js';
/* --------------- Declaration --------------- */
const romlist = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
/* --------------- Function ------------------ */
async function romList() { 
    const lastOpenedGame = localStorage.getItem("gameName");
    const gameList = await Main.listGame();
    if (lastOpenedGame) {
        const index = gameList.indexOf(lastOpenedGame);
        if (index > -1) {
            gameList.splice(index, 1); 
            gameList.unshift(`©${lastOpenedGame}`);
        }
    }
    for (const gameName of gameList) {
        const div = Object.assign(document.createElement("div"), {
            className: "flex-1",
            textContent: gameName,
            onclick: () => {
                Main.loadGame(gameName);
                localStorage.setItem("gameName", gameName);
            }
        });
        romlist.appendChild(div);
    }
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