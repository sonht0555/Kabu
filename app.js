var wasmAudioBuf, wasmSaveBuf, gameID, romFileName, drawContext, idata, imgFrameBuffer, scriptProcessor, audioContext
const AUDIO_BLOCK_SIZE = 1024
const AUDIO_FIFO_MAXLEN = 4900
var audioFifo0 = new Int16Array(AUDIO_FIFO_MAXLEN)
var audioFifo1 = new Int16Array(AUDIO_FIFO_MAXLEN)
var canvasVba = null
var romBuffer = -1
var isRunning = false
const wasmSaveBufLen = 0x20000 + 0x2000
var tmpSaveBuf = new Uint8Array(wasmSaveBufLen)
var frameCnt = 0
var last128FrameTime = 0
var frameSkip = 0
var audioFifoHead = 0
var audioFifoCnt = 0
var lastCheckedSaveState = 0
var turboInterval = -1
var lowLatencyMode = false
var turboMode = false
var muteMode = false
var fastForwardMode = false
var isSaveSupported = true
const fileInput = document.getElementById('romFile')
const canvas = document.getElementById('canvas')

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
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        data[i] = binaryString.charCodeAt(i);
    }
    return data;
}
function uint8ArrayToBase64(uint8Array) {
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}
function capture() {
    const image = canvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = image;
    document.body.appendChild(imgElement);
    return image;
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
function loadSave() {
    const base64 = localStorage.getItem("AW_2 Black Hole Return.sav");
    wasmSaveBuf.set(base64ToUint8Array(base64));
    console.log(base64)
    console.log("load done")
        Module._emuResetCpu()
        lastCheckedSaveState = 0
        Module._emuUpdateSavChangeFlag()
        setTimeout(() => {isRunning = true}, 500);
}
function checkSave() {
    if (!isRunning) return;
    const state = Module._emuUpdateSavChangeFlag();
    if ((lastCheckedSaveState === 1) && (state === 0)) {
        console.log('Auto saving...');
        tmpSaveBuf.set(wasmSaveBuf);
        setTimeout(() => {
            const base64String = uint8ArrayToBase64(tmpSaveBuf);
            localStorage.setItem("AW_2 Black Hole Return.sav", base64String);
            console.log('Saved!');
        }, 500);
    }
    lastCheckedSaveState = state;
}
function emuLoop() {
if (isRunning) {
    frameCnt++
    if (frameCnt % 60 == 0) {
        checkSave();
    }
    Module._emuRunFrame(vkState);
    console.log(vkState)
    drawContext = canvas.getContext('2d');
    drawContext.putImageData(idata, 0, 0);
}
}
const fpsDiv = document.getElementById('fps');

const worker = new Worker('loop.js');

worker.onmessage = (e) => {
    if (e.data === 'tick') {
        emuLoop();
    }
};
document.body.ontouchstart = (e) => {
    e.preventDefault();
}
worker.postMessage('start');

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        worker.postMessage('stop');
        isRunning = false;
    } else {
        worker.postMessage('start');
        isRunning = true;
    }
});

let vkState = 0;
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

document.addEventListener('touchstart', function preventZoom(e) {
    if (e.touches.length > 1) {
        e.preventDefault(); // Ngăn pinch zoom
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function preventDoubleTapZoom(e) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault(); // Ngăn double-tap zoom
    }
    lastTouchEnd = now;
}, false);
