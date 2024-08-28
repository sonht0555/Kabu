var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status,toThrow)=>{
    throw toThrow
}
;
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
function logExceptionOnExit(e) {
    if (e instanceof ExitStatus)
        return;
    let toLog = e;
    err("exiting due to exception: " + toLog)
}
var fs;
var nodePath;
var requireNodeFS;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    requireNodeFS = ()=>{
        if (!nodePath) {
            fs = require("fs");
            nodePath = require("path")
        }
    }
    ;
    read_ = function shell_read(filename, binary) {
        requireNodeFS();
        filename = nodePath["normalize"](filename);
        return fs.readFileSync(filename, binary ? undefined : "utf8")
    }
    ;
    readBinary = filename=>{
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        return ret
    }
    ;
    readAsync = (filename,onload,onerror)=>{
        requireNodeFS();
        filename = nodePath["normalize"](filename);
        fs.readFile(filename, function(err, data) {
            if (err)
                onerror(err);
            else
                onload(data.buffer)
        })
    }
    ;
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module != "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", function(reason) {
        throw reason
    });
    quit_ = (status,toThrow)=>{
        if (keepRuntimeAlive()) {
            process["exitCode"] = status;
            throw toThrow
        }
        logExceptionOnExit(toThrow);
        process["exit"](status)
    }
    ;
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    {
        read_ = url=>{
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        }
        ;
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = url=>{
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = (url,onload,onerror)=>{
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = ()=>{
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            }
            ;
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
    setWindowTitle = title=>document.title = title
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"])
    arguments_ = Module["arguments"];
if (Module["thisProgram"])
    thisProgram = Module["thisProgram"];
if (Module["quit"])
    quit_ = Module["quit"];
var tempRet0 = 0;
var setTempRet0 = value=>{
    tempRet0 = value
}
;
var wasmBinary;
if (Module["wasmBinary"])
    wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly != "object") {
    abort("no native wasm support detected")
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort(text)
    }
}
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
    }
    var str = "";
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0)
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
    }
    return str
}
function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0))
        return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx)
                break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx)
                break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx)
                break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx)
                break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++
        } else if (c <= 2047) {
            len += 2
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i
        } else {
            len += 3
        }
    }
    return len
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 134217728;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function keepRuntimeAlive() {
    return noExitRuntime
}
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
            Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
            Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
function abort(what) {
    {
        if (Module["onAbort"]) {
            Module["onAbort"](what)
        }
    }
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
    return filename.startsWith(dataURIPrefix)
}
function isFileURI(filename) {
    return filename.startsWith("file://")
}
var wasmBinaryFile;
wasmBinaryFile = "44gba.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinary(file) {
    try {
        if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(file)
        }
        throw "both async and sync fetching of the wasm failed"
    } catch (err) {
        abort(err)
    }
}
function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                }
                return response["arrayBuffer"]()
            }).catch(function() {
                return getBinary(wasmBinaryFile)
            })
        } else {
            if (readAsync) {
                return new Promise(function(resolve, reject) {
                    readAsync(wasmBinaryFile, function(response) {
                        resolve(new Uint8Array(response))
                    }, reject)
                }
                )
            }
        }
    }
    return Promise.resolve().then(function() {
        return getBinary(wasmBinaryFile)
    })
}
function createWasm() {
    var info = {
        "a": asmLibraryArg
    };
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        wasmMemory = Module["asm"]["i"];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module["asm"]["t"];
        addOnInit(Module["asm"]["j"]);
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiationResult(result) {
        receiveInstance(result["instance"])
    }
    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            return WebAssembly.instantiate(binary, info)
        }).then(function(instance) {
            return instance
        }).then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }
    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiationResult, function(reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiationResult)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiationResult)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    98500: ($0,$1)=>{
        writeAudio($0, $1)
    }
    ,
    98524: ()=>{
        wasmReady()
    }
};
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
Module["ExitStatus"] = ExitStatus;
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        callbacks.shift()(Module)
    }
}
Module["callRuntimeCallbacks"] = callRuntimeCallbacks;
function withStackSave(f) {
    var stack = stackSave();
    var ret = f();
    stackRestore(stack);
    return ret
}
Module["withStackSave"] = withStackSave;
function demangle(func) {
    return func
}
Module["demangle"] = demangle;
function demangleAll(text) {
    var regex = /\b_Z[\w\d_]+/g;
    return text.replace(regex, function(x) {
        var y = demangle(x);
        return x === y ? x : y + " [" + x + "]"
    })
}
Module["demangleAll"] = demangleAll;
function getValue(ptr, type="i8") {
    if (type.endsWith("*"))
        type = "*";
    switch (type) {
    case "i1":
        return HEAP8[ptr >> 0];
    case "i8":
        return HEAP8[ptr >> 0];
    case "i16":
        return HEAP16[ptr >> 1];
    case "i32":
        return HEAP32[ptr >> 2];
    case "i64":
        return HEAP32[ptr >> 2];
    case "float":
        return HEAPF32[ptr >> 2];
    case "double":
        return HEAPF64[ptr >> 3];
    case "*":
        return HEAPU32[ptr >> 2];
    default:
        abort("invalid type for getValue: " + type)
    }
    return null
}
Module["getValue"] = getValue;
function handleException(e) {
    if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS
    }
    quit_(1, e)
}
Module["handleException"] = handleException;
function jsStackTrace() {
    var error = new Error;
    if (!error.stack) {
        try {
            throw new Error
        } catch (e) {
            error = e
        }
        if (!error.stack) {
            return "(no stack trace available)"
        }
    }
    return error.stack.toString()
}
Module["jsStackTrace"] = jsStackTrace;
function setValue(ptr, value, type="i8") {
    if (type.endsWith("*"))
        type = "*";
    switch (type) {
    case "i1":
        HEAP8[ptr >> 0] = value;
        break;
    case "i8":
        HEAP8[ptr >> 0] = value;
        break;
    case "i16":
        HEAP16[ptr >> 1] = value;
        break;
    case "i32":
        HEAP32[ptr >> 2] = value;
        break;
    case "i64":
        tempI64 = [value >>> 0, (tempDouble = value,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[ptr >> 2] = tempI64[0],
        HEAP32[ptr + 4 >> 2] = tempI64[1];
        break;
    case "float":
        HEAPF32[ptr >> 2] = value;
        break;
    case "double":
        HEAPF64[ptr >> 3] = value;
        break;
    case "*":
        HEAPU32[ptr >> 2] = value;
        break;
    default:
        abort("invalid type for setValue: " + type)
    }
}
Module["setValue"] = setValue;
function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"])
        js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
Module["stackTrace"] = stackTrace;
function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function __emscripten_date_now() {
    return Date.now()
}
Module["__emscripten_date_now"] = __emscripten_date_now;
function readI53FromI64(ptr) {
    return HEAPU32[ptr >> 2] + HEAP32[ptr + 4 >> 2] * 4294967296
}
Module["readI53FromI64"] = readI53FromI64;
function __localtime_js(time, tmPtr) {
    var date = new Date(readI53FromI64(time) * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(),0,1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst
}
Module["__localtime_js"] = __localtime_js;
function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret)
        stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}
Module["allocateUTF8"] = allocateUTF8;
function _tzset_impl(timezone, daylight, tzname) {
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear,0,1);
    var summer = new Date(currentYear,6,1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAP32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAPU32[tzname >> 2] = winterNamePtr;
        HEAPU32[tzname + 4 >> 2] = summerNamePtr
    } else {
        HEAPU32[tzname >> 2] = summerNamePtr;
        HEAPU32[tzname + 4 >> 2] = winterNamePtr
    }
}
Module["_tzset_impl"] = _tzset_impl;
function __tzset_js(timezone, daylight, tzname) {
    if (__tzset_js.called)
        return;
    __tzset_js.called = true;
    _tzset_impl(timezone, daylight, tzname)
}
Module["__tzset_js"] = __tzset_js;
var readAsmConstArgsArray = [];
Module["readAsmConstArgsArray"] = readAsmConstArgsArray;
function readAsmConstArgs(sigPtr, buf) {
    readAsmConstArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while (ch = HEAPU8[sigPtr++]) {
        buf += ch != 105 & buf;
        readAsmConstArgsArray.push(ch == 105 ? HEAP32[buf] : HEAPF64[buf++ >> 1]);
        ++buf
    }
    return readAsmConstArgsArray
}
Module["readAsmConstArgs"] = readAsmConstArgs;
function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}
Module["_emscripten_asm_const_int"] = _emscripten_asm_const_int;
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}
Module["_emscripten_memcpy_big"] = _emscripten_memcpy_big;
function getHeapMax() {
    return HEAPU8.length
}
Module["getHeapMax"] = getHeapMax;
function abortOnCannotGrowMemory(requestedSize) {
    abort("OOM")
}
Module["abortOnCannotGrowMemory"] = abortOnCannotGrowMemory;
function _emscripten_resize_heap(requestedSize) {
    var oldSize = HEAPU8.length;
    requestedSize = requestedSize >>> 0;
    abortOnCannotGrowMemory(requestedSize)
}
Module["_emscripten_resize_heap"] = _emscripten_resize_heap;
var printCharBuffers = [null, [], []];
Module["printCharBuffers"] = printCharBuffers;
function printChar(stream, curr) {
    var buffer = printCharBuffers[stream];
    if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0
    } else {
        buffer.push(curr)
    }
}
Module["printChar"] = printChar;
function flush_NO_FILESYSTEM() {
    if (printCharBuffers[1].length)
        printChar(1, 10);
    if (printCharBuffers[2].length)
        printChar(2, 10)
}
Module["flush_NO_FILESYSTEM"] = flush_NO_FILESYSTEM;
var SYSCALLS = {
    varargs: undefined,
    get: function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    }
};
Module["SYSCALLS"] = SYSCALLS;
function _fd_write(fd, iov, iovcnt, pnum) {
    var num = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[iov + 4 >> 2];
        iov += 8;
        for (var j = 0; j < len; j++) {
            printChar(fd, HEAPU8[ptr + j])
        }
        num += len
    }
    HEAPU32[pnum >> 2] = num;
    return 0
}
Module["_fd_write"] = _fd_write;
function _setTempRet0(val) {
    setTempRet0(val)
}
Module["_setTempRet0"] = _setTempRet0;
function _proc_exit(code) {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        if (Module["onExit"])
            Module["onExit"](code);
        ABORT = true
    }
    quit_(code, new ExitStatus(code))
}
Module["_proc_exit"] = _proc_exit;
function exitJS(status, implicit) {
    EXITSTATUS = status;
    _proc_exit(status)
}
Module["exitJS"] = exitJS;
function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}
Module["allocateUTF8OnStack"] = allocateUTF8OnStack;
function uleb128Encode(n, target) {
    if (n < 128) {
        target.push(n)
    } else {
        target.push(n % 128 | 128, n >> 7)
    }
}
Module["uleb128Encode"] = uleb128Encode;
function sigToWasmTypes(sig) {
    var typeNames = {
        "i": "i32",
        "j": "i64",
        "f": "f32",
        "d": "f64",
        "p": "i32"
    };
    var type = {
        parameters: [],
        results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
        type.parameters.push(typeNames[sig[i]])
    }
    return type
}
Module["sigToWasmTypes"] = sigToWasmTypes;
function convertJsFunctionToWasm(func, sig) {
    if (typeof WebAssembly.Function == "function") {
        return new WebAssembly.Function(sigToWasmTypes(sig),func)
    }
    var typeSectionBody = [1, 96];
    var sigRet = sig.slice(0, 1);
    var sigParam = sig.slice(1);
    var typeCodes = {
        "i": 127,
        "p": 127,
        "j": 126,
        "f": 125,
        "d": 124
    };
    uleb128Encode(sigParam.length, typeSectionBody);
    for (var i = 0; i < sigParam.length; ++i) {
        typeSectionBody.push(typeCodes[sigParam[i]])
    }
    if (sigRet == "v") {
        typeSectionBody.push(0)
    } else {
        typeSectionBody.push(1, typeCodes[sigRet])
    }
    var bytes = [0, 97, 115, 109, 1, 0, 0, 0, 1];
    uleb128Encode(typeSectionBody.length, bytes);
    bytes.push.apply(bytes, typeSectionBody);
    bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
    var module = new WebAssembly.Module(new Uint8Array(bytes));
    var instance = new WebAssembly.Instance(module,{
        "e": {
            "f": func
        }
    });
    var wrappedFunc = instance.exports["f"];
    return wrappedFunc
}
Module["convertJsFunctionToWasm"] = convertJsFunctionToWasm;
var wasmTableMirror = [];
Module["wasmTableMirror"] = wasmTableMirror;
function getWasmTableEntry(funcPtr) {
    var func = wasmTableMirror[funcPtr];
    if (!func) {
        if (funcPtr >= wasmTableMirror.length)
            wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
    }
    return func
}
Module["getWasmTableEntry"] = getWasmTableEntry;
function updateTableMap(offset, count) {
    if (functionsInTableMap) {
        for (var i = offset; i < offset + count; i++) {
            var item = getWasmTableEntry(i);
            if (item) {
                functionsInTableMap.set(item, i)
            }
        }
    }
}
Module["updateTableMap"] = updateTableMap;
var functionsInTableMap = undefined;
Module["functionsInTableMap"] = functionsInTableMap;
var freeTableIndexes = [];
Module["freeTableIndexes"] = freeTableIndexes;
function getEmptyTableSlot() {
    if (freeTableIndexes.length) {
        return freeTableIndexes.pop()
    }
    try {
        wasmTable.grow(1)
    } catch (err) {
        if (!(err instanceof RangeError)) {
            throw err
        }
        throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH."
    }
    return wasmTable.length - 1
}
Module["getEmptyTableSlot"] = getEmptyTableSlot;
function setWasmTableEntry(idx, func) {
    wasmTable.set(idx, func);
    wasmTableMirror[idx] = wasmTable.get(idx)
}
Module["setWasmTableEntry"] = setWasmTableEntry;
function addFunction(func, sig) {
    if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap;
        updateTableMap(0, wasmTable.length)
    }
    if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func)
    }
    var ret = getEmptyTableSlot();
    try {
        setWasmTableEntry(ret, func)
    } catch (err) {
        if (!(err instanceof TypeError)) {
            throw err
        }
        var wrapped = convertJsFunctionToWasm(func, sig);
        setWasmTableEntry(ret, wrapped)
    }
    functionsInTableMap.set(func, ret);
    return ret
}
Module["addFunction"] = addFunction;
function removeFunction(index) {
    functionsInTableMap.delete(getWasmTableEntry(index));
    freeTableIndexes.push(index)
}
Module["removeFunction"] = removeFunction;
var ALLOC_NORMAL = 0;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
var ALLOC_STACK = 1;
Module["ALLOC_STACK"] = ALLOC_STACK;
function allocate(slab, allocator) {
    var ret;
    if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length)
    } else {
        ret = _malloc(slab.length)
    }
    if (!slab.subarray && !slab.slice) {
        slab = new Uint8Array(slab)
    }
    HEAPU8.set(slab, ret);
    return ret
}
Module["allocate"] = allocate;
function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAPU8[ptr++ >> 0];
        if (!ch)
            return str;
        str += String.fromCharCode(ch)
    }
}
Module["AsciiToString"] = AsciiToString;
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull)
        HEAP8[buffer >> 0] = 0
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false)
}
Module["stringToAscii"] = stringToAscii;
var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
Module["UTF16Decoder"] = UTF16Decoder;
function UTF16ToString(ptr, maxBytesToRead) {
    var endPtr = ptr;
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    while (!(idx >= maxIdx) && HEAPU16[idx])
        ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr))
    } else {
        var str = "";
        for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
            var codeUnit = HEAP16[ptr + i * 2 >> 1];
            if (codeUnit == 0)
                break;
            str += String.fromCharCode(codeUnit)
        }
        return str
    }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 2)
        return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2
    }
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr
}
Module["stringToUTF16"] = stringToUTF16;
function lengthBytesUTF16(str) {
    return str.length * 2
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;
function UTF32ToString(ptr, maxBytesToRead) {
    var i = 0;
    var str = "";
    while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[ptr + i * 4 >> 2];
        if (utf32 == 0)
            break;
        ++i;
        if (utf32 >= 65536) {
            var ch = utf32 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        } else {
            str += String.fromCharCode(utf32)
        }
    }
    return str
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 4)
        return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
            var trailSurrogate = str.charCodeAt(++i);
            codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr)
            break
    }
    HEAP32[outPtr >> 2] = 0;
    return outPtr - startPtr
}
Module["stringToUTF32"] = stringToUTF32;
function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343)
            ++i;
        len += 4
    }
    return len
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;
function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
    var lastChar, end;
    if (dontAddNull) {
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end]
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull)
        HEAP8[end] = lastChar
}
Module["writeStringToMemory"] = writeStringToMemory;
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
        u8array.length = numBytesWritten;
    return u8array
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 255) {
            if (ASSERTIONS) {
                assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.")
            }
            chr &= 255
        }
        ret.push(String.fromCharCode(chr))
    }
    return ret.join("")
}
Module["intArrayToString"] = intArrayToString;
function warnOnce(text) {
    if (!warnOnce.shown)
        warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE)
            text = "warning: " + text;
        err(text)
    }
}
Module["warnOnce"] = warnOnce;
function getCFunc(ident) {
    var func = Module["_" + ident];
    return func
}
Module["getCFunc"] = getCFunc;
function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
        "string": str=>{
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        }
        ,
        "array": arr=>{
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };
    function convertReturnValue(ret) {
        if (returnType === "string") {
            return UTF8ToString(ret)
        }
        if (returnType === "boolean")
            return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0)
                    stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    function onDone(ret) {
        if (stack !== 0)
            stackRestore(stack);
        return convertReturnValue(ret)
    }
    ret = onDone(ret);
    return ret
}
Module["ccall"] = ccall;
function cwrap(ident, returnType, argTypes, opts) {
    argTypes = argTypes || [];
    var numericArgs = argTypes.every(type=>type === "number" || type === "boolean");
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
        return getCFunc(ident)
    }
    return function() {
        return ccall(ident, returnType, argTypes, arguments, opts)
    }
}
Module["cwrap"] = cwrap;
var ASSERTIONS = false;
var asmLibraryArg = {
    "g": __emscripten_date_now,
    "f": __localtime_js,
    "e": __tzset_js,
    "b": _emscripten_asm_const_int,
    "d": _emscripten_memcpy_big,
    "a": _emscripten_resize_heap,
    "h": _fd_write,
    "c": _setTempRet0
};
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["j"]).apply(null, arguments)
}
;
var _emuRunFrame = Module["_emuRunFrame"] = function() {
    return (_emuRunFrame = Module["_emuRunFrame"] = Module["asm"]["k"]).apply(null, arguments)
}
;
var _emuUpdateSavChangeFlag = Module["_emuUpdateSavChangeFlag"] = function() {
    return (_emuUpdateSavChangeFlag = Module["_emuUpdateSavChangeFlag"] = Module["asm"]["l"]).apply(null, arguments)
}
;
var _emuSetSampleRate = Module["_emuSetSampleRate"] = function() {
    return (_emuSetSampleRate = Module["_emuSetSampleRate"] = Module["asm"]["m"]).apply(null, arguments)
}
;
var _emuLoadROM = Module["_emuLoadROM"] = function() {
    return (_emuLoadROM = Module["_emuLoadROM"] = Module["asm"]["n"]).apply(null, arguments)
}
;
var _emuResetCpu = Module["_emuResetCpu"] = function() {
    return (_emuResetCpu = Module["_emuResetCpu"] = Module["asm"]["o"]).apply(null, arguments)
}
;
var _emuGetSymbol = Module["_emuGetSymbol"] = function() {
    return (_emuGetSymbol = Module["_emuGetSymbol"] = Module["asm"]["p"]).apply(null, arguments)
}
;
var _emuAddCheat = Module["_emuAddCheat"] = function() {
    return (_emuAddCheat = Module["_emuAddCheat"] = Module["asm"]["q"]).apply(null, arguments)
}
;
var _main = Module["_main"] = function() {
    return (_main = Module["_main"] = Module["asm"]["r"]).apply(null, arguments)
}
;
var ___errno_location = Module["___errno_location"] = function() {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["s"]).apply(null, arguments)
}
;
var _malloc = Module["_malloc"] = function() {
    return (_malloc = Module["_malloc"] = Module["asm"]["u"]).apply(null, arguments)
}
;
var stackSave = Module["stackSave"] = function() {
    return (stackSave = Module["stackSave"] = Module["asm"]["v"]).apply(null, arguments)
}
;
var stackRestore = Module["stackRestore"] = function() {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["w"]).apply(null, arguments)
}
;
var stackAlloc = Module["stackAlloc"] = function() {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["x"]).apply(null, arguments)
}
;
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
    return (___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = Module["asm"]["y"]).apply(null, arguments)
}
;
var dynCall_jiji = Module["dynCall_jiji"] = function() {
    return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["z"]).apply(null, arguments)
}
;
var calledRun;
dependenciesFulfilled = function runCaller() {
    if (!calledRun)
        run();
    if (!calledRun)
        dependenciesFulfilled = runCaller
}
;
function callMain(args) {
    var entryFunction = Module["_main"];
    args = args || [];
    args.unshift(thisProgram);
    var argc = args.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv >> 2;
    args.forEach(arg=>{
        HEAP32[argv_ptr++] = allocateUTF8OnStack(arg)
    }
    );
    HEAP32[argv_ptr] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exitJS(ret, true);
        return ret
    } catch (e) {
        return handleException(e)
    }
}
function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) {
        return
    }
    function doRun() {
        if (calledRun)
            return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT)
            return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"])
            Module["onRuntimeInitialized"]();
        if (shouldRunNow)
            callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"])
    shouldRunNow = false;
run();
