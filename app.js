
function $id(id) {
    return document.getElementById(id);
}
if (!window.WebAssembly) {
    alert('Sorry, your browser does not support WebAssembly. :(')
}

var isIOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
var isMacOS = !!navigator.platform && /Mac/.test(navigator.platform);
if (isMacOS) {
    if (navigator.maxTouchPoints > 2) {
        // Nah, it is an iPad pretending to be a Mac
        isIOS = true
        isMacOS = false
    }
}
var isWebApp = navigator.standalone || false

var isSaveSupported = true
if (isIOS) {
    //document.getElementById('romFile').files = null;
    if (!isWebApp) {
        // On iOS Safari, the indexedDB will be cleared after 7 days. 
        // To prevent users from frustration, we don't allow savegaming on iOS unless the we are in the PWA mode.
        isSaveSupported = false
        var divIosHint = document.getElementById('ios-hint')
        divIosHint.hidden = false
        divIosHint.style = 'position: absolute; bottom: ' + divIosHint.clientHeight + 'px;'
        $id('btn-choose').hidden = true
    }
}

var muteMode = false

var config = {
    scaleMode: 0
}


function loadConfig() {
    var cfg = JSON.parse(window.localStorage['gba-config'] || '{}')
    for (var k in cfg) {
        config[k] = cfg[k]
    }
    $id('cfg-scale-mode').value = config.scaleMode
}
loadConfig()


function uiSaveConfig() {
    var newScaleMode = parseInt($id('cfg-scale-mode').value) || 0
    if (config.scaleMode != newScaleMode) {
        config.scaleMode = newScaleMode
        initVideo()
    }
    window.localStorage['gba-config'] = JSON.stringify(config)
}


var keyState = {
};
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
var canvas = null
var drawContext 
var romBuffer = -1
var idata
var imgFrameBuffer
var isRunning = false
var isWasmReady = false
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

var gbaWidth
var gbaHeight

var cheatCode


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
        //console.log('audio fifo underflow, running a new frame')
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

// must be called in user gesture
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

    isWasmReady = true
    document.getElementById('wasm-loading').hidden = true
    document.getElementById('select-rom').hidden = false

}

function initVideo() {
    console.log('init video')
    if (canvas) {
        var newCanvas = document.createElement('canvas')
        newCanvas.id = 'gba-canvas'
        canvas.replaceWith(newCanvas)
        canvas = newCanvas
    } else { 
        canvas = document.getElementById('gba-canvas')
    }
    if (config.scaleMode >= 2) {
        gpuInit()
    } else {
        drawContext = canvas.getContext('2d')
    }
    adjustSize()
}

function loadSaveGame(index, cb) {
    console.log('load', gameID, index)
    localforage.getItem('gba-' + gameID + '-save-' + index, function (err, data) {
        //console.log(err, data)
        if (data) {
            wasmSaveBuf.set(data)
            clearSaveBufState()
            cb(true)
        } else {
            clearSaveBufState()
            cb(false)
        }
    })
}

function saveSaveGame(index, cb) {
    console.log('save', gameID, index)
    tmpSaveBuf.set(wasmSaveBuf)
    localforage.setItem('gba-' + gameID + '-save-' + index, tmpSaveBuf, function (err, data) {
        cb(true)
    })
}

function savBackupBtn() {
    var blob = new Blob([wasmSaveBuf], { type: "application/binary" });
    var link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = 'save-' + gameID + '.4gs';
    link.click();
}

function toyEncrypt(src) {
    var dst = new Uint8Array(src.length)
    for (var i = 0; i < src.length; i++) {
        dst[i] = src[i] ^ 0xFB
    }
    return dst
}


async function emuBackupCloudSav() {
    var sav = await localforage.getItem('gba-' + gameID + '-save-' + 0)
    if (!sav) {
        return false;
    }
    return toyEncrypt(pako.gzip(sav))
}

async function emuRestoreCloudSav(u8Arr) {
    var sav = pako.ungzip(toyEncrypt(u8Arr))
    await localforage.setItem('gba-' + gameID + '-save-' + 0, sav)
    return true
}


function savRestoreBtn() {
    var file = document.getElementById('sav-file').files[0]
    if (file) {
        var fileReader = new FileReader()
        var fileExt = file.name.split('.').pop().toLowerCase()
        if (!((fileExt == '4gs') || (fileExt == '4gz') || (fileExt == '44gbasav') || (fileExt == 'sav'))) {
            alert('Invalid save file')
            return
        }
        fileReader.onload = function (event) {
            var arrayBuffer = event.target.result
            var u8 = new Uint8Array(arrayBuffer)
            if (fileExt == '4gz') {
                u8 = pako.ungzip(toyEncrypt(u8))
            }
            wasmSaveBuf.set(u8)
            alert('sav file loaded')
            Module._emuResetCpu()
            clearSaveBufState()
        };
        fileReader.readAsArrayBuffer(file)
    }
}

function loadRomArrayBuffer(arrayBuffer) {
    isRunning = false
    console.log(arrayBuffer)
    var u8 = new Uint8Array(arrayBuffer)
    gameID = ""
    if (u8[0xB2] != 0x96) {
        alert('Not a valid GBA ROM!')
        return
    }
    for (var i = 0xAC; i < 0xB2; i++) {
        console.log(u8[i])
        gameID += String.fromCharCode(u8[i])
    }
    if ((u8[0xAC] == 0) || (gameID.substr(0, 4) == '0000')) {
        // a homebrew! use file name as id
        gameID = romFileName
    }
    console.log('gameID', gameID)
    Module.HEAPU8.set(u8, romBuffer)
    var ret = Module._emuLoadROM(u8.length)
    document.getElementById('welcome').hidden = true
    loadSaveGame(0, function () {
        Module._emuResetCpu()
        cheatCode = localStorage['cht-' + gameID] 
        if (cheatCode) {
            $id('txt-code').value = cheatCode
            applyCheatCode()
            alert('cheat code applied')
        }     
        isRunning = true
        dpTryAutoBackup().then(function (ret) {
            if (ret) {
                showMsg('Cloud backup done.')
            }
        })
        dpGameLoaded()
    })

}

function onHomebrewListSelected() {
    if (!isWasmReady) {
        alert('WASM not ready!')
        return
    }
    tryInitSound()
    var fn = document.getElementById('homebrew-list').value
    if (fn == '') {
        return
    }
    romFileName = fn
    document.getElementById('select-rom').innerText = 'Downloading...'
    fetch('roms/' + fn + '.gba').then(function (resp) {
        resp.arrayBuffer().then(function (ab) {
            loadRomArrayBuffer(ab)
        })
    });
}

function onFileSelected() {
    if (!isWasmReady) {
        alert('WASM not ready!')
        return
    }
    tryInitSound()
    var file = fileInput.files[0]
    var fileNameLower = file.name.toLowerCase()
    if (!fileNameLower.endsWith('.gba')) {
        alert('Please select a .gba file.')
        return
    }
    if (file) {
        romFileName = file.name
        var arrayBuffer
        var fileReader = new FileReader()
        fileReader.onload = function (event) {
            var arrayBuffer = event.target.result
            loadRomArrayBuffer(arrayBuffer)
        };
        fileReader.readAsArrayBuffer(file)
    }

}


function emuRunFrame() {
    processGamepadInput()
    if (isRunning) {
        frameCnt++
        if (frameCnt % 60 == 0) {
            checkSaveBufState()
        }
        if (frameCnt % 128 == 0) {

            if (last128FrameTime) {
                var diff = performance.now() - last128FrameTime
                var frameInMs = diff / 128
                var fps = -1
                if (frameInMs > 0.001) {
                    fps = 1000 / frameInMs
                }
                console.log('fps', fps)
            }
            last128FrameTime = performance.now()

        }
        lastFrameTime = performance.now()
        Module._emuRunFrame(getVKState());
        if (fastForwardMode) {
            Module._emuRunFrame(getVKState());
            Module._emuRunFrame(getVKState());
            Module._emuRunFrame(getVKState());
        } else if (turboMode) {
            Module._emuRunFrame(getVKState());
        }
        if (config.scaleMode >= 2) {
            gpuDraw()
        } else {
            drawContext.putImageData(idata, 0, 0);
        }
    }
}


function emuLoop() {
    window.requestAnimationFrame(emuLoop)
    emuRunFrame()
}
emuLoop()



function initVK() {
    var vks = document.getElementsByClassName('vk')
    for (var i = 0; i < vks.length; i++) {
        var vk = vks[i]
        var k = vks[i].getAttribute('data-k')
        keyState[k] = [vk, 0, 0]
    }
}
initVK()

function makeVKStyle(top, left, w, h, fontSize) {
    return 'top:' + top + 'px;left:' + left + 'px;width:' + w + 'px;height:' + h + 'px;' + 'font-size:' + fontSize + 'px;line-height:' + h + 'px;'
}


function adjustVKLayout() {
    var isLandscape = window.innerWidth > window.innerHeight
    var baseSize = Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.14, 50)
    var fontSize = baseSize * 0.7
    var offTop = 0
    var offLeft = 0

    if (!isLandscape) {
        offTop = gbaHeight + baseSize
        if ((offTop + baseSize * 7) > window.innerHeight) {
            offTop = 0
        }
    }

    var vkw = baseSize * 3
    var vkh = baseSize

    keyState['l'][0].style = makeVKStyle(offTop + baseSize * 1.5, 0, vkw, vkh, fontSize)
    keyState['r'][0].style = makeVKStyle(offTop + baseSize * 1.5, window.innerWidth - vkw, vkw, vkh, fontSize)

    vkh = baseSize * 0.5
    keyState['turbo'][0].style = makeVKStyle(offTop + baseSize * 0.5, 0, vkw, vkh, fontSize)
    keyState['menu'][0].style = makeVKStyle(offTop + baseSize * 0.5, window.innerWidth - vkw, vkw, vkh, fontSize)

    vkh = baseSize
    vkw = baseSize
    offTop += baseSize * 3
    /*
    offLeft = isLandscape ? (baseSize * 1) : 0
    if (baseSize * 6 > window.innerWidth) {
        offLeft = 0
    }*/
    offLeft = 0

    keyState['up'][0].style = makeVKStyle(offTop, offLeft + vkw, vkw, vkh, fontSize)
    keyState['ul'][0].style = makeVKStyle(offTop, offLeft, vkw, vkh, fontSize)
    keyState['ur'][0].style = makeVKStyle(offTop, offLeft + vkw * 2, vkw, vkh, fontSize)
    keyState['down'][0].style = makeVKStyle(offTop + vkh * 2, offLeft + vkw, vkw, vkh, fontSize)
    keyState['dl'][0].style = makeVKStyle(offTop + vkh * 2, offLeft, vkw, vkh, fontSize)
    keyState['dr'][0].style = makeVKStyle(offTop + vkh * 2, offLeft + vkw * 2, vkw, vkh, fontSize)
    keyState['left'][0].style = makeVKStyle(offTop + vkh, offLeft + 0, vkw, vkh, fontSize)
    keyState['right'][0].style = makeVKStyle(offTop + vkh, offLeft + vkw * 2, vkw, vkh, fontSize)
    abSize = vkw * 1.3
    keyState['a'][0].style = makeVKStyle(offTop + vkh - baseSize * 0.5, window.innerWidth - abSize, abSize, abSize, fontSize)
    keyState['b'][0].style = makeVKStyle(offTop + vkh, window.innerWidth - abSize * 2.4, abSize, abSize, fontSize)

    vkh = baseSize * 0.5
    vkw = baseSize * 3

    offLeft = (window.innerWidth - vkw * 2.2) / 2
    offTop += baseSize * 3 + baseSize * 0.5
    if (isLandscape) {
        offTop = window.innerHeight - vkh
    }

    keyState['select'][0].style = makeVKStyle(offTop, offLeft, vkw, vkh, fontSize)
    keyState['start'][0].style = makeVKStyle(offTop, offLeft + vkw * 1.2, vkw, vkh, fontSize)


}

function adjustSize() {
    var gbaMaxWidth = window.innerWidth
    var gbaMaxHeight = window.innerHeight - 20
    var l = 0
    var w = gbaMaxWidth
    var h = w / 240 * 160
    if (h > gbaMaxHeight) {
        h = gbaMaxHeight
        w = h / 160 * 240
    }
    var scaleFator = (w / 240) // | 0
    gbaWidth = 240 * scaleFator
    gbaHeight = 160 * scaleFator
    l += (window.innerWidth - gbaWidth) / 2;
    var sty = 'width:' + gbaWidth + 'px;height:' + gbaHeight + 'px;left:' + l + 'px;' 
    if (config.scaleMode == 0) {
        sty += 'image-rendering:pixelated;'
    }
    canvas.style = sty
    var devicePixelRatio = window.devicePixelRatio || 1
    if (config.scaleMode >= 2) {
        canvas.width = gbaWidth * devicePixelRatio
        canvas.height = gbaHeight * devicePixelRatio
    } else {
        canvas.width = 240
        canvas.height = 160
    }
    adjustVKLayout()
}

window.onresize = adjustSize
window.onorientationchange = adjustSize


function handleTouch(event) {
    tryInitSound()
    if (!isRunning) {
        return
    }
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('vk-layer').hidden = false
    for (var k in keyState) {
        keyState[k][2] = 0
    }
    for (var i = 0; i < event.touches.length; i++) {
        var t = event.touches[i];
        var dom = document.elementFromPoint(t.clientX, t.clientY)
        if (dom) {
            var k = dom.getAttribute('data-k')
            if (k) {
                keyState[k][2] = 1
                if (k == 'ul') {
                    keyState['up'][2] = 1
                    keyState['left'][2] = 1
                } else if (k == 'ur') {
                    keyState['up'][2] = 1
                    keyState['right'][2] = 1
                } else if (k == 'dl') {
                    keyState['down'][2] = 1
                    keyState['left'][2] = 1
                } else if (k == 'dr') {
                    keyState['down'][2] = 1
                    keyState['right'][2] = 1
                }
            }
        }
    }
    if (keyState['menu'][2]) {
        setPauseMenu(true)
    }
    fastForwardMode = keyState['turbo'][2]
    for (var k in keyState) {
        if (keyState[k][1] != keyState[k][2]) {
            var dom = keyState[k][0]
            keyState[k][1] = keyState[k][2]
            if (keyState[k][1]) {
                dom.classList.add('vk-touched')
            } else {
                dom.classList.remove('vk-touched')
            }

        }
    }
}


var currentConnectedGamepad = -1
var gamePadKeyMap = {
    a: 1,
    b: 0,
    //x: 3,
    //y: 2,
    l: 4,
    r: 5,
    'select': 8,
    'start': 9,
    'up': 12,
    'down': 13,
    'left': 14,
    'right': 15
}

if (isSaveSupported) {
    window.addEventListener("gamepadconnected", function (e) {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index, e.gamepad.id,
            e.gamepad.buttons.length, e.gamepad.axes.length);
        showMsg('Gamepad connected.')
        currentConnectedGamepad = e.gamepad.index
    });
}


function processGamepadInput() {
    if (currentConnectedGamepad < 0) {
        return
    }
    var gamepad = navigator.getGamepads()[currentConnectedGamepad]
    if (!gamepad) {
        showMsg('Gamepad disconnected.')
        currentConnectedGamepad = -1
        return
    }
    for (var k in keyState) {
        keyState[k][1] = 0
    }
    for (var k in gamePadKeyMap) {
        var btn = gamePadKeyMap[k]
        if (gamepad.buttons[btn].pressed) {
            keyState[k][1] = 1
        }
    }
    // Axes
    if (gamepad.axes[0] < -0.5) {
        keyState['left'][1] = 1
    } else if (gamepad.axes[0] > 0.5) {
        keyState['right'][1] = 1
    }
    if (gamepad.axes[1] < -0.5) {
        keyState['up'][1] = 1
    } else if (gamepad.axes[1] > 0.5) {
        keyState['down'][1] = 1
    }
}


/*
        // dunno why, but we should do that first on iOS
        window.ontouchstart = function() {
 
        };
        window.ontouchstart = handleTouch;
        window.ontouchmove = handleTouch;
        window.ontouchcancel = handleTouch;
        window.ontouchend = handleTouch;*/

//'touchcancel', , 'touchforcechange'
['touchstart', 'touchmove', 'touchend', 'touchcancel', 'touchenter', 'touchleave'].forEach((val) => {
    window.addEventListener(val, handleTouch)
})

document.getElementById('vk-layer').ontouchstart = (e) => {
    e.preventDefault()
}



function getVKState() {
    var ret = 0;
    for (var i = 0; i < 10; i++) {
        ret = ret | (keyState[keyList[i]][1] << i);
    }
    return ret;
}

function convertKeyCode(keyCode) {
    // const keyList = ["a", "b", "select", "start", "right", "left", 'up', 'down', 'r', 'l'];
    const keymap = [88, 90, 16, 13, 39, 37, 38, 40, 87, 81] // z x shift enter right left up down w q
    for (var i = 0; i < 10; i++) {
        if (keyCode == keymap[i]) {
            return i
        }
    }
    return -1
}

document.onkeydown = function (e) {
    tryInitSound()
    if (!isRunning) {
        return
    }
    e.preventDefault()

    var k = convertKeyCode(e.keyCode)
    if (k >= 0) {
        keyState[keyList[k]][1] = 1
    }
}

document.onkeyup = function (e) {
    if (!isRunning) {
        return
    }
    e.preventDefault()
    var k = convertKeyCode(e.keyCode)
    if (k >= 0) {
        keyState[keyList[k]][1] = 0
    }
    if (e.keyCode == 27) {
        setPauseMenu(true)
    }
}

function checkSaveBufState() {
    if (!isRunning) {
        return;
    }
    var state = Module._emuUpdateSavChangeFlag()
    //console.log(state)
    if ((lastCheckedSaveState == 1) && (state == 0) && (isSaveSupported)) {
        showMsg('Auto saving, please wait...')
        saveSaveGame(0, function () {
            console.log('save done')
        })
    }
    lastCheckedSaveState = state
}

function clearSaveBufState() {
    lastCheckedSaveState = 0
    Module._emuUpdateSavChangeFlag()
}


function showMsg(msg) {
    document.getElementById('msg-text').innerText = msg
    document.getElementById('msg-layer').hidden = false
    setTimeout(function () {
        document.getElementById('msg-layer').hidden = true
    }, 1000)
}


function setPauseMenu(t) {
    t = t ? true : false
    isRunning = !t
    document.getElementById('pause-menu').hidden = !t
    if (!t) {
        uiSaveConfig()
    }
}

function chtSaveBtn() {
    var inputText = $id('txt-code').value.trim()
    // Save cheat code
    var cheatCode = filterCheatCode(inputText)
    localStorage['cht-' + gameID] = cheatCode
    $id('txt-code').value = cheatCode
    alert('Cheat code saved.\nRestart the app to apply.')
}

localforage.ready().then(function () { }).catch(function (err) {
    alert('Save storage not supported: ' + err);
})


function applyCheatCode() {
    var ptrGBuf = Module._emuGetSymbol(4)
    var gbuf = Module.HEAPU8.subarray(ptrGBuf, ptrGBuf + 0x1000)
    var lines = cheatCode.split('\n')
    var textEnc = new TextEncoder()
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        if (line.length == 0) {
            continue
        }
        if (line.length == 12) {
            line = line.substr(0, 8) + ' ' + line.substr(8, 4)
        }
        var lineBuf = textEnc.encode(line)
        console.log(lineBuf.length)
        gbuf.set(lineBuf)
        gbuf[lineBuf.length] = 0
        console.log(Module._emuAddCheat(ptrGBuf))
    }
}

$id('txt-code').placeholder = 'Cheat code:\nGamesharkAdv: XXXXXXXX YYYYYYYY\nCodeBreaker: XXXXXXXX YYYY'

function filterCheatCode(code) {
    var lines = code.toUpperCase().split('\n')
    var ret = ''
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim().replace(/ /g, '')
        if ((line.length != 16) && (line.length != 12)) {
            continue
        }
        // Check if it's a hex string
        if (line.match(/[^0-9A-F]/)) {
            continue
        }
        ret += line + '\n'
    }
    return ret.trim()
}

function chtWriteBtn() {
    var addr = parseInt(document.getElementById('cht-addr').value)
    if (!addr) {
        alert('Invalid addr'); return
    }
    Module._writeU32(addr,
        parseInt(document.getElementById('cht-value').value))


}

function chtReadBtn() {
    var addr = parseInt(document.getElementById('cht-addr').value)
    if (!addr) {
        alert('Invalid addr'); return
    }
    var val = Module._readU32(addr) >>> 0
    document.getElementById('cht-value').value = '0x' + val.toString(16)
}

window.addEventListener("gamepadconnected", function (e) {
    console.log("Gamepad connected")
});

$id('cfg-turbo').onchange = function () {
    turboMode = !!this.checked
}

$id('cfg-mute').onchange = function () {
    muteMode = !!this.checked
}

var lang = navigator.language || 'unknown';

if ((lang == 'ja')) {
    // Hide cheat ui
    $id('div-cht').hidden = true
}

if (location.origin == 'https://gba.44670.org') {
    if (isSaveSupported) {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function (reg) {
                // registration worked
                console.log('Registration succeeded. Scope is ' + reg.scope);
            }).catch(function (error) {
                // registration failed
                console.log('Registration failed with ' + error);
            });
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('sw msg', event);
                if (event.data.msg) {
                    $id('title').innerText = event.data.msg
                }
            });
        }
    }
    (function () {

        var cnt = 0;
        // Prompt to install PWA
        window.onbeforeinstallprompt = function (e) {
            cnt += 1;
            if (cnt > 2) {
                return;
            }
            console.log('Before install prompt', e);
            e.preventDefault();
            var deferredPrompt = e;
            window.onclick = function (e) {
                deferredPrompt.prompt();
                window.onclick = null;
            }
        };
    })();
}


/** @type {WebGLRenderingContext} */

var vertShaderSource = `
    precision mediump float;
    attribute vec2 a_position; //(0,0)-(1,1)
    varying vec2 v_texCoord; //(0,0)-(1,1)
    
    void main() {
        // Convert a_position to gl_Position
        gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0, 1);
        v_texCoord = a_position;
    }
`;
var fragShaderSource = `


    
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define COMPAT_PRECISION mediump
#else
#define COMPAT_PRECISION
#endif

#if __VERSION__ >= 130
#define COMPAT_VARYING in
#define COMPAT_TEXTURE texture
out COMPAT_PRECISION vec4 FragColor;
#else
#define COMPAT_VARYING varying
#define FragColor gl_FragColor
#define COMPAT_TEXTURE texture2D
#endif

precision mediump float;
uniform sampler2D u_image; 
varying vec2 v_texCoord; 
uniform vec2 u_outResolution;
uniform vec2 u_inResolution;

#define Source u_image
#define vTexCoord v_texCoord

#define SourceSize vec4(u_inResolution, 1.0 / u_inResolution) 
#define OutSize vec4(u_outResolution, 1.0 / u_outResolution)

#define BLEND_NONE 0
#define BLEND_NORMAL 1
#define BLEND_DOMINANT 2
#define LUMINANCE_WEIGHT 1.0
#define EQUAL_COLOR_TOLERANCE 30.0/255.0
#define STEEP_DIRECTION_THRESHOLD 2.2
#define DOMINANT_DIRECTION_THRESHOLD 3.6

float DistYCbCr(vec3 pixA, vec3 pixB)
{
  const vec3 w = vec3(0.2627, 0.6780, 0.0593);
  const float scaleB = 0.5 / (1.0 - w.b);
  const float scaleR = 0.5 / (1.0 - w.r);
  vec3 diff = pixA - pixB;
  float Y = dot(diff.rgb, w);
  float Cb = scaleB * (diff.b - Y);
  float Cr = scaleR * (diff.r - Y);

  return sqrt(((LUMINANCE_WEIGHT * Y) * (LUMINANCE_WEIGHT * Y)) + (Cb * Cb) + (Cr * Cr));
}

bool IsPixEqual(const vec3 pixA, const vec3 pixB)
{
  return (DistYCbCr(pixA, pixB) < EQUAL_COLOR_TOLERANCE);
}

float get_left_ratio(vec2 center, vec2 origin, vec2 direction, vec2 scale)
{
  vec2 P0 = center - origin;
  vec2 proj = direction * (dot(P0, direction) / dot(direction, direction));
  vec2 distv = P0 - proj;
  vec2 orth = vec2(-direction.y, direction.x);
  float side = sign(dot(P0, orth));
  float v = side * length(distv * scale);

//  return step(0, v);
  return smoothstep(-sqrt(2.0)/2.0, sqrt(2.0)/2.0, v);
}

#define eq(a,b)  (a == b)
#define neq(a,b) (a != b)

#define P(x,y) COMPAT_TEXTURE(Source, coord + SourceSize.zw * vec2(x, y)).rgb

void main()
{
  //---------------------------------------
  // Input Pixel Mapping:  -|x|x|x|-
  //                       x|A|B|C|x
  //                       x|D|E|F|x
  //                       x|G|H|I|x
  //                       -|x|x|x|-

  vec2 scale = OutSize.xy * SourceSize.zw;
  vec2 pos = fract(vTexCoord * SourceSize.xy) - vec2(0.5, 0.5);
  vec2 coord = vTexCoord - pos * SourceSize.zw;

  vec3 A = P(-1.,-1.);
  vec3 B = P( 0.,-1.);
  vec3 C = P( 1.,-1.);
  vec3 D = P(-1., 0.);
  vec3 E = P( 0., 0.);
  vec3 F = P( 1., 0.);
  vec3 G = P(-1., 1.);
  vec3 H = P( 0., 1.);
  vec3 I = P( 1., 1.);

  // blendResult Mapping: x|y|
  //                      w|z|
  ivec4 blendResult = ivec4(BLEND_NONE,BLEND_NONE,BLEND_NONE,BLEND_NONE);

  // Preprocess corners
  // Pixel Tap Mapping: -|-|-|-|-
  //                    -|-|B|C|-
  //                    -|D|E|F|x
  //                    -|G|H|I|x
  //                    -|-|x|x|-
  if (!((eq(E,F) && eq(H,I)) || (eq(E,H) && eq(F,I))))
  {
    float dist_H_F = DistYCbCr(G, E) + DistYCbCr(E, C) + DistYCbCr(P(0,2), I) + DistYCbCr(I, P(2.,0.)) + (4.0 * DistYCbCr(H, F));
    float dist_E_I = DistYCbCr(D, H) + DistYCbCr(H, P(1,2)) + DistYCbCr(B, F) + DistYCbCr(F, P(2.,1.)) + (4.0 * DistYCbCr(E, I));
    bool dominantGradient = (DOMINANT_DIRECTION_THRESHOLD * dist_H_F) < dist_E_I;
    blendResult.z = ((dist_H_F < dist_E_I) && neq(E,F) && neq(E,H)) ? ((dominantGradient) ? BLEND_DOMINANT : BLEND_NORMAL) : BLEND_NONE;
  }


  // Pixel Tap Mapping: -|-|-|-|-
  //                    -|A|B|-|-
  //                    x|D|E|F|-
  //                    x|G|H|I|-
  //                    -|x|x|-|-
  if (!((eq(D,E) && eq(G,H)) || (eq(D,G) && eq(E,H))))
  {
    float dist_G_E = DistYCbCr(P(-2.,1.)  , D) + DistYCbCr(D, B) + DistYCbCr(P(-1.,2.), H) + DistYCbCr(H, F) + (4.0 * DistYCbCr(G, E));
    float dist_D_H = DistYCbCr(P(-2.,0.)  , G) + DistYCbCr(G, P(0.,2.)) + DistYCbCr(A, E) + DistYCbCr(E, I) + (4.0 * DistYCbCr(D, H));
    bool dominantGradient = (DOMINANT_DIRECTION_THRESHOLD * dist_D_H) < dist_G_E;
    blendResult.w = ((dist_G_E > dist_D_H) && neq(E,D) && neq(E,H)) ? ((dominantGradient) ? BLEND_DOMINANT : BLEND_NORMAL) : BLEND_NONE;
  }

  // Pixel Tap Mapping: -|-|x|x|-
  //                    -|A|B|C|x
  //                    -|D|E|F|x
  //                    -|-|H|I|-
  //                    -|-|-|-|-
  if (!((eq(B,C) && eq(E,F)) || (eq(B,E) && eq(C,F))))
  {
    float dist_E_C = DistYCbCr(D, B) + DistYCbCr(B, P(1.,-2.)) + DistYCbCr(H, F) + DistYCbCr(F, P(2.,-1.)) + (4.0 * DistYCbCr(E, C));
    float dist_B_F = DistYCbCr(A, E) + DistYCbCr(E, I) + DistYCbCr(P(0.,-2.), C) + DistYCbCr(C, P(2.,0.)) + (4.0 * DistYCbCr(B, F));
    bool dominantGradient = (DOMINANT_DIRECTION_THRESHOLD * dist_B_F) < dist_E_C;
    blendResult.y = ((dist_E_C > dist_B_F) && neq(E,B) && neq(E,F)) ? ((dominantGradient) ? BLEND_DOMINANT : BLEND_NORMAL) : BLEND_NONE;
  }

  // Pixel Tap Mapping: -|x|x|-|-
  //                    x|A|B|C|-
  //                    x|D|E|F|-
  //                    -|G|H|-|-
  //                    -|-|-|-|-
  if (!((eq(A,B) && eq(D,E)) || (eq(A,D) && eq(B,E))))
  {
    float dist_D_B = DistYCbCr(P(-2.,0.), A) + DistYCbCr(A, P(0.,-2.)) + DistYCbCr(G, E) + DistYCbCr(E, C) + (4.0 * DistYCbCr(D, B));
    float dist_A_E = DistYCbCr(P(-2.,-1.), D) + DistYCbCr(D, H) + DistYCbCr(P(-1.,-2.), B) + DistYCbCr(B, F) + (4.0 * DistYCbCr(A, E));
    bool dominantGradient = (DOMINANT_DIRECTION_THRESHOLD * dist_D_B) < dist_A_E;
    blendResult.x = ((dist_D_B < dist_A_E) && neq(E,D) && neq(E,B)) ? ((dominantGradient) ? BLEND_DOMINANT : BLEND_NORMAL) : BLEND_NONE;
  }

  vec3 res = E;

  // Pixel Tap Mapping: -|-|-|-|-
  //                    -|-|B|C|-
  //                    -|D|E|F|x
  //                    -|G|H|I|x
  //                    -|-|x|x|-
  if(blendResult.z != BLEND_NONE)
  {
    float dist_F_G = DistYCbCr(F, G);
    float dist_H_C = DistYCbCr(H, C);
    bool doLineBlend = (blendResult.z == BLEND_DOMINANT ||
                !((blendResult.y != BLEND_NONE && !IsPixEqual(E, G)) || (blendResult.w != BLEND_NONE && !IsPixEqual(E, C)) ||
                  (IsPixEqual(G, H) && IsPixEqual(H, I) && IsPixEqual(I, F) && IsPixEqual(F, C) && !IsPixEqual(E, I))));

    vec2 origin = vec2(0.0, 1.0 / sqrt(2.0));
    vec2 direction = vec2(1.0, -1.0);
    if(doLineBlend)
    {
      bool haveShallowLine = (STEEP_DIRECTION_THRESHOLD * dist_F_G <= dist_H_C) && neq(E,G) && neq(D,G);
      bool haveSteepLine = (STEEP_DIRECTION_THRESHOLD * dist_H_C <= dist_F_G) && neq(E,C) && neq(B,C);
      origin = haveShallowLine? vec2(0.0, 0.25) : vec2(0.0, 0.5);
      direction.x += haveShallowLine? 1.0: 0.0;
      direction.y -= haveSteepLine? 1.0: 0.0;
    }

    vec3 blendPix = mix(H,F, step(DistYCbCr(E, F), DistYCbCr(E, H)));
    res = mix(res, blendPix, get_left_ratio(pos, origin, direction, scale));
  }

  // Pixel Tap Mapping: -|-|-|-|-
  //                    -|A|B|-|-
  //                    x|D|E|F|-
  //                    x|G|H|I|-
  //                    -|x|x|-|-
  if(blendResult.w != BLEND_NONE)
  {
    float dist_H_A = DistYCbCr(H, A);
    float dist_D_I = DistYCbCr(D, I);
    bool doLineBlend = (blendResult.w == BLEND_DOMINANT ||
                !((blendResult.z != BLEND_NONE && !IsPixEqual(E, A)) || (blendResult.x != BLEND_NONE && !IsPixEqual(E, I)) ||
                  (IsPixEqual(A, D) && IsPixEqual(D, G) && IsPixEqual(G, H) && IsPixEqual(H, I) && !IsPixEqual(E, G))));

    vec2 origin = vec2(-1.0 / sqrt(2.0), 0.0);
    vec2 direction = vec2(1.0, 1.0);
    if(doLineBlend)
    {
      bool haveShallowLine = (STEEP_DIRECTION_THRESHOLD * dist_H_A <= dist_D_I) && neq(E,A) && neq(B,A);
      bool haveSteepLine  = (STEEP_DIRECTION_THRESHOLD * dist_D_I <= dist_H_A) && neq(E,I) && neq(F,I);
      origin = haveShallowLine? vec2(-0.25, 0.0) : vec2(-0.5, 0.0);
      direction.y += haveShallowLine? 1.0: 0.0;
      direction.x += haveSteepLine? 1.0: 0.0;
    }
    origin = origin;
    direction = direction;

    vec3 blendPix = mix(H,D, step(DistYCbCr(E, D), DistYCbCr(E, H)));
    res = mix(res, blendPix, get_left_ratio(pos, origin, direction, scale));
  }

  // Pixel Tap Mapping: -|-|x|x|-
  //                    -|A|B|C|x
  //                    -|D|E|F|x
  //                    -|-|H|I|-
  //                    -|-|-|-|-
  if(blendResult.y != BLEND_NONE)
  {
    float dist_B_I = DistYCbCr(B, I);
    float dist_F_A = DistYCbCr(F, A);
    bool doLineBlend = (blendResult.y == BLEND_DOMINANT ||
                !((blendResult.x != BLEND_NONE && !IsPixEqual(E, I)) || (blendResult.z != BLEND_NONE && !IsPixEqual(E, A)) ||
                  (IsPixEqual(I, F) && IsPixEqual(F, C) && IsPixEqual(C, B) && IsPixEqual(B, A) && !IsPixEqual(E, C))));

    vec2 origin = vec2(1.0 / sqrt(2.0), 0.0);
    vec2 direction = vec2(-1.0, -1.0);

    if(doLineBlend)
    {
      bool haveShallowLine = (STEEP_DIRECTION_THRESHOLD * dist_B_I <= dist_F_A) && neq(E,I) && neq(H,I);
      bool haveSteepLine  = (STEEP_DIRECTION_THRESHOLD * dist_F_A <= dist_B_I) && neq(E,A) && neq(D,A);
      origin = haveShallowLine? vec2(0.25, 0.0) : vec2(0.5, 0.0);
      direction.y -= haveShallowLine? 1.0: 0.0;
      direction.x -= haveSteepLine? 1.0: 0.0;
    }

    vec3 blendPix = mix(F,B, step(DistYCbCr(E, B), DistYCbCr(E, F)));
    res = mix(res, blendPix, get_left_ratio(pos, origin, direction, scale));
  }

  // Pixel Tap Mapping: -|x|x|-|-
  //                    x|A|B|C|-
  //                    x|D|E|F|-
  //                    -|G|H|-|-
  //                    -|-|-|-|-
  if(blendResult.x != BLEND_NONE)
  {
    float dist_D_C = DistYCbCr(D, C);
    float dist_B_G = DistYCbCr(B, G);
    bool doLineBlend = (blendResult.x == BLEND_DOMINANT ||
                !((blendResult.w != BLEND_NONE && !IsPixEqual(E, C)) || (blendResult.y != BLEND_NONE && !IsPixEqual(E, G)) ||
                  (IsPixEqual(C, B) && IsPixEqual(B, A) && IsPixEqual(A, D) && IsPixEqual(D, G) && !IsPixEqual(E, A))));

    vec2 origin = vec2(0.0, -1.0 / sqrt(2.0));
    vec2 direction = vec2(-1.0, 1.0);
    if(doLineBlend)
    {
      bool haveShallowLine = (STEEP_DIRECTION_THRESHOLD * dist_D_C <= dist_B_G) && neq(E,C) && neq(F,C);
      bool haveSteepLine  = (STEEP_DIRECTION_THRESHOLD * dist_B_G <= dist_D_C) && neq(E,G) && neq(H,G);
      origin = haveShallowLine? vec2(0.0, -0.25) : vec2(0.0, -0.5);
      direction.x -= haveShallowLine? 1.0: 0.0;
      direction.y += haveSteepLine? 1.0: 0.0;
    }

    vec3 blendPix = mix(D,B, step(DistYCbCr(E, B), DistYCbCr(E, D)));
    res = mix(res, blendPix, get_left_ratio(pos, origin, direction, scale));
  }

 	FragColor = vec4(res, 1.0);
} `

var gl = null;
var program
var outResolutionUniformLocation

function gpuDraw() {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, idata);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(outResolutionUniformLocation, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function gpuInit() {
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Create shader.
    program = gl.createProgram();
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertShader, vertShaderSource);
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(vertShader);
    gl.compileShader(fragShader);
    // Check if compilation succeeded.
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        alert("Error in vertex shader: " + gl.getShaderInfoLog(vertShader));
        return;
    }
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        alert("Error in fragment shader: " + gl.getShaderInfoLog(fragShader));
        return;
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Error in program: " + gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);
    // Create texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Use nearest neighbor interpolation.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // Create vertex buffer, a rectangle to (0,0)-(width,height).
    var vertices = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1
    ]);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // Create attribute.
    var positionAttribLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    // Set uniform.
    outResolutionUniformLocation = gl.getUniformLocation(program, "u_outResolution");
    var inResolutionUniformLocation = gl.getUniformLocation(program, "u_inResolution");
    gl.uniform2f(inResolutionUniformLocation, 240, 160);
}
initVideo()




var DP_BASE_PATH = "/vbasav"
var DP_EXT = ".4gz"

function dpGetCurrentDayInt() {
    // yyyymmdd
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var retInt = year * 10000 + month * 100 + day;
    return retInt;
}



function dpIsConnected() {
    return localStorage['d-token'] ? true : false
}

async function dpIDHash(gameID) {
    if (!localStorage['d-id']) {
        throw "Not connected"
    }
    // Using SHA256
    var inputData = localStorage['d-id'] + ',' + gameID
    var hash = await window.crypto.subtle.digest('SHA-256', new TextEncoder("utf-8").encode(inputData))
    var digestHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
    return digestHex.substring(0, 8)
}


async function dpGameLoaded() {
    if (dpIsConnected()) {
        var hash = await dpIDHash(gameID)
        $id('span-cloud-id').innerText = hash
    }
}


async function dpConnect() {
    var redirectUri = encodeURIComponent(location.origin)
    var url = "https://www.dropbox.com/oauth2/authorize?client_id=zro5k6xlnsxu4gz&response_type=code&token_access_type=offline"
    url += "&redirect_uri=" + redirectUri
    location.href = url
}


async function dpCheckUser() {
    var resp = await fetch('https://api.dropboxapi.com/2/check/user', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage['d-token'],
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: "foo" })
    })
    var obj = await resp.text()
    console.log(obj)
}

async function dpUploadFile(path, u8Arr, mode) {
    mode = mode || "overwrite"
    var uploadArg = JSON.stringify({
        "autorename": true,
        "mode": mode,
        "mute": true,
        "strict_conflict": false,
        "path": path,
    })
    var blob = new Blob([u8Arr], { type: "application/octet-stream" })
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage['d-token'],
                'Dropbox-API-Arg': uploadArg,
                'Content-Type': 'application/octet-stream'
            },
            body: blob
        })
        console.log("status: ", resp.status)
        // Check http status.
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken()
                if (!ret) {
                    throw "Unable to refresh token"
                }
                continue
            }
            else {
                throw "Upload failed, unknown http status: " + resp.status
            }
        } else {
            var obj = await resp.json()
            console.log(obj)
            return obj
        }
    }
    return false
}

async function dpDownloadFile(path) {
    var downloadArg = JSON.stringify({
        "path": path,
    })
    for (var retry = 0; retry < 2; retry++) {
        var resp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + localStorage['d-token'],
                "Dropbox-API-Arg": downloadArg,
            }
        })
        console.log("status: ", resp.status)
        if (resp.status != 200) {
            if (resp.status == 401) {
                var ret = await dpRefreshToken()
                if (!ret) {
                    throw "Unable to refresh token"
                }
                continue
            }
            else {
                throw "Download failed, unknown http status: " + resp.status
            }
        }
        // Get result from header
        var obj = JSON.parse(resp.headers.get("dropbox-api-result"))
        console.log(obj)
        // Get result from body
        var u8Arr = await resp.arrayBuffer()
        return new Uint8Array(u8Arr)
    }
    return false
}

async function dpOnLoad() {
    if (location.search.startsWith("?code=")) {
        var code = location.search.slice(6)
        var resp = await fetch("https://c.44670.org/d", {
            method: "POST",
            body: "1," + location.origin + "," + code,
        })
        var obj = await resp.json()
        if (!obj.error) {
            localStorage['d-token'] = obj.token
            localStorage['d-token-r'] = obj.tokenr
            localStorage['d-id'] = obj.id
            alert("Dropbox connected.")
            location.href = location.origin
        } else {
            alert(obj.error)
        }
    }
    document.getElementById('btn-dp-connect').innerText = (dpIsConnected() ? "Disconnect" : "Connect") + " Dropbox"
}

async function dpRefreshToken() {
    console.log("Refreshing token...")
    if (!localStorage['d-token-r']) {
        throw "No refresh token"
    }
    var resp = await fetch("https://c.44670.org/d", {
        method: "POST",
        body: "2," + location.origin + "," + localStorage['d-token-r'],
    })
    var obj = await resp.json()
    if (!obj.error) {
        localStorage['d-token'] = obj.token
        return true
    } else {
        alert("Failed to update DropBox token: " + obj.error)
    }
    return false
}

async function dpGetPath(gameID, tag) {
    var hash = await dpIDHash(gameID)
    var path = DP_BASE_PATH + "/" + hash + "/" + tag + DP_EXT
    return path
}

async function dpTryUploadCloudSave(gameID, tag, u8Arr, mode) {
    if (!dpIsConnected()) {
        return false
    }
    var path = await dpGetPath(gameID, tag)
  
    try {
        var resp = await dpUploadFile(path, u8Arr, mode)
        return resp
    } catch (e) {
        alert("Failed to upload cloud save: " + e)
        return false
    }
    return false
}




async function dpTryAutoBackup() {
    if (!dpIsConnected()) {
        return false
    }
    var sav = await emuBackupCloudSav()
    if (sav === false) {
        return false
    }
    var nowDay = '' + dpGetCurrentDayInt()
    if (localStorage['d-last-' + gameID] == nowDay) {
        return false
    }
    var ret = await dpTryUploadCloudSave(gameID, "auto-" + dpGetCurrentDayInt(), sav , "add")
    if (ret) {
        localStorage['d-last-' + gameID] = nowDay
        return true
    }
    return false
}




function dpOnConnectButtonClicked() {
    if (dpIsConnected()) {
        if (confirm("Are you sure to disconnect from Dropbox?")) {
            localStorage['d-token'] = ""
            localStorage['d-token-r'] = ""
            localStorage['d-id'] = ""
            alert("Dropbox disconnected.")
            location.href = location.origin
        }
    } else {
        dpConnect()
    }
}

async function dpManualBtn(isUpload) {

    if (!dpIsConnected()) {
        alert("Please connect to Dropbox first.")
        return
    }
    if (!gameID)  {
        alert("Please load a game first.")
        return
    }
    var choice = window.confirm("Are you sure to " + (isUpload ? "↑ upload" : "↓ download") + " cloud save?")
    if (!choice) {
        return
    }
    try {
        if (isUpload) {
            var sav = await emuBackupCloudSav()
            if (sav === false) {
                alert("No save data to upload.")
                return
            }
            var ret = await dpTryUploadCloudSave(gameID, "manual", sav , "overwrite")
            if (ret) {
                alert("Uploaded successfully.")
            } else {
                alert("Failed to upload.")
            }
        } else {
            var path = await dpGetPath(gameID, "manual")
            var u8Arr = await dpDownloadFile(path)
            if (!u8Arr) {
                alert("Failed to download.")
                return
            }
            if (u8Arr.length < 1) {
                alert("No cloud save found.")
                return
            }
            if (await emuRestoreCloudSav(u8Arr)) {
                alert("Downloaded successfully.")
                setTimeout(function () {
                    location.reload()
                }, 1000)
            } else {
                alert("Failed to download.")
            }
        }
    } catch (e) {
        alert("Error:" + e)
        return
    }
}

dpOnLoad()