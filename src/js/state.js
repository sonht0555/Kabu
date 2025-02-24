import * as Main from './main.js';
/* --------------- Declaration --------------- */
let selectedIndex = 0;
const stateDivs = document.querySelectorAll('.stateDiv');
const noneImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg2MFY0MEgwVjBaIiBmaWxsPSIjMTYxNjE2Ii8+CjxwYXRoIG9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNCAxNkgyNlYyNEgzNFYxNlpNMzMgMTdIMzJWMThIMzFWMTlIMzBWMjBIMjlWMjFIMjhWMjJIMjdWMjNIMzNWMTdaIiBmaWxsPSIjRkZGRkY1Ii8+Cjwvc3ZnPgo=';
/* --------------- Function ------------------ */
// Load States
async function LoadstateInPage(saveSlot, divs, dateState, stateDivs) {
    const imageStateDiv = document.getElementById(divs);
    const localSlot = localStorage.getItem("slotStateSaved")
    const stateDiv = document.getElementById(stateDivs);
    const gameName = localStorage.getItem("gameName").replace(/\.(zip|gb|gbc|gba)$/, "");
    const imageData = await Main.dowloadScreenShot(`/data/screenshots/${gameName}_${saveSlot}.png`) || noneImage;
    const timeData = await Main.getData(gameName, saveSlot, "saveTime");
    console.log (timeData);
    imageStateDiv.style.cssText = `background-image: url('${imageData}');background-size: cover;background-repeat: no-repeat;background-position: center center`;
    document.getElementById(dateState).textContent = timeData || "__";
    if (parseInt(localSlot) === parseInt(saveSlot)) {
        stateDiv.classList.add('stated');
    } else {
        stateDiv.classList.remove('stated');
    }
}
const updateSelectionState = () => {
    stateDivs.forEach((stateDiv, index) => {
        if (index === selectedIndex) {
            stateDiv.classList.add('selected');
        } else {
            stateDiv.classList.remove('selected');
        }
    });
}
["mouseup", "touchend", "touchcancel"].forEach(eventType => {
    document.querySelectorAll('#Left').forEach(button => {
        button.addEventListener(eventType, () => {
        if (statePageButton.classList.contains("active")) {
            if (selectedIndex > 0) {
                selectedIndex--;
                updateSelectionState();
            }
        }
    });
    });
    document.querySelectorAll('#Right').forEach(button => {
        button.addEventListener(eventType, () => {
        if (statePageButton.classList.contains("active")) {
            if (selectedIndex < stateDivs.length - 1) {
                selectedIndex++;
                updateSelectionState();
            }
        }
    });
    });
    document.getElementById('A').addEventListener(eventType, () => {
        if (statePageButton.classList.contains("active")) {
            if (document.getElementById(`stateDiv0${selectedIndex}`).classList.contains('selected')) {
                stateList.classList.toggle("visible");
                statePageButton.classList.toggle("active");
                led(selectedIndex);
                Main.loadState(selectedIndex);
                localStorage.setItem("slotStateSaved", selectedIndex)
                Main.resumeGame();
                notiMessage(`[${selectedIndex}] Loaded State`, 1500);
            }
            
        };
    });
    document.getElementById('B').addEventListener(eventType, () => {
        if (statePageButton.classList.contains("active")) {
            if (document.getElementById(`stateDiv0${selectedIndex}`).classList.contains('selected')) {
                if (confirm(`Do you want to detelete [${selectedIndex}] state?`)) {
                    const stateName = localStorage.getItem("gameName").replace(/\.(zip|gb|gbc|gba)$/, `.ss${selectedIndex}`);
                    const screenShotName = localStorage.getItem("gameName").replace(/\.(zip|gb|gbc|gba)$/, "");
                    const imageStateDiv = document.getElementById(`state0${selectedIndex}`);
                    Main.deleteFile(`/data/states/${stateName}`);
                    setTimeout(() => {
                        Main.deleteFile(`/data/screenshots/${screenShotName}_${selectedIndex}.png`);
                    }, 500);
                    imageStateDiv.style.backgroundImage = `url('${noneImage}')`;
                    document.getElementById(`dateState0${selectedIndex}`).textContent = "__";
                    notiMessage("Deleted State!", 1500);
                }
            }
            
        };
    });
})
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    updateSelectionState();
    ["mouseup", "touchend", "touchcancel"].forEach(eventType => {
        //Buton Open Save States Page
        statePageButton.addEventListener(eventType, () => {
            for (let i = 0; i <= 7; i++) {
                LoadstateInPage(i, `state0${i}`, `dateState0${i}`, `stateDiv0${i}`);
            }
            stateList.classList.toggle("visible");
            statePageButton.classList.toggle("active");
            if (stateList.classList.contains("visible")) {
                Main.resumeGame();
            } else {
                Main.pauseGame();
            }
        });
    });
});