import * as Main from './main.js';
let selectedIndex = 1;
/* --------------- Declaration --------------- */
const stateDivs = document.querySelectorAll('.stateDiv');
/* --------------- Function ------------------ */
// Load States
async function LoadstateInPage(saveSlot, dateState) {
    const timeData = await Main.getData(gameName, saveSlot, "saveTime");
    document.getElementById(dateState).textContent = timeData || "__";
}
// Update State Selection
const updateSelectionState = async () => {
    stateDivs.forEach((stateDiv, index) => {
        if (index + 1 === selectedIndex) {
            stateDiv.classList.add('selected');
        } else {
            stateDiv.classList.remove('selected');
        }
    });
};
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    ["touchend"].forEach(eventType => {
        //Buton Open Save States Page
        statePageButton.addEventListener(eventType, async() => {
            selectedIndex = parseInt(await Main.getData(gameName, "1", "slotStateSaved")) || 1;
            updateSelectionState(); 
            for (let i = 1; i <= 3; i++) {
                LoadstateInPage(i, `dateState0${i}`);
            }
            stateList.classList.toggle("visible");
            statePageButton.classList.toggle("active");
            if (stateList.classList.contains("visible")) {
                document.getElementById("menu-pad").style.removeProperty("pointer-events");
                Main.resumeGame();
            } else {
                document.getElementById("menu-pad").style.setProperty("pointer-events", "none", "important");
                Main.pauseGame();
            }
        });
        //Left Button
        document.querySelectorAll('#Left').forEach(button => {
            button.addEventListener(eventType, () => {
                if (statePageButton.classList.contains("active") && selectedIndex > 1) {
                    selectedIndex--;
                    updateSelectionState();
                    led(selectedIndex);
                    Main.setData(gameName, "1", "slotStateSaved", selectedIndex);
                }
            });
        });
        //Right Button
        document.querySelectorAll('#Right').forEach(button => {
            button.addEventListener(eventType, () => {
                if (statePageButton.classList.contains("active") && selectedIndex < stateDivs.length) {
                    selectedIndex++;
                    updateSelectionState();
                    led(selectedIndex);
                    Main.setData(gameName, "1", "slotStateSaved", selectedIndex);
                }
            });
        });
        //A Button
        document.getElementById('A').addEventListener(eventType, async () => {
            if (statePageButton.classList.contains("active")) {
                if (document.getElementById(`stateDiv0${selectedIndex}`).classList.contains('selected')) {
                    stateList.classList.toggle("visible");
                    statePageButton.classList.toggle("active");
                    document.getElementById("menu-pad").style.removeProperty("pointer-events");
                    led(selectedIndex);
                    await Main.loadState(selectedIndex);
                    await Main.setData(gameName, "1", "slotStateSaved", selectedIndex);
                    await Main.resumeGame();
                    await delay(100);
                    await Main.notiMessage(`[${selectedIndex}] Loaded State`, 1500);
                }
            }
        });
        //B Button
        document.getElementById('B').addEventListener(eventType, async () => {
            if (statePageButton.classList.contains("active")) {
                if (document.getElementById(`stateDiv0${selectedIndex}`).classList.contains('selected')) {
                    if (confirm(`Do you want slot [${selectedIndex}] deleted?`)) {
                        const stateName = gameName.replace(/\.(zip|gb|gbc|gba)$/, `.ss${selectedIndex}`);
                        const screenShotName = gameName.replace(/\.(zip|gb|gbc|gba)$/, "");
                        await Main.deleteFile(`/data/states/${stateName}`);
                        await delay(200);
                        await Main.deleteFile(`/data/screenshots/${screenShotName}_${selectedIndex}.png`);
                        document.getElementById(`dateState0${selectedIndex}`).textContent = "__";
                    }
                }
            }
        });
    });
});