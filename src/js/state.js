import * as Main from './main.js';
/* --------------- Declaration --------------- */
let clickTimer;
let clickedOver1s = false;
/* --------------- Function ------------------ */
// Load States
function LoadstateInPage(saveSlot, divs, dateState, stateDivs) {
    const imageStateDiv = document.getElementById(divs);
    const localSlot = localStorage.getItem("slotStateSaved")
    const stateDiv = document.getElementById(stateDivs);
    const getNameRom = localStorage.getItem("gameName");
    const noneImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEg2MFY0MEgwVjBaIiBmaWxsPSIjMTYxNjE2Ii8+CjxwYXRoIG9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNCAxNkgyNlYyNEgzNFYxNlpNMzMgMTdIMzJWMThIMzFWMTlIMzBWMjBIMjlWMjFIMjhWMjJIMjdWMjNIMzNWMTdaIiBmaWxsPSIjRkZGRkY1Ii8+Cjwvc3ZnPgo=';
    const stateName = getNameRom.replace(".gba", `.ss${saveSlot}`);
    const data = localStorage.getItem(`${getNameRom}_imageState${saveSlot}`) || noneImage;
    const date = localStorage.getItem(`${getNameRom}_dateState${saveSlot}`);
    imageStateDiv.style.backgroundImage = `url('${data}')`;
    imageStateDiv.style.backgroundSize = 'cover';
    imageStateDiv.style.backgroundRepeat = 'no-repeat';
    imageStateDiv.style.backgroundPosition = 'center center';
    document.getElementById(dateState).textContent = date || "__";
    if (parseInt(localSlot) === parseInt(saveSlot)) {
        stateDiv.style.color = "#20A5A6";
        stateDiv.style.background = "rgba(32, 165, 166, 0.06)";
    } else {
        stateDiv.style.color = "#F5E8D1";
        stateDiv.style.background = "rgba(32, 165, 166, 0)";
    }

    stateDiv.addEventListener("touchstart", function() {
        if (localStorage.getItem(`${getNameRom}_imageState${saveSlot}`)) {
            clearTimeout(clickTimer);
            clickTimer = setTimeout(function() {
                Main.deleteFile(`/data/states/${stateName}`);
                localStorage.removeItem(`${getNameRom}_dateState${saveSlot}`);
                localStorage.removeItem(`${getNameRom}_imageState${saveSlot}`);
                setTimeout(() => {
                    notiMessage("Deleted State!", 1500);
                    imageStateDiv.style.backgroundImage = `url('${noneImage}')`;
                    document.getElementById(dateState).textContent = localStorage.getItem(`${getNameRom}_dateState${saveSlot}`) || "__";
                }, 200);
            }, 1500);
        } else {
            notiMessage("Do not have State!", 1500);
        }
    });

    stateDiv.addEventListener("touchend", function() {
        clearTimeout(clickTimer);
        if (!clickedOver1s) {
            stateDiv.onclick = () => {
                stateList.classList.toggle("visible");
                statePageButton.classList.toggle("active");
                led(saveSlot);
                Main.loadState(saveSlot);
                Main.resumeGame();
                localStorage.setItem("slotStateSaved", saveSlot)
                notiMessage(`[${saveSlot}] Loaded State`, 1500);
            };
        }
        clickedOver1s = false;
    });
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    ["mouseup", "touchend", "touchcancel"].forEach(eventType => {
        //Buton Open Save States Page
        statePageButton.addEventListener(eventType, () => {
            LoadstateInPage(0, "state00", "dateState00", "stateDiv00")
            LoadstateInPage(1, "state01", "dateState01", "stateDiv01")
            LoadstateInPage(2, "state02", "dateState02", "stateDiv02")
            LoadstateInPage(3, "state03", "dateState03", "stateDiv03")
            LoadstateInPage(4, "state04", "dateState04", "stateDiv04")
            LoadstateInPage(5, "state05", "dateState05", "stateDiv05")
            LoadstateInPage(6, "state06", "dateState06", "stateDiv06")
            LoadstateInPage(7, "state07", "dateState07", "stateDiv07")
            stateList.classList.toggle("visible");
            statePageButton.classList.toggle("active");
            if (stateList.classList.contains("visible")) {
                canvas.style.borderRadius = "0px 0px 2px 2px";
                Main.resumeGame();
            } else {
                canvas.style.borderRadius = "0px 0px 2.4px 2.4px";
                Main.pauseGame();
            }
        });
    });
});