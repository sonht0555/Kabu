var config = {scaleMode: 0}
var keyState = {};
const keyList = ["a", "b", "select", "start", "right", "left", 'up', 'down', 'r', 'l'];
const AUDIO_BLOCK_SIZE = 1024
const AUDIO_FIFO_MAXLEN = 4900
var audioContext
var scriptProcessor
var audioFifo0 = new Int16Array(AUDIO_FIFO_MAXLEN)
var audioFifo1 = new Int16Array(AUDIO_FIFO_MAXLEN)
var audioFifoHead = 0
var audioFifoCnt = 0
var fileInput = document.getElementById('romFile')
var canvasVba = null
var drawContext 
var romBuffer = -1
var idata
var imgFrameBuffer
var isRunning = false
var wasmAudioBuf
var wasmSaveBuf
const wasmSaveBufLen = 0x20000 + 0x2000
var tmpSaveBuf = new Uint8Array(wasmSaveBufLen)
var frameCnt = 0
var last128FrameTime = 0
var lastFrameTime = 0
var frameSkip = 0
var lowLatencyMode = false
var lastCheckedSaveState = 0
var gameID
var romFileName
var turboMode = false
var turboInterval = -1
var fastForwardMode = false
var muteMode = false
var isSaveSupported = true
if (coreState === "Vba") {
    initVK()
    emuLoop()
    canvas = document.getElementById('canvas')
}
function emuLoop() {
    window.requestAnimationFrame(emuLoop)
    emuRunFrame()
}
function emuRunFrame() {
    if (isRunning) {
        frameCnt++
        if (frameCnt % 60 == 0) {
            checkSave()
        }
        Module._emuRunFrame(getVKState());
        if (fastForwardMode) {
            Module._emuRunFrame(getVKState());
            Module._emuRunFrame(getVKState());
            Module._emuRunFrame(getVKState());
        } else if (turboMode) {
            Module._emuRunFrame(getVKState());
        }
        drawContext = canvas.getContext('2d')
        drawContext.putImageData(idata, 0, 0);
    }
}
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
        emuRunFrame();
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
    //console.log(ptr, frames)
    if (!wasmAudioBuf) {
        wasmAudioBuf = new Int16Array(Module.HEAPU8.buffer).subarray(ptr / 2, ptr / 2 + 2048)
    }
    var tail = (audioFifoHead + audioFifoCnt) % AUDIO_FIFO_MAXLEN
    if (audioFifoCnt + frames >= AUDIO_FIFO_MAXLEN) {
        //console.log('o', audioFifoCnt)
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
// ---
function startTimer() {
    let [hours, minutes, seconds, count1, count2] = [0, 0, 0, 0, 0];
    setInterval(() => {
        seconds++;
        count1++;
        count2++;
        if (seconds === 60)[seconds, minutes] = [0, minutes + 1];
        if (minutes === 60)[minutes, hours] = [0, hours + 1];
        document.getElementById("timer").textContent = `${hours}h${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}
function capture() {
    const image = canvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.src = image;
    document.body.appendChild(imgElement);
    return image;
}
function loadSave() {
    const gameName = localStorage.getItem("gameName");
    const saveName = gameName.replace(/\.(gba|gbc|gb)$/, ".sav");
    console.log(saveName);
    const base64 = localStorage.getItem(saveName);
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
function saveSave() {
    const gameName = localStorage.getItem("gameName");
    const saveName = gameName.replace(/\.(gba|gbc|gb)$/, ".sav");
    tmpSaveBuf.set(wasmSaveBuf)
    setTimeout(() => {
        const base64String = uint8ArrayToBase64(wasmSaveBuf);
        localStorage.setItem(saveName,base64String)
    }, 600);
}
function checkSave() {
    if (!isRunning) {
        return;
    }
    var state = Module._emuUpdateSavChangeFlag()
    if ((lastCheckedSaveState == 1) && (state == 0) && (isSaveSupported)) {
        console.log('Auto saving, please wait...')
        saveSave();
    }
    lastCheckedSaveState = state
}
function loadGameVBA(arrayBuffer) {
    isRunning = false
    intro.classList.add("disable");
    ingame.classList.remove("disable");
    startTimer();
    notiMessage(gameVer, 1000);
    led(parseInt(localStorage.getItem("slotStateSaved")));
    localStorage.setItem("screenSize", `0,0,${window.innerWidth - 150},${(window.innerWidth - 150) * 2 / 3}`)
    restoreArea();
    
    var u8 = new Uint8Array(arrayBuffer)
    gameID = ""
    for (var i = 0xAC; i < 0xB2; i++) {
        gameID += String.fromCharCode(u8[i])
    }
    console.log('gameID', gameID)
    Module.HEAPU8.set(u8, romBuffer)
    Module._emuLoadROM(u8.length)
    loadSave()
    Module._emuResetCpu()
    isRunning = true

}
function onFileSelected() {
    tryInitSound()
    var file = fileInput.files[0]
        romFileName = file.name
        var fileReader = new FileReader()
        fileReader.onload = function (event) {
            var arrayBuffer = event.target.result
            loadGameVBA(arrayBuffer)
        };
        fileReader.readAsArrayBuffer(file)
}
// ---
function initVK() {
    var vks = document.getElementsByClassName('vk')
    for (var i = 0; i < vks.length; i++) {
        var vk = vks[i]
        var k = vks[i].getAttribute('data-k')
        keyState[k] = [vk, 0, 0]
    }
}
function updateKeyState() {
    for (var k in keyState) {
        if (keyState[k][1] != keyState[k][2]) {
            var dom = keyState[k][0];
            keyState[k][1] = keyState[k][2];
            if (keyState[k][1]) {
                dom.classList.add('touched');
            } else {
                dom.classList.remove('touched');
            }
        }
    }
}
function handleTouch(event) {
    tryInitSound();
    for (var k in keyState) {
        keyState[k][2] = 0;
    }
    for (var i = 0; i < event.touches.length; i++) {
        var t = event.touches[i];
        var dom = document.elementFromPoint(t.clientX, t.clientY);
        if (dom) {
            var k = dom.getAttribute('data-k');
            if (k) {
                keyState[k][2] = 1;
                if (k == 'ul') {
                    keyState['up'][2] = 1;
                    keyState['left'][2] = 1;
                } else if (k == 'ur') {
                    keyState['up'][2] = 1;
                    keyState['right'][2] = 1;
                } else if (k == 'dl') {
                    keyState['down'][2] = 1;
                    keyState['left'][2] = 1;
                } else if (k == 'dr') {
                    keyState['down'][2] = 1;
                    keyState['right'][2] = 1;
                }
            }
        }
    }
    fastForwardMode = keyState['turbo'][2];
    updateKeyState();
}
function getVKState() {
    var ret = 0;
    for (var i = 0; i < 10; i++) {
        ret = ret 
        | (keyState[keyList[i]][1] << i);
    }
    return ret;
}
['touchstart', 'touchmove', 'touchend', 'touchcancel', 'touchenter', 'touchleave'].forEach((val) => {
    if (coreState === "Vba") {
    window.addEventListener(val, handleTouch)
    }
})