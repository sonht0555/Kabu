var messageTimeout;
var timeoutIds;
let stateAdj = 1;
let opacity = parseFloat(localStorage.getItem("opacity")) || 0.1;
const inputText = document.getElementById("inputText");
const ingame = document.getElementById("in-game");
const input = document.getElementById("input-container");
const increaseButton = document.getElementById("plus-shader");
const decreaseButton = document.getElementById("minus-shader");
const imgshader = document.getElementById("img-shader");
const setAdjustment = document.getElementById("setAdjustment");
const savedStateAdj = localStorage.getItem("stateAdj");
const ids = ['stateDiv00', 'stateDiv01', 'stateDiv02', 'stateDiv03', 'stateDiv04', 'stateDiv05', 'stateDiv06', 'stateDiv07',];
const touchedID = ['saveStateButton', 'loadStateButton','restart-game','minus-shader','plus-shader','fileInputLable','openLocalStorage','upLoadFile','backToHome'];
const restart = document.getElementById("restart-game");
const shader = document.getElementById("shader");
const savedValue = localStorage.getItem("selectedShader");
// Joy Stick
var dynamicZone = document.getElementById("dynamic");
var nippleOptions = {
    zone: dynamicZone,
    color: "#323232",
    size: 120
};
var dynamic = nipplejs.create(nippleOptions);
//Notification Message
function notiMessage(messageContent, second) {
    var message = document.getElementById("noti-mess");
    const slotState = parseInt(localStorage.getItem("slotStateSaved")) || "0";
    const gameName = localStorage.getItem("gameName");
    if (message.style.opacity === "0.4") {
      clearTimeout(timeoutIds);
      message.style.opacity = "0";
    }
    message.textContent = messageContent;
    message.style.opacity = "0.4";
    timeoutIds = setTimeout(() => {
      message.textContent =`[${slotState}] ${gameName.substring(0, gameName.lastIndexOf('.'))}`;
      message.style.opacity = "0.2";
    }, second);
}
//Position Adjustment
function positionAdjustment(stateAdj) {
    const states = [{
            paddingTop: "0px",
            rectOpacity: [1, 1, 1],
            GOpacity: [0, 0, 0, 1]
        },
        {
            paddingTop: "60px",
            rectOpacity: [0.4, 1, 1],
            GOpacity: [0, 0, 1, 0]
        },
        {
            paddingTop: "120px",
            rectOpacity: [0.4, 0.4, 1],
            GOpacity: [0, 1, 0, 0]
        },
        {
            paddingTop: "180px",
            rectOpacity: [0.4, 0.4, 0.4],
            GOpacity: [1, 0, 0, 0]
        }
    ];
    if (stateAdj >= 1 && stateAdj <= 4) {
        const state = states[stateAdj - 1];
        document.querySelectorAll(".target-boxes").forEach(function(element, index) {
            element.style.setProperty("padding-top", state.paddingTop);
        });
        document.getElementById("rect1").style.setProperty("opacity", state.rectOpacity[0]);
        document.getElementById("rect2").style.setProperty("opacity", state.rectOpacity[1]);
        document.getElementById("rect3").style.setProperty("opacity", state.rectOpacity[2]);
        for (let i = 0; i < 4; i++) {
            document.getElementById(`G${i}`).style.setProperty("opacity", state.GOpacity[i]);
        }
    }
}
//Local Storage Size
function calculateLocalStorageSize() {
    var totalLength = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        var value = localStorage.getItem(key);
        totalLength += key.length + value.length;
    }
    // Convert to KB
    var totalSizeKB = totalLength / 1024;
    console.log("Dung lượng của localStorage", totalSizeKB.toFixed(2), "Kib/10Mib");
}
//Disable Touched
ingame.ontouchstart = (e) => {
    e.preventDefault();
}
//Button Change Adjustment
setAdjustment.addEventListener("click", function() {
    stateAdj = (stateAdj % 4) + 1;
    positionAdjustment(stateAdj);
    localStorage.setItem("stateAdj", stateAdj);
})
//Enable Some Button stopPropagation
ids.forEach(function(id) {
    var element = document.getElementById(id);
    if (element) {
        element.setAttribute("ontouchstart", "event.stopPropagation()");
    }
})
//Hover Style Enable
touchedID.forEach(function(id) {
    const button = document.getElementById(id);
    if(button) {
        if (id === 'saveStateButton' || id === 'loadStateButton') {
            button.addEventListener("touchstart", function() {
                button.classList.add("touched-1");
            });
            button.addEventListener("touchend", function() {
                button.classList.remove("touched-1");
            });
        } else {
            button.addEventListener("touchstart", function() {
                button.classList.add("touched");
            });
            button.addEventListener("touchend", function() {
                button.classList.remove("touched");
            });
        }
    }
});
//DOM Content Loaded
document.addEventListener("DOMContentLoaded", function() {
    calculateLocalStorageSize();
    if (savedStateAdj !== null) {
        stateAdj = parseInt(savedStateAdj);
        positionAdjustment(stateAdj);
    }
    ["mousedown", "touchstart"].forEach(eventType => {});
    ["mouseup", "touchend", "touchcancel"].forEach(eventType => {
        
    });
})
