import {getModule} from "./initialize.js";
// --- declaration ---
var scrollAmount = 0;
var scrollSpeed = 0.5;
var runCount = 0;
var maxRunCount = 2;
let clickState = 0;
let clickTimeout;
const inputText = document.getElementById("inputText");
const inputContainer = document.getElementById("input-container");
// --- initialization ---
let Module = null;
window.addEventListener("gbaInitialized", (event) => {
    Module = event.detail.Module;
});
// --- function ---
async function getImage() {
    inputContainer.classList.add('cs22');
    try {
        Module.screenShot(() => {
            var screen = document.getElementById('canvas');
            var resizedCanvas = document.createElement('canvas');
            var resizedContext = resizedCanvas.getContext('2d');
            resizedCanvas.width = screen.clientWidth;
            resizedCanvas.height = screen.clientHeight;
            resizedContext.drawImage(screen, 0, 0, resizedCanvas.width, resizedCanvas.height);
            const gameName = localStorage.getItem("gameName");
            const setArea = localStorage.getItem(`${gameName}_setArea`) || '0,0,240,160';
            const [cropX, cropY, cropWidth, cropHeight] = setArea.split(',').map(Number);
            var imageData = resizedContext.getImageData(cropX, cropY, cropWidth, cropHeight);
            var croppedCanvas = document.createElement('canvas');
            var croppedContext = croppedCanvas.getContext('2d');
            croppedCanvas.width = cropWidth;
            croppedCanvas.height = cropHeight;
            croppedContext.putImageData(imageData, 0, 0);
            let dataURL = croppedCanvas.toDataURL();
            console.log(dataURL);
            var base64data = dataURL.split(',')[1];
            sendDataToServer(base64data);
        });
    } catch (error) {
        inputText.textContent = error;
    }
}
async function sendDataToServer(datas) {
    inputText.textContent = "...";
    let response;
    try {
        const imageBlob = dataURItoBlob(datas);
        const formData = new FormData();
        formData.append("image", imageBlob, "image.png");
        formData.append("user", "00c7b1f2-0d6b-4e7b-9b0b-0b6c00c7b1f2");
        //response = await fetch("https://kabuto-d8dc06f14db0.herokuapp.com/http://158.160.66.115:40000/image_to_text", {
        response = await fetch("https://cors-server.fly.dev/http://158.160.66.115:40000/image_to_text", {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("Internal Server Error");
            } else {
                const errorData = await response.json();
                const error = new Error(errorData.error.message);
                error.code = errorData.error.code;
                throw error;
            }
        }
        const data = await response.json();
        console.log(data.text)
        await translateText(data.text)
        if (data.type === "error") {
            const error = new Error(data.error.message);
            error.code = data.error.code;
            throw error;
        }
    } catch (error) {
        inputText.textContent = error.message;
       // window.location.href = "https://cors-server.fly.dev";
    } finally {}
}
async function translateText(textContent) {
    inputText.textContent = ".."
    const cleanData = textContent.replace(/[\r\n]+/g, ', ').replace(/([!?.,])\s*,\s*/g, '$1 ').replace(/[^\p{L}\p{N}\s.,;'"?!()]+/gu, '').replace(/ {2,}/g, ' ').trim();
    console.log(cleanData);
    var apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=" + encodeURIComponent(cleanData);
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("Internal Server Error");
            } else {
                const errorData = await response.json();
                const error = new Error(errorData.error.message);
                error.code = errorData.error.code;
                throw error;
            }
        }
        
        const result = await response.json();
        
        if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            var translatedText = result[0].map(sentence => sentence[0]).join(' ');
            inputText.textContent = translatedText.replace(/ {2,}/g, ' ');
            setTimeout(() => {
                startAutoScroll();
            }, 2000);
            console.log(translatedText.replace(/ {2,}/g, ' '));
        } else {
            inputText.textContent = result;
        }
    } catch (error) {
        inputText.textContent = error.message;
    } finally {}
}
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI);
    const buffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([buffer], {
        type: 'image/png'
    });
}
function autoScroll() {
    var maxScroll = inputText.scrollWidth - inputText.clientWidth;
    if (runCount >= maxRunCount) return;
    scrollAmount += scrollSpeed;
    if (scrollAmount >= maxScroll || scrollAmount <= 0) {
        scrollSpeed = -scrollSpeed;
        runCount++;
    }
    inputText.scrollLeft = scrollAmount;
    requestAnimationFrame(autoScroll);
}

function startAutoScroll() {
    scrollAmount = 0;
    runCount = 0;
    scrollSpeed = 0.5;
    autoScroll();
}
// --- processing ---
document.addEventListener("DOMContentLoaded", function() {
    ["mousedown", "touchstart"].forEach(eventType => {});
    ["mouseup", "touchend", "touchcancel"].forEach(eventType => {
        saveStateButton.addEventListener(eventType, () => {
            clickState++;
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                if (clickState === 1) {
                    getImage();
                } else if (clickState === 3) {
                    const gameName = localStorage.getItem("gameName");
                    let setAreaLocal = localStorage.getItem(`${gameName}_setArea`) || "0,0,240,160";
                    let setArea = prompt(`${gameName}`, setAreaLocal);
                    if (setArea !== null && setArea !== "") {
                        localStorage.setItem(`${gameName}_setArea`, setArea);
                    }
                }
                clickState = 0;
            }, 300);
        });
    })
})