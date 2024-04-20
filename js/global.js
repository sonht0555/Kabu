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
const ids = ['minus-shader', 'loadStateButton', 'input-container', 'saveStateButton', 'statePageButton', 'menu-pad', 'turbo', 'set-volume-range', 'minus-shader', 'shader', 'plus-shader', 'restart-game', 'slot-state', 'localStorages', 'state00', 'state01', 'state02', 'state03', 'dynamic', 'switch', 'cheatsTextArea', 'cleanCheat', 'saveCheat', 'dropboxCloud'];
const touchedID = ['saveStateButton', 'loadStateButton','restart-game','minus-shader','plus-shader','fileInputLable','openLocalStorage','upLoadFile','backToHome'];
const restart = document.getElementById("restart-game");
const shader = document.getElementById("shader");
const savedValue = localStorage.getItem("selectedShader");
// Joy Stick
var dynamic = nipplejs.create({
    zone: document.getElementById("dynamic"),
    color: "#323232",
    size: "120",
})
// Check Cache
function checkCache() {
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
    if (cacheNames.length >= 2) {
        if (confirm("A new update, do you want to update?")) {
            clearCache (); 
        }
    }
    })
    } 
}  
//Notification Message
function notiMessage(messageContent, second) {
    var message = document.getElementById("noti-mess");

    if (message.style.opacity === "0.4") {
      clearTimeout(timeoutIds);
      message.style.opacity = "0";
    }
    message.textContent = messageContent;
    message.style.opacity = "0.4";
    timeoutIds = setTimeout(() => {
      message.textContent = localStorage.getItem("gameName");
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
            paddingTop: "40px",
            rectOpacity: [0.4, 1, 1],
            GOpacity: [0, 0, 1, 0]
        },
        {
            paddingTop: "80px",
            rectOpacity: [0.4, 0.4, 1],
            GOpacity: [0, 1, 0, 0]
        },
        {
            paddingTop: "120px",
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
//Shader Setting
function applyShaderClass(selectedValue) {
    imgshader.classList.remove("sd-1", "sd-2", "sd-3", "sd-4", "sd-5", "sd-6", "sd-7", "sd-8", "sd-9", "sd-10");
    if (selectedValue === "option1") {
        imgshader.classList.add("sd-1");
    } else if (selectedValue === "option2") {
        imgshader.classList.add("sd-2");
    } else if (selectedValue === "option3") {
        imgshader.classList.add("sd-3");
    } else if (selectedValue === "option4") {
        imgshader.classList.add("sd-4");
    } else if (selectedValue === "option5") {
        imgshader.classList.add("sd-5");
    } else if (selectedValue === "option6") {
        imgshader.classList.add("sd-6");
    } else if (selectedValue === "option7") {
        imgshader.classList.add("sd-7");
    } else if (selectedValue === "option8") {
        imgshader.classList.add("sd-8");
    } else if (selectedValue === "option9") {
        imgshader.classList.add("sd-9");
    } else if (selectedValue === "option10") {
        imgshader.classList.add("sd-10");
    }
}
//Translate Function
function translateText() {
    var apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=" + encodeURIComponent(inputText.textContent);
    fetch(apiUrl).then((response) => response.json()).then((result) => {
        var translatedText = result[0][0][0];
        inputText.textContent = translatedText;
        moveCursorToEnd(inputText);
    }).catch((error) => console.error("Error:", error));
}
function moveCursorToEnd(element) {
    var range = document.createRange();
    var selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}
function handleKeyPress(event) {
    if (event.key === "Enter") {
        if (!inputText.textContent.trim()) {
            clearInput();
        } else {
            checkContent();
            translateText();
        }
    }
}
function clearInput() {
    inputText.textContent = "";
    inputText.classList.add("no-content");
}
function checkContent() {
    if (!inputText.innerHTML.trim()) {
        inputText.classList.add("no-content");
    } else {
        inputText.classList.remove("no-content");
    }
}
//Translate Focus
inputText.addEventListener("focus", function() {
    input.classList.add("cs22");
})
//Translate Input
inputText.addEventListener("input", function(event) {
    checkContent();
})
//Translate Onkeyup
inputText.onkeyup = (event) => {
    handleKeyPress(event);
}
//Translate Touchstart
input.addEventListener("touchstart", function(event) {
    var touch = event.touches[0];
    var rect = input.getBoundingClientRect();
    var quarterWidth = rect.width / 8;
    if (touch.clientX > rect.right - quarterWidth) {
        clearInput();
    }
})
//Disable Touched
ingame.ontouchstart = (e) => {
    e.preventDefault();
}
//Dropdown Shader
shader.addEventListener("change", function() {
    const selectedValue = shader.value;
    localStorage.setItem("selectedShader", selectedValue);
    applyShaderClass(selectedValue);
})
//Button Setting Shader Increase
increaseButton.addEventListener("click", function() {
    if (opacity < 1) {
        opacity += 0.05;
        localStorage.setItem("opacity", opacity);
    }
    imgshader.style.opacity = opacity;
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    notiMessage("Opacity " + opacity.toFixed(2), 1500);
})
//Button Setting Shader Decrease
decreaseButton.addEventListener("click", function() {
    if (opacity > 0.1) {
        opacity -= 0.05;
        localStorage.setItem("opacity", opacity);
    }
    imgshader.style.opacity = opacity;
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    notiMessage("Opacity " + opacity.toFixed(2), 1500);
})
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
//Button Reset
restart.addEventListener("click", function() {
    window.location.href = window.location.href;
})
//DOM Content Loaded
document.addEventListener("DOMContentLoaded", function() {
    calculateLocalStorageSize();
    imgshader.style.opacity = opacity;
    if (savedStateAdj !== null) {
        stateAdj = parseInt(savedStateAdj);
        positionAdjustment(stateAdj);
    }
    if (savedValue) {
        shader.value = savedValue;
        applyShaderClass(savedValue);
    }
    checkContent();
})