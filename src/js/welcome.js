import * as Main from './main.js';
/* --------------- Declaration --------------- */
const romlist = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
/* --------------- Function ------------------ */
async function romList() {
    const gameList = await Main.listFiles("games");
    const lastGameName = localStorage.getItem("lastGameName") || null;
    let recentGames = JSON.parse(localStorage.getItem("recentGames")) || [];
    let sortedGameList = [];
    if (lastGameName && gameList.includes(lastGameName)) {
        sortedGameList.push(lastGameName);
    }
    recentGames.forEach(game => {
        if (game !== lastGameName && gameList.includes(game)) {
            sortedGameList.push(game);
        }
    });
    gameList.forEach(game => {
        if (!sortedGameList.includes(game)) {
            sortedGameList.push(game);
        }
    });
    romlist.innerHTML = "";
    sortedGameList.forEach(gameName => {
        const div = document.createElement("div");
        div.classList.add("flex-1", "game-item");
        div.textContent = gameName;
        div.onclick = () => {
            updateRecentGames(gameName);
            Main.loadGame(gameName);
            romList();
        };
        romlist.appendChild(div);
    });
}
function updateRecentGames(gameName) {
    let recentGames = JSON.parse(localStorage.getItem("recentGames")) || [];
    recentGames = recentGames.filter(name => name !== gameName);
    recentGames.unshift(gameName);
    localStorage.setItem("recentGames", JSON.stringify(recentGames));
    localStorage.setItem("lastGameName", gameName);
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