import * as Main from './main.js';
/* --------------- Declaration --------------- */
var scrollAmount = 0;
var scrollSpeed = 0.5;
var runCount = 0;
let isFunctionARunning = false;
var maxRunCount = 2;
let clickTurbo = 0
let clickTimeout;
const inputText = document.getElementById("inputText");
const input = document.getElementById("input-container");
const turbo = document.getElementById("turbo");
const ID = ['A', 'B', 'R', 'L'];
/* --------------- Function ------------------ */
async function getImage() {
    turbo.classList.add('turbo-ocr');
    try {
        const screenshotName = gameName.replace(/\.(gba|gbc|gb|zip)$/, ".png");
        const file = await Main.captureOCR(screenshotName);
        const blob = new Blob([file], {
            type: 'image/png'
        });
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const resolutionFactor = 4;
            let generalRatio;
            if (gameName.endsWith(".gbc") || gameName.endsWith(".gb")) {
                generalRatio = Math.round(160 / (window.innerWidth - 230));
            } else {
                generalRatio = Math.round(240 / (window.innerWidth - 150));
            }
            const setArea = localStorage.getItem(`${gameName}_setArea`) || localStorage.getItem("screenSize");
            const [cropX, cropY, cropWidth, cropHeight] = setArea.split(',').map(Number);
            canvas.width = cropWidth * generalRatio * resolutionFactor;
            canvas.height = cropHeight * generalRatio * resolutionFactor;
            ctx.drawImage(
                img,
                cropX * generalRatio,                               
                cropY * generalRatio,                               
                cropWidth * generalRatio,                           
                cropHeight * generalRatio,                          
                0,                                                  
                0,                                                  
                cropWidth * generalRatio * resolutionFactor,       
                cropHeight * generalRatio * resolutionFactor        
            );
            const base64data = canvas.toDataURL("image/png").split(',')[1];
            const ApiAzure = localStorage.getItem("ApiAzure");
            if (ApiAzure) {
                azureServer(base64data);
            } else {
                freeServer(base64data);
            }
        };
    } catch (error) {
        inputText.textContent = error.message;
    }
    if (clickTimeout) {
        clearTimeout(clickTimeout);
    }
    clickTimeout = setTimeout(() => {
        document.getElementById("inputText").textContent = "..."
    }, 30000);
}
async function freeServer(base64data) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 1;
        if (progress <= 100) {
            inputText.textContent = `Waiting..${progress}%`;
        }
    }, 100);

    try {
        const imageBlob = dataURItoBlob(base64data);
        const formData = new FormData();
        formData.append("image", imageBlob, "image.png");
        formData.append("user", "00c7b1f2-0d6b-4e7b-9b0b-0b6c00c7b1f2");
        let response;
        try {
            response = await fetch("https://cors-anywhere.herokuapp.com/http://158.160.66.115:40000/image_to_text", {
                method: "POST",
                body: formData,
                headers: {
                    'Origin': window.location.origin,
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': navigator.userAgent
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

        } catch (fetchError) {
            console.warn("Cors-controlers have not been activated.");
            window.location.href = "https://cors-anywhere.herokuapp.com/corsdemo";
            return;
        }
        const data = await response.json();
        if (data.type === "error") {
            throw new Error(data.error.message);
        }
        transLogic(data.text);

    } catch (error) {
        inputText.textContent = error.message;
    } finally {
        clearInterval(interval);
        isFunctionARunning = false;
    }
}
async function azureServer(base64data) {
    inputText.textContent = '...';
    const ApiAzure = localStorage.getItem("ApiAzure");
    let [apiKey, endpoint, countTimes] = ApiAzure.split(',');
    countTimes = parseInt(countTimes);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastSavedDate = localStorage.getItem("lastSavedDate");
    const lastSaved = lastSavedDate ? new Date(lastSavedDate) : null;
    if (lastSaved && (currentMonth !== lastSaved.getMonth() || currentYear !== lastSaved.getFullYear())) {
        countTimes = 0;
        localStorage.setItem("lastSavedDate", currentDate.toISOString());
    }
    if (countTimes >= 4950) {
        inputText.textContent = 'Used more than 4950 times. Continue using next month.';
        return;
    }
    try {
        const response = await fetch(`${endpoint}imageanalysis:analyze?features=caption,read&model-version=latest&api-version=2024-02-01`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/octet-stream',
            },
            body: dataURItoBlob(base64data)
        });
        const data = await response.json();
        if (!response.ok || data.type === "error") {
            const errorMessage = response.ok ? data.error.message : (response.status === 500 ? "500 Internal Server Error" : (await response.json()).error.message);
            throw new Error(errorMessage);
        }
        const readResult = data.readResult.blocks[0];
        const lines = readResult.lines || [];
        const text = lines.map(line => line.text).join('\n');
        transLogic(text);
    } catch (error) {
        inputText.textContent = error.message;
        const newTime = ++countTimes;
        Main.notiMessage(`[${newTime}] Times Azure`, 2000);
        localStorage.setItem("ApiAzure", `${apiKey},${endpoint},${newTime}`);
        localStorage.setItem("lastSavedDate", currentDate.toISOString());
    } finally {
        const newTime = ++countTimes;
        Main.notiMessage(`[${newTime}] Times Azure`, 2000);
        isFunctionARunning = false;
        localStorage.setItem("ApiAzure", `${apiKey},${endpoint},${newTime}`);
        localStorage.setItem("lastSavedDate", currentDate.toISOString());
    }
}
async function translateText(textContent, sourceLang, targetLang) {
    const cleanData = textContent.replace(/[\r\n]+/g, ', ').replace(/([!?.,])\s*,\s*/g, '$1 ').replace(/[^\p{L}\p{N}\s.,;'"?!()]+/gu, '').replace(/ {2,}/g, ' ').trim();
    var apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=` + encodeURIComponent(cleanData);
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
            return translatedText.replace(/ {2,}/g, ' ');
        } else {
            inputText.textContent = result;
            return result;
        }
    } catch (error) {
        inputText.textContent = error.message;
        throw error;
    }
}
async function autoScroll() {
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
async function startAutoScroll() {
    scrollAmount = 0;
    runCount = 0;
    scrollSpeed = 0.5;
    autoScroll();
}
async function detectLanguage(textContent) {
    var apiUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=ld&q=" + encodeURIComponent(textContent);
    try {
        const response = await fetch(apiUrl);
        const result = await response.json();
        var detectedLanguage = result[8][0][0];
        return detectedLanguage;
    } catch (error) {
        console.error("Error detecting language:", error);
        throw error;
    }
}
async function transLogic(textContent) {
    const gameLang = "en"
    if (gameLang === null) {
        const lang = await detectLanguage(textContent);
        const intermediateText = await translateText(textContent, lang, 'en');
        return translateText(intermediateText, 'en', 'vi');
    } else if (gameLang === "en") {
        return translateText(textContent, "en", "vi");
    } else {
        const intermediateText = await translateText(textContent, gameLang, 'en');
        return translateText(intermediateText, 'en', 'vi');
    }
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
function logoOcr() {
    var s = Math.floor(Math.random() * 3) + 1;
    var newPositionX = -15 * s + 'px';
    document.getElementById('logoOcr').style.backgroundPositionX = newPositionX;
}
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    ID.forEach(function(id) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener("touchstart", function() {
                if (!isFunctionARunning) {
                    turbo.classList.remove('turbo-ocr');
                }
            });
        }
    });
    ["touchend"].forEach(eventType => {
        turbo.addEventListener(eventType, () => {
            clickTurbo++;
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                if (clickTurbo === 1) {
                    if (!isFunctionARunning) {
                        isFunctionARunning = true;
                        getImage();
                        logoOcr()
                    }
                }
                clickTurbo = 0;
            }, 300);
        });
        areaSet.addEventListener(eventType, () => {
            areaTrans.classList.toggle("visible");
        })
    });
})
