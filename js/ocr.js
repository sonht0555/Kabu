// --------------- import ---------------
// --------------- declaration ---------------
var scrollAmount = 0;
var scrollSpeed = 0.5;
var runCount = 0;
let isFunctionARunning = false;
var maxRunCount = 2;
let clickState = 0;
let clickTimeout;
const inputText = document.getElementById("inputText");
const inputContainer = document.getElementById("input-container");
const ID = ['A','B','R','L'];
// --------------- initialization ---------------
let Module = null;
window.addEventListener("gbaInitialized", (event) => {
    Module = event.detail.Module;
});
// --------------- function ---------------
async function getImage() {
    inputContainer.classList.add('cs22');
    canvas.style.borderRadius = "0px 0px 2.4px 2.4px";
    try {
        const gameName = localStorage.getItem("gameName");
        const screenshotName = gameName.replace(/\.(gba|gbc|gb)$/, ".png");
        await Module.screenshot(screenshotName);
        const data = Module.downloadFile(`/data/screenshots/${screenshotName}`);
        const blob = new Blob([data], {
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
            const generalRatio = Math.round(240 / (window.innerWidth - 150));
            const setArea = localStorage.getItem(`${gameName}_setArea`) || `0,0,${window.innerWidth - 150},${(window.innerWidth - 150) * 2 / 3}`;
            const [cropX, cropY, cropWidth, cropHeight] = setArea.split(',').map(Number);
            canvas.width = cropWidth * generalRatio;
            canvas.height = cropHeight * generalRatio;
            ctx.drawImage(img, cropX * generalRatio, cropY * generalRatio, cropWidth * generalRatio, cropHeight * generalRatio, 0, 0, cropWidth * generalRatio, cropHeight * generalRatio);
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
}
async function freeServer(base64data) {
    let response;
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

        response = await fetch("https://seep.eu.org/http://158.160.66.115:40000/image_to_text", {
            method: "POST",
            body: formData,
            headers: {
                'Origin': window.location.origin,
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': navigator.userAgent
            }
        });

        const data = await response.json();

        // Kiểm tra lỗi từ response và từ dữ liệu trả về
        if (!response.ok || data.type === "error") {
            const errorMessage = response.ok ? data.error.message : (response.status === 500 ? "Internal Server Error" : (await response.json()).error.message);
            throw new Error(errorMessage);
        }

        console.log(data.text);
        transLogic(data.text);

    } catch (error) {
        inputText.textContent = error.message;
        // window.location.href = "https://kabuto-d8dc06f14db0.herokuapp.com/";
        // window.location.href = "https://cors-anywhere.herokuapp.com/corsdemo";
        // window.location.href = "https://seep.eu.org/";
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

    if (countTimes >= 4950) {
        if (lastSaved && (currentMonth === lastSaved.getMonth() && currentYear === lastSaved.getFullYear())) {
            inputText.textContent = 'Used more than 4950 times. Continue using next month.';
            return;
        } else {
            countTimes = 0;
        }
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
        notiMessage(`[${newTime}] Times Azure`, 2000);
        localStorage.setItem("ApiAzure", `${apiKey},${endpoint},${newTime}`);
        localStorage.setItem("lastSavedDate", currentDate.toISOString());
    } finally {
        const newTime = ++countTimes;
        notiMessage(`[${newTime}] Times Azure`, 2000);
        isFunctionARunning = false;
        localStorage.setItem("ApiAzure", `${apiKey},${endpoint},${newTime}`);
        localStorage.setItem("lastSavedDate", currentDate.toISOString());
    }
}
async function translateText(textContent, sourceLang, targetLang) {
    const cleanData = textContent.replace(/[\r\n]+/g, ', ').replace(/([!?.,])\s*,\s*/g, '$1 ').replace(/[^\p{L}\p{N}\s.,;'"?!()]+/gu, '').replace(/ {2,}/g, ' ').trim();
    console.log(cleanData);
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
            console.log(translatedText.replace(/ {2,}/g, ' '));
            return translatedText.replace(/ {2,}/g, ' ');
        } else {
            inputText.textContent = result;
            return result;
        }
    } catch (error) {
        inputText.textContent = error.message;
        throw error;
    } finally {}
}
async function dataURItoBlob(dataURI) {
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
        console.log("Language:", detectedLanguage);
        return detectedLanguage;
    } catch (error) {
        console.error("Error detecting language:", error);
        throw error;
    }
}
async function transLogic(textContent) {
    const gameName = localStorage.getItem("gameName");
    const gameLang = localStorage.getItem(`${gameName}_gameLang`);
    if (gameLang === null) {
        const lang = await detectLanguage(textContent);
        localStorage.setItem(`${gameName}_gameLang`, lang);
        const intermediateText = await translateText(textContent, lang, 'en');
        return translateText(intermediateText, 'en', 'vi');
    } else if (gameLang === "en") {
        return translateText(textContent, "en", "vi");
    } else {
        const intermediateText = await translateText(textContent, gameLang, 'en');
        return translateText(intermediateText, 'en', 'vi');
    }
}
// --------------- processing ---------------
document.addEventListener("DOMContentLoaded", function() {
})
ID.forEach(function(id) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener("touchstart", function() {
            if (!isFunctionARunning) {
                input.classList.remove("cs22");
                canvas.style.borderRadius = "0px 0px 2px 2px";
            }
        });
    }
});
["mouseup", "touchend", "touchcancel"].forEach(eventType => {
    saveStateButton.addEventListener(eventType, () => {
        clickState++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            if (clickState === 1) {
                if (!isFunctionARunning) {
                    isFunctionARunning = true;
                    getImage();
                    logoOcr()
                }
            } else if (clickState === 3) {
                const gameName = localStorage.getItem("gameName");
                let setAreaLocal = localStorage.getItem(`${gameName}_setArea`) || `0,0,${window.innerWidth - 150},${(window.innerWidth - 150) * 2 / 3}`;
                let setArea = prompt(`${gameName}`, setAreaLocal);
                if (setArea !== null && setArea !== "") {
                    localStorage.setItem(`${gameName}_setArea`, setArea);
                }
            }
            clickState = 0;
        }, 300);
    });
});
function logoOcr() {
        var s = Math.floor(Math.random() * 3) + 1;
        var newPositionX = -15 * s + 'px';
        document.getElementById('logoOcr').style.backgroundPositionX = newPositionX;
}