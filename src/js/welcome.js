import * as Main from './main.js';
/* --------------- Declaration --------------- */
const romlist = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
/* --------------- Function ------------------ */
async function romList() {
    const gameList = await Main.listGame();
    const lastGameName = localStorage.getItem("lastGameName");
    if (lastGameName && gameList.includes(lastGameName)) {
        gameList.splice(gameList.indexOf(lastGameName), 1);
        gameList.unshift(lastGameName);
    }
    romlist.innerHTML = "";
    for (const gameName of gameList) {
        const div = document.createElement("div");
        div.classList.add("flex-1", "game-item");
        div.textContent = gameName;
        div.onclick = () => {
            localStorage.setItem("lastGameName", gameName);
            Main.loadGame(gameName);
            romList();
        };
        romlist.appendChild(div);
    }
}
async function inputGame(InputFile) {
    const gameName = InputFile.files[0].name;
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