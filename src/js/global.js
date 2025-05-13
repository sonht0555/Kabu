/* --------------- Declaration --------------- */
appVer.textContent = gameVer
let gameName;
var messageTimeout;
let stateAdj = 1;
var lockNotiTime;
let clientWidth;
let upscaleShader = 3;
let integerScaling
let systemType;
let gameWidth;
let gameHeight;
const bufferCanvas = document.getElementById("canvas");
let opacity = parseFloat(localStorage.getItem("opacity")) || 0.1;
const errorLogElements = document.getElementsByClassName('errorLog');
const ingame = document.getElementById("in-game");
const input = document.getElementById("inputText");
const romList = document.getElementById("rom-list");
const romInput = document.getElementById("fileInput");
const setAdjustment = document.getElementById("setAdjustment");
const savedStateAdj = localStorage.getItem("stateAdj");
const rewind = document.getElementById("rewind")
const ids = ['inputText', 'stateDiv00', 'stateDiv01', 'stateDiv02', 'stateDiv03', 'stateDiv04', 'stateDiv05', 'stateDiv06', 'stateDiv07', ];
const touchedID = ['saveStateButton', 'loadStateButton', 'openLocalStorage', 'upLoadFile', 'backToHome', 'rewind'];
const canvasContainer = document.getElementById("canvas-container")
const imgShader = document.getElementById("img-shader")
const settingContainer = document.querySelectorAll(".setting-container")
const messageContainer = document.querySelectorAll(".message-container")
const stateTitle = document.querySelectorAll(".stateTitle, .stateDate")
const textured = document.getElementById("textured")
/* --------------- Function ------------------ */
// Joy Stick
var dynamicZone = document.getElementById("dynamic");
var nippleOptions = {
    zone: dynamicZone,
    color: "#2F2F2F",
    size: 120
};
var dynamic = nipplejs.create(nippleOptions);
// Position Adjustment
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
// Disable Touched
ingame.ontouchstart = (e) => {
    e.preventDefault();
}
// Button Change Adjustment
setAdjustment.addEventListener("click", function() {
    stateAdj = (stateAdj % 4) + 1;
    positionAdjustment(stateAdj);
    localStorage.setItem("stateAdj", stateAdj);
})
// Enable Some Button stopPropagation
ids.forEach(function(id) {
    var element = document.getElementById(id);
    if (element) {
        element.setAttribute("ontouchstart", "event.stopPropagation()");
    }
})
// Hover Style Enable
touchedID.forEach(function(id) {
    const button = document.getElementById(id);
    if (button) {
        if (id === 'saveStateButton' || id === 'loadStateButton') {
            button.addEventListener("touchstart", function() {
                button.classList.add("touched-1");
            });
            button.addEventListener("touchend", function() {
                button.classList.remove("touched-1");
            });
        } else if (id === 'rewind') {
            button.addEventListener("touchstart", function() {
                button.classList.add("touched-2");
            });
            button.addEventListener("touchend", function() {
                button.classList.remove("touched-2");
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
// Resize Area Translate
interact('#resizable-draggable')
    .resizable({
        edges: {
            top: true,
            left: true,
            right: true,
            bottom: true
        },
        modifiers: [
            interact.modifiers.restrictEdges({
                outer: 'parent'
            }),
            interact.modifiers.restrictSize({
                min: {
                    width: 50,
                    height: 20
                }
            })
        ],
        listeners: {
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;
                target.style.width = event.rect.width + 'px';
                target.style.height = event.rect.height + 'px';
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                localStorage.setItem(`${gameName}_setArea`, `${x.toFixed(0)},${y.toFixed(0)},${event.rect.width.toFixed(0)},${event.rect.height.toFixed(0)}`);
                console.log(localStorage.getItem(`${gameName}_setArea`));
            }
        }
    });
// Restore Area Translate
function restoreArea() {
    const savedState = localStorage.getItem(`${gameName}_setArea`) || localStorage.getItem("screenSize")
    if (savedState) {
        const [x, y, width, height] = savedState.split(',').map(Number);
        const target = document.getElementById('resizable-draggable');
        areaTrans = document.getElementById("areaTrans");
        if (areaTrans.offsetWidth < width) {
            target.style.width = areaTrans.offsetWidth + 'px';
        } else {
            target.style.width = width + 'px';
        }
        if (areaTrans.offsetHeight < height) {
            target.style.height = areaTrans.offsetHeight + 'px';
        } else {
            target.style.height = height + 'px';
        }
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }
}
// Delay Time
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Led
async function led(slotStateNumbers) {
    try {
        const ledInfo = [
            { id: "led01", color: "rgba(245, 232, 209, 0.14)" },
            { id: "led02", color: "rgba(245, 232, 209, 0.14)" },
            { id: "led03", color: "rgba(245, 232, 209, 0.14)" },
        ];

        if (slotStateNumbers >= 1 && slotStateNumbers <= ledInfo.length) {
            const activeColor = "#20A5A6";
            ledInfo.forEach((led, index) => {
                document.getElementById(led.id).style.fill = (index + 1 === slotStateNumbers) ? activeColor : led.color;
            });
        }
    } catch (error) {
        console.error("Error Led:", error);
    }
}
// Format Date Time
function formatDateTime(milliseconds) {
    const date = new Date(milliseconds);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${hours}:${minutes} ${day}.${month}`;
}
// File to 64base 
async function fileToBase64(data) {
    const blob = new Blob([data], { type: 'image/png' });
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return base64;
}
// Lock Notification
 async function lockNoti(title, detail, second) {
    const lockNoti = document.getElementById("lockNoti");
    const notiTitle = document.getElementById("notiTitle");
    const notiDetail = document.getElementById("notiDetail");
    if (lockNotiTime) {
        clearTimeout(lockNotiTime);
    }
    notiTitle.textContent = title;
    notiDetail.textContent = detail;
    lockNoti.classList.remove("visible");
    lockNotiTime = setTimeout(() => {
        lockNoti.classList.add("visible");
    }, second);
}
// log Message
function logMessage(type, message) {
    if (errorLogElements.length > 0) {
        const errorLogElement = errorLogElements[0];
        const messageElement = document.createElement("div");
        messageElement.innerText = `[${type}] ${message}\n---\n`;
        errorLogElement.appendChild(messageElement);
        errorLogElement.scrollTop = errorLogElement.scrollHeight;
        setTimeout(() => {
            if (messageElement && messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 60000);
    }
}
function setupStyle() {
    const dpr = window.devicePixelRatio;
    clientWidth = document.documentElement.clientWidth;
    if (gameName.slice(-3) === "gbc") {
        gameWidth = 160;
        gameHeight = 144;
        gameStride = 256;
        upscaleShader = 3;
        integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
        localStorage.setItem("screenSize", `0,0,${ gameWidth*(integerScaling/dpr)},${gameHeight*(integerScaling/dpr)}`)
        console.log(localStorage.getItem("screenSize"));
    } else {
        gameWidth = 240;
        gameHeight = 160;
        gameStride = 240;
        upscaleShader = 3;
        integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
        localStorage.setItem("screenSize", `0,0,${gameWidth*(integerScaling/dpr)},${gameHeight*(integerScaling/dpr)}`)
        console.log(localStorage.getItem("screenSize"));
    }
        integerScaling = (Math.floor((clientWidth * dpr) / gameWidth));
        bufferCanvas.style.transformOrigin = "top center";
        bufferCanvas.style.imageRendering = "pixelated";
        bufferCanvas.style.imageRendering = "crisp-edges";
        canvasContainer.style.width = `${gameWidth * (integerScaling / dpr)}px`;
        canvasContainer.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        textured.style.width = `${gameWidth * (integerScaling / dpr)}px`;
        textured.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        imgShader.style.transform = `scale(${integerScaling / dpr/  upscaleShader})`;
        settingContainer.forEach(function(element) {
            element.style.width = `${gameWidth * (integerScaling / dpr)}px`;
            element.style.height = `${gameHeight * (integerScaling / dpr)}px`;
        });
        messageContainer.forEach(function(element) {
            element.style.width = `${gameWidth}px`;
            element.style.height = `${gameHeight}px`;
            element.style.zoom = `${integerScaling / dpr}`;
        });
        stateTitle.forEach(function(element) {
            element.classList.remove("fefs")
        });
    imgShader.style.width = `${gameWidth * upscaleShader}px`;
    imgShader.style.height = `${gameHeight * upscaleShader}px`;
    imgShader.style.transformOrigin = "top center";
    imgShader.style.setProperty('--bg-size', `${upscaleShader}px ${upscaleShader}px`);
}
window.onerror = function (message, source, lineno) {
    const fileName = source ? source.split('/').pop() : 'unknown source';
    const cleanMessage = message.replace(/^(Uncaught\s(?:ReferenceError|Error|TypeError|SyntaxError|RangeError):?\s*)/i, '');
    const errorMessage = `[Err] [${lineno}] ../${fileName} | ${cleanMessage}.`;
    logMessage("Error", errorMessage);
    return false;
};
const originalConsoleError = console.error;
console.error = function (...args) {
    originalConsoleError.apply(console, args);
    logMessage("Err", args.join(" "));
};
const originalConsoleWarn = console.warn;
console.warn = function (...args) {
    originalConsoleWarn.apply(console, args);
    logMessage("Warn", args.join(" "));
};
// List File
function listFiles(filePart) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('/data');
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('FILE_DATA')) {
                db.createObjectStore('FILE_DATA');
            }
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            const range = IDBKeyRange.bound(`/data/${filePart}`, `/data/${filePart}` + '\uffff');
            const transaction = db.transaction('FILE_DATA', 'readonly');
            const objectStore = transaction.objectStore('FILE_DATA');
            const files = [];
            objectStore.openCursor(range).onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const key = cursor.key;
                    const fileName = key.substring(key.lastIndexOf('/') + 1);
                    // Lọc bỏ trường hợp fileName === filePart (ví dụ: 'games')
                    if (fileName && fileName !== filePart) {
                        files.push(fileName);
                    }
                    cursor.continue();
                } else {
                    resolve(files);
                }
            };
            objectStore.openCursor(range).onerror = (e) => {
                reject(e);
            };
        };
        request.onerror = (e) => {
            reject(e);
        };
    });
}
// File Size
function sizeFiles(filePart) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('/data');
        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction('FILE_DATA', 'readonly');
            const objectStore = transaction.objectStore('FILE_DATA');
            const getRequest = objectStore.get(filePart);
            getRequest.onsuccess = (e) => {
                const file = e.target.result;
                if (!file) {
                    resolve(null);
                } else if (file.size !== undefined) {
                    resolve(file.size);
                } else if (file.contents && file.contents.byteLength !== undefined) {
                    resolve(file.contents.byteLength);
                } else if (file.data && file.data.size !== undefined) {
                    resolve(file.data.size);
                } else if (file.byteLength !== undefined) {
                    resolve(file.byteLength);
                } else {
                    resolve(null);
                }
            };
            getRequest.onerror = (e) => {
                reject(e);
            };
        };
        request.onerror = (e) => {
            reject(e);
        };
    });
}
function editFiles(filePart, newName) {
    const lastSlash = filePart.lastIndexOf('/');
    const newKey = filePart.substring(0, lastSlash + 1) + newName;
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('/data');
        dbRequest.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction('FILE_DATA', 'readwrite');
            const store = transaction.objectStore('FILE_DATA');
            store.get(filePart).onsuccess = (event) => {
                const data = event.target.result;
                if (data) {
                    store.put(data, newKey).onsuccess = () => {
                        store.delete(filePart).onsuccess = () => {
                            resolve();
                        };
                    };
                } else {
                    resolve();
                }
            };
        };
        dbRequest.onerror = reject;
    });
}
function deleteFiles(fileKey) {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('/data');
        dbRequest.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction('FILE_DATA', 'readwrite');
            const store = transaction.objectStore('FILE_DATA');
            store.delete(fileKey).onsuccess = () => resolve();
            store.delete(fileKey).onerror = reject;
        };
        dbRequest.onerror = reject;
    });
}
function downloadFiles(fileKey, fileName) {
    const request = indexedDB.open('/data');
    request.onsuccess = ({ target: { result: db } }) => {
        db.transaction('FILE_DATA', 'readonly')
            .objectStore('FILE_DATA')
            .get(fileKey).onsuccess = ({ target: { result: file } }) => {
                if (file) {
                    const blob = new Blob([file.contents || file], { type: 'application/octet-stream' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    link.click();
                    URL.revokeObjectURL(link.href);
                }
            };
    };
};
/* --------------- DOMContentLoaded ---------- */
document.addEventListener("DOMContentLoaded", function() {
    if (savedStateAdj !== null) {
        stateAdj = parseInt(savedStateAdj);
        positionAdjustment(stateAdj);
    }
    ["touchend","click"].forEach(eventType => {
        romInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                gameName = fileInput.files[0].name;
                console.log(gameName);
                localStorage.setItem("lastGameName",gameName)
            }
        })
        romList.addEventListener(eventType, (event) => {
            const clickedElement = event.target;
            if (clickedElement.classList.contains("game-item")) {
            gameName = clickedElement.textContent;
            console.log(gameName);
            localStorage.setItem("lastGameName",gameName)
        }
        })
    });
})