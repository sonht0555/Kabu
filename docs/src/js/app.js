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
async function loadGame(gameName) {
    try {
        // Mở kết nối tới IndexedDB
        const request = indexedDB.open('/data');
        request.onsuccess = async (event) => {
            const db = event.target.result;
            const transaction = db.transaction('FILE_DATA', 'readonly');
            const objectStore = transaction.objectStore('FILE_DATA');

            // Lấy file từ IndexedDB
            const getRequest = objectStore.get(`/data/games/${gameName}`);
            getRequest.onsuccess = (e) => {
                const file = e.target.result;
                tryInitSound();
                if (file) {
                    const u8 = new Uint8Array(file.contents || file);
                    gameID = "";

                    // Lấy gameID từ ROM
                    for (let i = 0xAC; i < 0xB2; i++) {
                        gameID += String.fromCharCode(u8[i]);
                    }
                    console.log('gameID', gameID);

                    // Nạp ROM vào bộ nhớ
                    Module.HEAPU8.set(u8, romBuffer);
                    Module._emuLoadROM(u8.length);
                    loadSave();
                    Module._emuResetCpu();
                } else {
                    console.error(`Game "${gameName}" not found in IndexedDB.`);
                }
            };

            getRequest.onerror = (e) => {
                console.error('Error loading game from IndexedDB:', e.target.error);
            };
        };

        request.onerror = (e) => {
            console.error('Error opening IndexedDB:', e.target.error);
        };
    } catch (error) {
        console.error('Error in loadGame function:', error);
    }
}