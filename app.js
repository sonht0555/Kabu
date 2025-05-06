var wasmAudioBuf, wasmSaveBuf, gameID, romFileName, drawContext, idata, imgFrameBuffer, scriptProcessor, audioContext
var keyState = {};
const keyList = ["a", "b", "select", "start", "right", "left", 'up', 'down', 'r', 'l'];
var keyb = 0
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
var lastFrameTime = 0
var frameSkip = 0
var audioFifoHead = 0
var audioFifoCnt = 0
var lastCheckedSaveState = 0
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
        isRunning = false;
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
        isRunning = true;
    };
    fileReader.readAsArrayBuffer(file);
}
function loadSave() {
    const base64 = null;
    if (base64) {
        wasmSaveBuf.set(base64ToUint8Array(base64));
        console.log(base64ToUint8Array(base64))
        isRunning = true
    } else {
        isRunning = false
    }
    Module._emuResetCpu()
    lastCheckedSaveState = 0
    Module._emuUpdateSavChangeFlag()
    console.log(base64)
}
function checkSave() {
    if (!isRunning) return;
    const state = Module._emuUpdateSavChangeFlag();
    if ((lastCheckedSaveState === 1) && (state === 0)) {
        console.log('Auto saving, please wait...');
        const gameName = "AW_2 Black Hole Return.gba";
        const saveName = gameName.replace(/\.(gba|gbc|gb)$/, ".sav");
        tmpSaveBuf.set(wasmSaveBuf);
        setTimeout(() => {
            const base64String = uint8ArrayToBase64(wasmSaveBuf);
            localStorage.setItem(saveName, base64String);
            console.log('Auto saved:', base64String);
        }, 600);
    }
    lastCheckedSaveState = state;
}
function emuLoop() {
if (isRunning) {
    frameCnt++
    if (frameCnt % 60 == 0) {
        checkSave();
    }
    if (frameCnt % 128 == 0) {
        if (last128FrameTime) {
            var diff = performance.now() - last128FrameTime
            var frameInMs = diff / 128
            var fps = -1
            if (frameInMs > 0.001) {
                fps = 1000 / frameInMs
            }
            document.getElementById('fps').textContent = fps
        }
        last128FrameTime = performance.now()
    }
    lastFrameTime = performance.now()
    Module._emuRunFrame(0);
    if (fastForwardMode) {
        Module._emuRunFrame(0);
        Module._emuRunFrame(0);
        Module._emuRunFrame(0);
    } else if (turboMode) {
        Module._emuRunFrame(0);
    }
    drawContext = canvas.getContext('2d');
    drawContext.putImageData(idata, 0, 0);
}
}
let lastFrameTimez = 0;
const targetFPS = 60;
const frameDuration = 1000 / targetFPS;

function loop() {
    const now = performance.now();
    if (now - lastFrameTimez >= frameDuration) {
        emuLoop();
        lastFrameTimez = now;
    }
    window.requestAnimationFrame(loop);
}
// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", function() {
    loop();
});