var wasmAudioBuf, wasmSaveBuf, gameID, romFileName, drawContext, idata, imgFrameBuffer, scriptProcessor, audioContext
const AUDIO_BLOCK_SIZE = 1024
const AUDIO_FIFO_MAXLEN = 4900
var audioFifo0 = new Int16Array(AUDIO_FIFO_MAXLEN)
var audioFifo1 = new Int16Array(AUDIO_FIFO_MAXLEN)
var romBuffer = -1
var isRunning = false
const wasmSaveBufLen = 0x20000 + 0x2000
var tmpSaveBuf = new Uint8Array(wasmSaveBufLen)
var audioFifoHead = 0
var audioFifoCnt = 0
var lastCheckedSaveState = 0
var muteMode = false
var fastForwardMode = false
let vkState = 0
var frameCnt = 0
const fileInput = document.getElementById('romFile')
const canvas = document.getElementById('canvas')
const saveButton = document.getElementById('saveStateButton');
const loadButton = document.getElementById('loadStateButton');

// --- Core functions ---
function processAudio(event) {
    var outputBuffer = event.outputBuffer
    var audioData0 = outputBuffer.getChannelData(0)
    var audioData1 = outputBuffer.getChannelData(1)

    if ((!isRunning) || (fastForwardMode) || (muteMode)) {
        for (var i = 0; i < AUDIO_BLOCK_SIZE; i++) {
            audioData0[i] = 0
            audioData1[i] = 0
        }
        return
    }
    while (audioFifoCnt < AUDIO_BLOCK_SIZE) {
        emuLoop();
    }

    var copySize = AUDIO_BLOCK_SIZE
    if (audioFifoCnt < copySize) {
        copySize = audioFifoCnt
    }
    for (var i = 0; i < copySize; i++) {
        audioData0[i] = audioFifo0[audioFifoHead] / 32768.0
        audioData1[i] = audioFifo1[audioFifoHead] / 32768.0
        audioFifoHead = (audioFifoHead + 1) % AUDIO_FIFO_MAXLEN
        audioFifoCnt--
    }
}
function tryInitSound() {
    if (audioContext) {
        if (audioContext.state != 'running') {
            audioContext.resume()
        }
        return;
    }
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 0.0001, sampleRate: 48000 });
        scriptProcessor = audioContext.createScriptProcessor(AUDIO_BLOCK_SIZE, 0, 2)
        scriptProcessor.onaudioprocess = processAudio
        scriptProcessor.connect(audioContext.destination)

        audioContext.resume()
    } catch (e) {
        console.log(e)
        //alert('Cannnot init sound ')
    }
}
function writeAudio(ptr, frames) {
    if (fastForwardMode) {
        return
    }
    if (!wasmAudioBuf) {
        wasmAudioBuf = new Int16Array(Module.HEAPU8.buffer).subarray(ptr / 2, ptr / 2 + 2048)
    }
    var tail = (audioFifoHead + audioFifoCnt) % AUDIO_FIFO_MAXLEN
    if (audioFifoCnt + frames >= AUDIO_FIFO_MAXLEN) {
        return
    }
    for (var i = 0; i < frames; i++) {
        audioFifo0[tail] = wasmAudioBuf[i * 2]
        audioFifo1[tail] = wasmAudioBuf[i * 2 + 1]
        tail = (tail + 1) % AUDIO_FIFO_MAXLEN
    }
    audioFifoCnt += frames
}
function wasmReady() {
    romBuffer = Module._emuGetSymbol(1)
    var ptr = Module._emuGetSymbol(2)
    wasmSaveBuf = Module.HEAPU8.subarray(ptr, ptr + wasmSaveBufLen)
    ptr = Module._emuGetSymbol(3)
    imgFrameBuffer = new Uint8ClampedArray(Module.HEAPU8.buffer).subarray(ptr, ptr + 240 * 160 * 4)
    idata = new ImageData(imgFrameBuffer, 240, 160)
}
// --- Common functions ---
function capture() {
    const image = canvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = image;
    document.body.appendChild(imgElement);
    return image;
}
function emuLoop() {
    if (isRunning) {
        frameCnt++
        if (frameCnt % 120 == 0) {
            checkSave();
        }
        Module._emuRunFrame(vkState);
        drawContext = canvas.getContext('2d');
        drawContext.putImageData(idata, 0, 0);
    }
}
function loop() {
    emuLoop();
    window.requestAnimationFrame(loop);
}
function writeToIndexedDB(filePart, data) {
    const request = indexedDB.open('/data');
    request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction('FILE_DATA', 'readwrite');
        const store = transaction.objectStore('FILE_DATA');
        store.put(data, filePart);
    };
}
function readFromIndexedDB(filePart) {
    return new Promise((resolve) => {
        const request = indexedDB.open('/data');
        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction('FILE_DATA', 'readonly');
            const store = transaction.objectStore('FILE_DATA');
            const getRequest = store.get(filePart);
            getRequest.onsuccess = (e) => resolve(e.target.result);
        };
    });
}

// --- Main functions ---
function loadGameFromInput() {
    tryInitSound();
    var file = fileInput.files[0];
    romFileName = file.name;
    var fileReader = new FileReader();
    fileReader.onload = function (event) {
        var arrayBuffer = event.target.result;
        var u8 = new Uint8Array(arrayBuffer);
        gameID = "";
        for (var i = 0xAC; i < 0xB2; i++) {
            gameID += String.fromCharCode(u8[i]);
        }
        console.log('gameID', gameID);
        Module.HEAPU8.set(u8, romBuffer);
        Module._emuLoadROM(u8.length);
        loadSave();
        Module._emuResetCpu();
    };
    fileReader.readAsArrayBuffer(file);
}
async function loadSave() {
    const buf = await readFromIndexedDB('/data/states/game.sav');
    if (buf) {
        wasmSaveBuf.set(buf);
    }
    Module._emuResetCpu()
    lastCheckedSaveState = 0
    Module._emuUpdateSavChangeFlag()
    setTimeout(() => {isRunning = true}, 500);
    console.log("load done")
}
function checkSave() {
    if (!isRunning) return;
    const state = Module._emuUpdateSavChangeFlag();
    if ((lastCheckedSaveState === 1) && (state === 0)) {
        tmpSaveBuf.set(wasmSaveBuf);
        writeToIndexedDB('/data/states/game.sav', tmpSaveBuf);
    }
    lastCheckedSaveState = state;
    console.log('Auto saving...');
}
const keyMask = {
    a: 1,       // 1
    b: 2,       // 2
    select: 4,  // 4
    start: 8,   // 8
    right: 16,   // 16
    left: 32,    // 32
    up: 64,     // 64
    down: 128,    // 128
    r: 256,       // 256
    l: 512        // 512
};
function buttonPresss(key) {
  if (keyMask[key]) {
    vkState |= keyMask[key];
    tryInitSound();
  }
}
function buttonUnpresss(key) {
  if (keyMask[key]) {
    vkState &= ~keyMask[key];
  }
}
function buttonPress(buttonName, isPress) {
    if (buttonName.includes("-")) {
        const [primaryButton, secondaryButton] = buttonName.toLowerCase().split("-");
        isPress ? buttonPresss(primaryButton) : buttonUnpresss(primaryButton);
        isPress ? buttonPresss(secondaryButton) : buttonUnpresss(secondaryButton);
    } else {
        isPress ? buttonPresss(buttonName.toLowerCase()) : buttonUnpresss(buttonName.toLowerCase());
    }
}
// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", function() {
    loop();
    const dpadButtons = ["Up", "Down", "Left", "Right", "Up-left", "Up-right", "Down-left", "Down-right"];
    const otherButtons = ["A", "B", "Start", "Select", "L", "R"];
    let activeDpadTouches = new Map();
    let activeOtherTouches = new Map();

    function handleButtonPress(buttonId, isPressed) {
        if (!buttonId) return;
        buttonPress(buttonId, isPressed);
        const element = document.getElementById(buttonId);
        if (element) {
            if (isPressed) {
                element.classList.add('touched');
            } else {
                element.classList.remove('touched');
            }
        }
    }
    
    function getButtonIdFromTouch(touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const button = element?.closest("[id]");
        return button ? button.id : null;
    }
    
    document.addEventListener("touchstart", (event) => {
        for (let touch of event.changedTouches) {
            const buttonId = getButtonIdFromTouch(touch);
            if (!buttonId) continue;
            if (dpadButtons.includes(buttonId)) {
                if (activeDpadTouches.has(touch.identifier)) {
                    handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                }
                activeDpadTouches.set(touch.identifier, buttonId);
                handleButtonPress(buttonId, true);
            } else if (otherButtons.includes(buttonId)) {
                if (activeOtherTouches.has(touch.identifier)) {
                    handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                }
                activeOtherTouches.set(touch.identifier, buttonId);
                handleButtonPress(buttonId, true);
            }
        }
    });

    document.addEventListener("touchmove", (event) => {
        for (let touch of event.changedTouches) {
            const buttonId = getButtonIdFromTouch(touch);
            if (!buttonId) continue;
            
            if (dpadButtons.includes(buttonId)) {
                if (activeDpadTouches.has(touch.identifier) && activeDpadTouches.get(touch.identifier) !== buttonId) {
                    handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                    activeDpadTouches.set(touch.identifier, buttonId);
                    handleButtonPress(buttonId, true);
                }
            } else if (otherButtons.includes(buttonId)) {
                if (activeOtherTouches.has(touch.identifier) && activeOtherTouches.get(touch.identifier) !== buttonId) {
                    handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                    activeOtherTouches.set(touch.identifier, buttonId);
                    handleButtonPress(buttonId, true);
                }
            }
        }
    });
    
    document.addEventListener("touchend", (event) => {
        for (let touch of event.changedTouches) {
            if (activeDpadTouches.has(touch.identifier)) {
                handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                activeDpadTouches.delete(touch.identifier);
            }
            if (activeOtherTouches.has(touch.identifier)) {
                handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                activeOtherTouches.delete(touch.identifier);
            }
        }
    });
    
    document.addEventListener("touchcancel", (event) => {
        for (let touch of event.changedTouches) {
            if (activeDpadTouches.has(touch.identifier)) {
                handleButtonPress(activeDpadTouches.get(touch.identifier), false);
                activeDpadTouches.delete(touch.identifier);
            }
            if (activeOtherTouches.has(touch.identifier)) {
                handleButtonPress(activeOtherTouches.get(touch.identifier), false);
                activeOtherTouches.delete(touch.identifier);
            }
        }
    });
});
//----------------------------------------------------------------------------------------------------------------------
// Sử dụng các hàm trên cho saveButton và loadButton
saveButton.addEventListener('click', function() {
    const saveStateBufferPtr = Module._malloc(2000000);
    const actualSize = Module._emuSaveState(saveStateBufferPtr, 2000000);
    const saveStateDataCopy = new Uint8Array(Module.HEAPU8.buffer, saveStateBufferPtr, actualSize).slice();
    Module._free(saveStateBufferPtr);
    writeToIndexedDB('/data/states/game.ss1', saveStateDataCopy);
});
loadButton.addEventListener('click', async function() {
    const saveStateData = await readFromIndexedDB('/data/states/game.ss1');
    const dataSize = saveStateData.length;
    const loadStateBufferPtr = Module._malloc(dataSize);
    Module.HEAPU8.set(saveStateData, loadStateBufferPtr);
    Module._emuLoadState(loadStateBufferPtr, dataSize);
    Module._free(loadStateBufferPtr);
});
function loadfile(filePart) {
    const request = indexedDB.open('/data');
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('FILE_DATA')) {
            db.createObjectStore('FILE_DATA');
        }
    };
    indexedDB.open('/data').onsuccess = (e) => {
        const db = e.target.result;
        const range = IDBKeyRange.bound(filePart, filePart + '\uffff');
        db.transaction('FILE_DATA', 'readonly').objectStore('FILE_DATA').openCursor(range).onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                const key = cursor.key;
                console.log(key.substring(key.lastIndexOf('/') + 1));
                cursor.continue();
            }
        };
    };
}
loadfile('/data/states/');
//----------------------------------------------------------------------------------------------------------------------