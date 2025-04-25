var mGBA = (() => {
  var _scriptName = import.meta.url;

  return (
      async function(moduleArg = {}) {
          var moduleRtn;

          var Module = moduleArg;
          var readyPromiseResolve, readyPromiseReject;
          var readyPromise = new Promise((resolve, reject) => {
              readyPromiseResolve = resolve;
              readyPromiseReject = reject
          });
          var ENVIRONMENT_IS_WEB = typeof window == "object";
          var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
          var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
          var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && self.name?.startsWith("em-pthread");
          Module.loadGame = (romPath, savePathOverride) => {
              const loadGame = cwrap("loadGame", "number", ["string", "string"]);
              if (loadGame(romPath, savePathOverride)) {
                  const arr = romPath.split(".");
                  arr.pop();
                  const saveName = arr.join(".") + ".sav";
                  Module.gameName = romPath;
                  Module.saveName = savePathOverride ?? saveName.replace("/data/games/", "/data/saves/");
                  return true
              }
              return false
          };
          Module.SDL2 = () => {
              var SDL2 = Module["SDL2"];
              if (SDL2.audioContext.state === "suspended" || SDL2.audioContext.state === "interrupted") {
                  SDL2.audioContext.resume()
              }
          };
          Module.editFileName = (filepath, filename, newFilename) => FS.rename(filepath, filepath.replace(filename, newFilename));
          Module.deleteFile = filepath => FS.unlink(filepath);
          Module.fileSize = filepath => FS.stat(filepath).size;
          Module.downloadFile = filepath => FS.readFile(filepath);
          Module.listFiles = name => FS.readdir(`/data/${name}/`);
          Module.getSave = () => FS.readFile(Module.saveName);
          Module.FSInit = () => new Promise((resolve, reject) => {
              FS.mkdir("/data");
              FS.mount(FS.filesystems.IDBFS, {}, "/data");
              FS.syncfs(true, err => {
                  if (err) {
                      reject(new Error(`Error syncing app data from IndexedDB: ${err}`))
                  }
                  try {
                      FS.mkdir("/data/saves")
                  } catch (e) {}
                  try {
                      FS.mkdir("/data/states")
                  } catch (e) {}
                  try {
                      FS.mkdir("/data/games")
                  } catch (e) {}
                  try {
                      FS.mkdir("/data/cheats")
                  } catch (e) {}
                  try {
                      FS.mkdir("/data/screenshots")
                  } catch (e) {}
                  try {
                      FS.mkdir("/data/patches")
                  } catch (e) {}
                  resolve()
              })
          });
          Module.FSSync = () => new Promise((resolve, reject) => {
              FS.syncfs(err => {
                  if (err) {
                      reject(new Error(`Error syncing app data to IndexedDB: ${err}`))
                  }
                  resolve()
              })
          });
          Module.filePaths = () => ({
              root: "/data",
              cheatsPath: "/data/cheats",
              gamePath: "/data/games",
              savePath: "/data/saves",
              saveStatePath: "/data/states",
              screenshotsPath: "/data/screenshots",
              patchPath: "/data/patches"
          });
          Module.uploadAll = (file, callback) => {
              const split = file.name.split(".");
              if (split.length < 2) {
                  console.warn("unrecognized file extension: " + file.name);
                  return
              }
              const extension = split[split.length - 1].toLowerCase();
              let dir = null;
              if (extension == "sav") {
                  dir = "/data/saves/"
              } else if (extension.startsWith("ss")) {
                  dir = "/data/states/"
              } else if (extension.startsWith("png")) {
                  dir = "/data/screenshots/"
              } else if (extension.startsWith("cheats")) {
                  dir = "/data/cheats/"
              } else if (["gba", "gbc", "gb", "zip", "7z"].includes(extension)) {
                  dir = "/data/games/"
              } else if (["ips", "ups", "bps"].includes(extension)) {
                  dir = "/data/patches/"
              } else {
                  console.warn("unrecognized file extension: " + extension);
                  return
              }
              const reader = new FileReader;
              reader.onload = e => {
                  FS.writeFile(dir + file.name, new Uint8Array(e.target.result));
                  if (callback) {
                      callback()
                  }
              };
              reader.readAsArrayBuffer(file)
          };
          Module.uploadRom = (file, callback) => {
              const split = file.name.split(".");
              if (split.length < 2) {
                  console.warn("unrecognized file extension: " + file.name);
                  return
              }
              const extension = split[split.length - 1].toLowerCase();
              let dir = null;
              if (["gba", "gbc", "gb", "zip", "7z"].includes(extension)) {
                  dir = "/data/games/"
              } else {
                  console.warn("unrecognized file extension: " + extension);
                  return
              }
              const reader = new FileReader;
              reader.onload = e => {
                  FS.writeFile(dir + file.name, new Uint8Array(e.target.result));
                  if (callback) {
                      callback()
                  }
              };
              reader.readAsArrayBuffer(file)
          };
          Module.uploadCheats = (file, callback) => {
              const split = file.name.split(".");
              if (split.length < 2) {
                  console.warn("unrecognized file extension: " + file.name);
                  return
              }
              const extension = split[split.length - 1].toLowerCase();
              let dir = null;
              if (extension == "cheats") {
                  dir = "/data/cheats/"
              } else {
                  console.warn("unrecognized file extension: " + extension);
                  return
              }
              const reader = new FileReader;
              reader.onload = e => {
                  FS.writeFile(dir + file.name, new Uint8Array(e.target.result));
                  if (callback) {
                      callback()
                  }
              };
              reader.readAsArrayBuffer(file)
          };
          Module.uploadPatch = (file, callback) => {
              const split = file.name.split(".");
              if (split.length < 2) {
                  console.warn("unrecognized file extension: " + file.name);
                  return
              }
              const extension = split[split.length - 1].toLowerCase();
              let dir = null;
              if (["ips", "ups", "bps"].includes(extension)) {
                  dir = "/data/patches/"
              } else {
                  console.warn("unrecognized file extension: " + extension);
                  return
              }
              const reader = new FileReader;
              reader.onload = e => {
                  FS.writeFile(dir + file.name, new Uint8Array(e.target.result));
                  if (callback) {
                      callback()
                  }
              };
              reader.readAsArrayBuffer(file)
          };
          const keyBindings = new Map([
              ["a", 0],
              ["b", 1],
              ["select", 2],
              ["start", 3],
              ["right", 4],
              ["left", 5],
              ["up", 6],
              ["down", 7],
              ["r", 8],
              ["l", 9]
          ]);
          Module.buttonPress = name => {
              const buttonPress = cwrap("buttonPress", null, ["number"]);
              buttonPress(keyBindings.get(name.toLowerCase()))
          };
          Module.buttonUnpress = name => {
              const buttonUnpress = cwrap("buttonUnpress", null, ["number"]);
              buttonUnpress(keyBindings.get(name.toLowerCase()))
          };
          Module.bindKey = (bindingName, inputName) => {
              const bindKey = cwrap("bindKey", null, ["string", "number"]);
              bindKey(bindingName, keyBindings.get(inputName.toLowerCase()))
          };
          Module.pauseGame = () => {
              const pauseGame = cwrap("pauseGame", null, []);
              pauseGame()
          };
          Module.resumeGame = () => {
              const resumeGame = cwrap("resumeGame", null, []);
              resumeGame()
          };
          Module.getVolume = () => {
              const getVolume = cwrap("getVolume", "number", []);
              return getVolume()
          };
          Module.setVolume = percent => {
              const setVolume = cwrap("setVolume", null, ["number"]);
              setVolume(percent)
          };
          Module.getMainLoopTimingMode = () => {
              const getMainLoopTimingMode = cwrap("getMainLoopTimingMode", "number", []);
              return getMainLoopTimingMode()
          };
          Module.getMainLoopTimingValue = () => {
              const getMainLoopTimingValue = cwrap("getMainLoopTimingValue", "number", []);
              return getMainLoopTimingValue()
          };
          Module.setMainLoopTiming = (mode, value) => {
              const setMainLoopTiming = cwrap("setMainLoopTiming", "number", ["number", "number"]);
              setMainLoopTiming(mode, value)
          };
          Module.quitGame = () => {
              const quitGame = cwrap("quitGame", null, []);
              quitGame()
          };
          Module.quitMgba = () => {
              const quitMgba = cwrap("quitMgba", null, []);
              quitMgba()
          };
          Module.quickReload = () => {
              const quickReload = cwrap("quickReload", null, []);
              quickReload()
          };
          Module.toggleInput = toggle => {
              const setEventEnable = cwrap("setEventEnable", null, ["boolean"]);
              setEventEnable(toggle)
          };
          Module.screenshot = fileName => {
              const screenshot = cwrap("screenshot", "boolean", ["string"]);
              return screenshot(fileName)
          };
          Module.saveState = slot => {
              const saveState = cwrap("saveState", "boolean", ["number"]);
              return saveState(slot)
          };
          Module.loadState = slot => {
              const loadState = cwrap("loadState", "boolean", ["number"]);
              return loadState(slot)
          };
          Module.saveStateSlot = (slot, flags) => {
              var saveStateSlot = cwrap("saveStateSlot", "number", ["number", "number"]);
              Module.saveStateSlot = (slot, flags) => {
                  if (flags === undefined) {
                      flags = 63
                  }
                  return saveStateSlot(slot, flags)
              };
              return Module.saveStateSlot(slot, flags)
          };
          Module.loadStateSlot = (slot, flags) => {
              var loadStateSlot = cwrap("loadStateSlot", "number", ["number", "number"]);
              Module.loadStateSlot = (slot, flags) => {
                  if (flags === undefined) {
                      flags = 61
                  }
                  return loadStateSlot(slot, flags)
              };
              return Module.loadStateSlot(slot, flags)
          };
          Module.autoLoadCheats = () => {
              const autoLoadCheats = cwrap("autoLoadCheats", "bool", []);
              return autoLoadCheats()
          };
          Module.setFastForwardMultiplier = multiplier => {
              const setFastForwardMultiplier = cwrap("setFastForwardMultiplier", null, ["number"]);
              setFastForwardMultiplier(multiplier)
          };
          Module.getFastForwardMultiplier = () => {
              const getFastForwardMultiplier = cwrap("getFastForwardMultiplier", "number", []);
              return getFastForwardMultiplier()
          };
          const coreCallbackStore = {
              alarmCallbackPtr: null,
              coreCrashedCallbackPtr: null,
              keysReadCallbackPtr: null,
              saveDataUpdatedCallbackPtr: null,
              videoFrameEndedCallbackPtr: null,
              videoFrameStartedCallbackPtr: null
          };
          Module.addCoreCallbacks = callbacks => {
              const addCoreCallbacks = cwrap("addCoreCallbacks", null, ["number"]);
              Object.keys(coreCallbackStore).forEach(callbackKey => {
                  const callbackName = callbackKey.replace("CallbackPtr", "Callback");
                  const callback = callbacks[callbackName];
                  if (callback !== undefined && !!coreCallbackStore[callbackKey]) {
                      removeFunction(coreCallbackStore[callbackKey]);
                      coreCallbackStore[callbackKey] = null
                  }
                  if (!!callback) coreCallbackStore[callbackKey] = addFunction(callback, "vi")
              });
              addCoreCallbacks(coreCallbackStore.alarmCallbackPtr, coreCallbackStore.coreCrashedCallbackPtr, coreCallbackStore.keysReadCallbackPtr, coreCallbackStore.saveDataUpdatedCallbackPtr, coreCallbackStore.videoFrameEndedCallbackPtr, coreCallbackStore.videoFrameStartedCallbackPtr)
          };
          Module.toggleRewind = toggle => {
              const toggleRewind = cwrap("toggleRewind", null, ["boolean"]);
              toggleRewind(toggle)
          };
          Module.getPixelData = () => {
              const ptr = _getPixelData();
              return new Uint32Array(HEAPU32.buffer, ptr, 240 * 160)
          };
          Module.setCoreSettings = coreSettings => {
              const setIntegerCoreSetting = cwrap("setIntegerCoreSetting", null, ["string", "number"]);
              if (coreSettings.allowOpposingDirections !== undefined) setIntegerCoreSetting("allowOpposingDirections", coreSettings.allowOpposingDirections);
              if (coreSettings.rewindBufferCapacity !== undefined) setIntegerCoreSetting("rewindBufferCapacity", coreSettings.rewindBufferCapacity);
              if (coreSettings.rewindBufferInterval !== undefined) setIntegerCoreSetting("rewindBufferInterval", coreSettings.rewindBufferInterval);
              if (coreSettings?.frameSkip !== undefined) setIntegerCoreSetting("frameSkip", coreSettings.frameSkip);
              if (coreSettings.audioSampleRate !== undefined) setIntegerCoreSetting("audioSampleRate", coreSettings.audioSampleRate);
              if (coreSettings.audioBufferSize !== undefined) setIntegerCoreSetting("audioBufferSize", coreSettings.audioBufferSize);
              if (coreSettings.videoSync !== undefined) setIntegerCoreSetting("videoSync", coreSettings.videoSync);
              if (coreSettings.audioSync !== undefined) setIntegerCoreSetting("audioSync", coreSettings.audioSync);
              if (coreSettings.threadedVideo !== undefined) setIntegerCoreSetting("threadedVideo", coreSettings.threadedVideo);
              if (coreSettings.rewindEnable !== undefined) setIntegerCoreSetting("rewindEnable", coreSettings.rewindEnable)
          };
          var moduleOverrides = Object.assign({}, Module);
          var arguments_ = [];
          var thisProgram = "./this.program";
          var quit_ = (status, toThrow) => {
              throw toThrow
          };
          var scriptDirectory = "";

          function locateFile(path) {
              if (Module["locateFile"]) {
                  return Module["locateFile"](path, scriptDirectory)
              }
              return scriptDirectory + path
          }
          var readAsync, readBinary;
          if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
              if (ENVIRONMENT_IS_WORKER) {
                  scriptDirectory = self.location.href
              } else if (typeof document != "undefined" && document.currentScript) {
                  scriptDirectory = document.currentScript.src
              }
              if (_scriptName) {
                  scriptDirectory = _scriptName
              }
              if (scriptDirectory.startsWith("blob:")) {
                  scriptDirectory = ""
              } else {
                  scriptDirectory = scriptDirectory.slice(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
              } {
                  if (ENVIRONMENT_IS_WORKER) {
                      readBinary = url => {
                          var xhr = new XMLHttpRequest;
                          xhr.open("GET", url, false);
                          xhr.responseType = "arraybuffer";
                          xhr.send(null);
                          return new Uint8Array(xhr.response)
                      }
                  }
                  readAsync = async url => {
                      var response = await fetch(url, {
                          credentials: "same-origin"
                      });
                      if (response.ok) {
                          return response.arrayBuffer()
                      }
                      throw new Error(response.status + " : " + response.url)
                  }
              }
          } else {}
          var out = Module["print"] || console.log.bind(console);
          var err = Module["printErr"] || console.error.bind(console);
          Object.assign(Module, moduleOverrides);
          moduleOverrides = null;
          if (Module["arguments"]) arguments_ = Module["arguments"];
          if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
          var wasmBinary = Module["wasmBinary"];
          var wasmMemory;
          var wasmModule;
          var ABORT = false;
          var EXITSTATUS;

          function assert(condition, text) {
              if (!condition) {
                  abort(text)
              }
          }
          var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
          var runtimeInitialized = false;
          if (ENVIRONMENT_IS_PTHREAD) {
              var wasmModuleReceived;
              var initializedJS = false;

              function threadPrintErr(...args) {
                  var text = args.join(" ");
                  console.error(text)
              }
              if (!Module["printErr"]) err = threadPrintErr;

              function threadAlert(...args) {
                  var text = args.join(" ");
                  postMessage({
                      cmd: "alert",
                      text,
                      threadId: _pthread_self()
                  })
              }
              self.alert = threadAlert;
              self.onunhandledrejection = e => {
                  throw e.reason || e
              };

              function handleMessage(e) {
                  try {
                      var msgData = e["data"];
                      var cmd = msgData.cmd;
                      if (cmd === "load") {
                          let messageQueue = [];
                          self.onmessage = e => messageQueue.push(e);
                          self.startWorker = instance => {
                              postMessage({
                                  cmd: "loaded"
                              });
                              for (let msg of messageQueue) {
                                  handleMessage(msg)
                              }
                              self.onmessage = handleMessage
                          };
                          for (const handler of msgData.handlers) {
                              if (!Module[handler] || Module[handler].proxy) {
                                  Module[handler] = (...args) => {
                                      postMessage({
                                          cmd: "callHandler",
                                          handler,
                                          args
                                      })
                                  };
                                  if (handler == "print") out = Module[handler];
                                  if (handler == "printErr") err = Module[handler]
                              }
                          }
                          wasmMemory = msgData.wasmMemory;
                          updateMemoryViews();
                          wasmModuleReceived(msgData.wasmModule)
                      } else if (cmd === "run") {
                          establishStackSpace(msgData.pthread_ptr);
                          __emscripten_thread_init(msgData.pthread_ptr, 0, 0, 1, 0, 0);
                          PThread.threadInitTLS();
                          __emscripten_thread_mailbox_await(msgData.pthread_ptr);
                          if (!initializedJS) {
                              initializedJS = true
                          }
                          try {
                              invokeEntryPoint(msgData.start_routine, msgData.arg)
                          } catch (ex) {
                              if (ex != "unwind") {
                                  throw ex
                              }
                          }
                      } else if (msgData.target === "setimmediate") {} else if (cmd === "checkMailbox") {
                          if (initializedJS) {
                              checkMailbox()
                          }
                      } else if (cmd) {
                          err(`worker: received unknown command ${cmd}`);
                          err(msgData)
                      }
                  } catch (ex) {
                      __emscripten_thread_crashed();
                      throw ex
                  }
              }
              self.onmessage = handleMessage
          }

          function updateMemoryViews() {
              var b = wasmMemory.buffer;
              Module["HEAP8"] = HEAP8 = new Int8Array(b);
              Module["HEAP16"] = HEAP16 = new Int16Array(b);
              Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
              Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
              Module["HEAP32"] = HEAP32 = new Int32Array(b);
              Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
              Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
              Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
              Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
              Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b)
          }
          if (!ENVIRONMENT_IS_PTHREAD) {
              if (Module["wasmMemory"]) {
                  wasmMemory = Module["wasmMemory"]
              } else {
                  var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 268435456;
                  wasmMemory = new WebAssembly.Memory({
                      initial: INITIAL_MEMORY / 65536,
                      maximum: INITIAL_MEMORY / 65536,
                      shared: true
                  })
              }
              updateMemoryViews()
          }

          function preRun() {
              if (Module["preRun"]) {
                  if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                  while (Module["preRun"].length) {
                      addOnPreRun(Module["preRun"].shift())
                  }
              }
              callRuntimeCallbacks(onPreRuns)
          }

          function initRuntime() {
              runtimeInitialized = true;
              if (ENVIRONMENT_IS_PTHREAD) return startWorker(Module);
              wasmExports["re"]()
          }

          function preMain() {}

          function postRun() {
              if (ENVIRONMENT_IS_PTHREAD) return;
              if (Module["postRun"]) {
                  if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                  while (Module["postRun"].length) {
                      addOnPostRun(Module["postRun"].shift())
                  }
              }
              callRuntimeCallbacks(onPostRuns)
          }
          var runDependencies = 0;
          var dependenciesFulfilled = null;

          function addRunDependency(id) {
              runDependencies++;
              Module["monitorRunDependencies"]?.(runDependencies)
          }

          function removeRunDependency(id) {
              runDependencies--;
              Module["monitorRunDependencies"]?.(runDependencies);
              if (runDependencies == 0) {
                  if (dependenciesFulfilled) {
                      var callback = dependenciesFulfilled;
                      dependenciesFulfilled = null;
                      callback()
                  }
              }
          }

          function abort(what) {
              Module["onAbort"]?.(what);
              what = "Aborted(" + what + ")";
              err(what);
              ABORT = true;
              what += ". Build with -sASSERTIONS for more info.";
              var e = new WebAssembly.RuntimeError(what);
              readyPromiseReject(e);
              throw e
          }
          var wasmBinaryFile;

          function findWasmBinary() {
              if (Module["locateFile"]) {
                  return locateFile("mgba.wasm")
              }
              return new URL("mgba.wasm", import.meta.url).href
          }

          function getBinarySync(file) {
              if (file == wasmBinaryFile && wasmBinary) {
                  return new Uint8Array(wasmBinary)
              }
              if (readBinary) {
                  return readBinary(file)
              }
              throw "both async and sync fetching of the wasm failed"
          }
          async function getWasmBinary(binaryFile) {
              if (!wasmBinary) {
                  try {
                      var response = await readAsync(binaryFile);
                      return new Uint8Array(response)
                  } catch {}
              }
              return getBinarySync(binaryFile)
          }
          async function instantiateArrayBuffer(binaryFile, imports) {
              try {
                  var binary = await getWasmBinary(binaryFile);
                  var instance = await WebAssembly.instantiate(binary, imports);
                  return instance
              } catch (reason) {
                  err(`failed to asynchronously prepare wasm: ${reason}`);
                  abort(reason)
              }
          }
          async function instantiateAsync(binary, binaryFile, imports) {
              if (!binary && typeof WebAssembly.instantiateStreaming == "function") {
                  try {
                      var response = fetch(binaryFile, {
                          credentials: "same-origin"
                      });
                      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
                      return instantiationResult
                  } catch (reason) {
                      err(`wasm streaming compile failed: ${reason}`);
                      err("falling back to ArrayBuffer instantiation")
                  }
              }
              return instantiateArrayBuffer(binaryFile, imports)
          }

          function getWasmImports() {
              assignWasmImports();
              return {
                  a: wasmImports
              }
          }
          async function createWasm() {
              function receiveInstance(instance, module) {
                  wasmExports = instance.exports;
                  registerTLSInit(wasmExports["Ze"]);
                  wasmTable = wasmExports["se"];
                  wasmModule = module;
                  removeRunDependency("wasm-instantiate");
                  return wasmExports
              }
              addRunDependency("wasm-instantiate");

              function receiveInstantiationResult(result) {
                  return receiveInstance(result["instance"], result["module"])
              }
              var info = getWasmImports();
              if (Module["instantiateWasm"]) {
                  return new Promise((resolve, reject) => {
                      Module["instantiateWasm"](info, (mod, inst) => {
                          receiveInstance(mod, inst);
                          resolve(mod.exports)
                      })
                  })
              }
              if (ENVIRONMENT_IS_PTHREAD) {
                  return new Promise(resolve => {
                      wasmModuleReceived = module => {
                          var instance = new WebAssembly.Instance(module, getWasmImports());
                          resolve(receiveInstance(instance, module))
                      }
                  })
              }
              wasmBinaryFile ??= findWasmBinary();
              try {
                  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
                  var exports = receiveInstantiationResult(result);
                  return exports
              } catch (e) {
                  readyPromiseReject(e);
                  return Promise.reject(e)
              }
          }
          var ASM_CONSTS = {
              308320: () => {
                  console.error("thread instantiation failed")
              },
              308369: ($0, $1, $2, $3, $4, $5, $6) => {
                  Module.version = {
                      gitCommit: UTF8ToString($0),
                      gitShort: UTF8ToString($1),
                      gitBranch: UTF8ToString($2),
                      gitRevision: $3,
                      binaryName: UTF8ToString($4),
                      projectName: UTF8ToString($5),
                      projectVersion: UTF8ToString($6)
                  }
              },
              308601: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              308699: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              308797: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              308895: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              308993: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              309091: ($0, $1) => {
                  const funcPtr = $0;
                  const ctx = $1;
                  const func = wasmTable.get(funcPtr);
                  if (func) func(ctx)
              },
              309189: () => {
                  FS.syncfs(function(err) {
                      assert(!err)
                  })
              },
              309233: $0 => {
                  var str = UTF8ToString($0) + "\n\n" + "Abort/Retry/Ignore/AlwaysIgnore? [ariA] :";
                  var reply = window.prompt(str, "i");
                  if (reply === null) {
                      reply = "i"
                  }
                  return allocate(intArrayFromString(reply), "i8", ALLOC_NORMAL)
              },
              309458: () => {
                  if (typeof AudioContext !== "undefined") {
                      return true
                  } else if (typeof webkitAudioContext !== "undefined") {
                      return true
                  }
                  return false
              },
              309605: () => {
                  if (typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia !== "undefined") {
                      return true
                  } else if (typeof navigator.webkitGetUserMedia !== "undefined") {
                      return true
                  }
                  return false
              },
              309839: $0 => {
                  if (typeof Module["SDL2"] === "undefined") {
                      Module["SDL2"] = {}
                  }
                  var SDL2 = Module["SDL2"];
                  if (!$0) {
                      SDL2.audio = {}
                  } else {
                      SDL2.capture = {}
                  }
                  if (!SDL2.audioContext) {
                      if (typeof AudioContext !== "undefined") {
                          SDL2.audioContext = new AudioContext
                      } else if (typeof webkitAudioContext !== "undefined") {
                          SDL2.audioContext = new webkitAudioContext
                      }
                      if (SDL2.audioContext) {
                          if (typeof navigator.userActivation === "undefined") {
                              autoResumeAudioContext(SDL2.audioContext)
                          }
                      }
                  }
                  return SDL2.audioContext === undefined ? -1 : 0
              },
              310391: () => {
                  var SDL2 = Module["SDL2"];
                  return SDL2.audioContext.sampleRate
              },
              310459: ($0, $1, $2, $3) => {
                  var SDL2 = Module["SDL2"];
                  var have_microphone = function(stream) {
                      if (SDL2.capture.silenceTimer !== undefined) {
                          clearInterval(SDL2.capture.silenceTimer);
                          SDL2.capture.silenceTimer = undefined;
                          SDL2.capture.silenceBuffer = undefined
                      }
                      SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
                      SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
                      SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {
                          if (SDL2 === undefined || SDL2.capture === undefined) {
                              return
                          }
                          audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
                          SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
                          dynCall("vi", $2, [$3])
                      };
                      SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
                      SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
                      SDL2.capture.stream = stream
                  };
                  var no_microphone = function(error) {};
                  SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
                  SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
                  var silence_callback = function() {
                      SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
                      dynCall("vi", $2, [$3])
                  };
                  SDL2.capture.silenceTimer = setInterval(silence_callback, $1 / SDL2.audioContext.sampleRate * 1e3);
                  if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
                      navigator.mediaDevices.getUserMedia({
                          audio: true,
                          video: false
                      }).then(have_microphone).catch(no_microphone)
                  } else if (navigator.webkitGetUserMedia !== undefined) {
                      navigator.webkitGetUserMedia({
                          audio: true,
                          video: false
                      }, have_microphone, no_microphone)
                  }
              },
              312152: ($0, $1, $2, $3) => {
                  var SDL2 = Module["SDL2"];
                  SDL2.audio.scriptProcessorNode = SDL2.audioContext["createScriptProcessor"]($1, 0, $0);
                  SDL2.audio.scriptProcessorNode["onaudioprocess"] = function(e) {
                      if (SDL2 === undefined || SDL2.audio === undefined) {
                          return
                      }
                      if (SDL2.audio.silenceTimer !== undefined) {
                          clearInterval(SDL2.audio.silenceTimer);
                          SDL2.audio.silenceTimer = undefined;
                          SDL2.audio.silenceBuffer = undefined
                      }
                      SDL2.audio.currentOutputBuffer = e["outputBuffer"];
                      dynCall("vi", $2, [$3])
                  };
                  SDL2.audio.scriptProcessorNode["connect"](SDL2.audioContext["destination"]);
                  if (SDL2.audioContext.state === "suspended") {
                      SDL2.audio.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
                      SDL2.audio.silenceBuffer.getChannelData(0).fill(0);
                      var silence_callback = function() {
                          if (typeof navigator.userActivation !== "undefined") {
                              if (navigator.userActivation.hasBeenActive) {
                                  SDL2.audioContext.resume()
                              }
                          }
                          SDL2.audio.currentOutputBuffer = SDL2.audio.silenceBuffer;
                          dynCall("vi", $2, [$3]);
                          SDL2.audio.currentOutputBuffer = undefined
                      };
                      SDL2.audio.silenceTimer = setInterval(silence_callback, $1 / SDL2.audioContext.sampleRate * 1e3)
                  }
              },
              313327: ($0, $1) => {
                  var SDL2 = Module["SDL2"];
                  var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
                  for (var c = 0; c < numChannels; ++c) {
                      var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
                      if (channelData.length != $1) {
                          throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
                      }
                      if (numChannels == 1) {
                          for (var j = 0; j < $1; ++j) {
                              setValue($0 + j * 4, channelData[j], "float")
                          }
                      } else {
                          for (var j = 0; j < $1; ++j) {
                              setValue($0 + (j * numChannels + c) * 4, channelData[j], "float")
                          }
                      }
                  }
              },
              313932: ($0, $1) => {
                  var SDL2 = Module["SDL2"];
                  var buf = $0 >>> 2;
                  var numChannels = SDL2.audio.currentOutputBuffer["numberOfChannels"];
                  for (var c = 0; c < numChannels; ++c) {
                      var channelData = SDL2.audio.currentOutputBuffer["getChannelData"](c);
                      if (channelData.length != $1) {
                          throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!"
                      }
                      for (var j = 0; j < $1; ++j) {
                          channelData[j] = HEAPF32[buf + (j * numChannels + c)]
                      }
                  }
              },
              314421: $0 => {
                  var SDL2 = Module["SDL2"];
                  if ($0) {
                      if (SDL2.capture.silenceTimer !== undefined) {
                          clearInterval(SDL2.capture.silenceTimer)
                      }
                      if (SDL2.capture.stream !== undefined) {
                          var tracks = SDL2.capture.stream.getAudioTracks();
                          for (var i = 0; i < tracks.length; i++) {
                              SDL2.capture.stream.removeTrack(tracks[i])
                          }
                      }
                      if (SDL2.capture.scriptProcessorNode !== undefined) {
                          SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {};
                          SDL2.capture.scriptProcessorNode.disconnect()
                      }
                      if (SDL2.capture.mediaStreamNode !== undefined) {
                          SDL2.capture.mediaStreamNode.disconnect()
                      }
                      SDL2.capture = undefined
                  } else {
                      if (SDL2.audio.scriptProcessorNode != undefined) {
                          SDL2.audio.scriptProcessorNode.disconnect()
                      }
                      if (SDL2.audio.silenceTimer !== undefined) {
                          clearInterval(SDL2.audio.silenceTimer)
                      }
                      SDL2.audio = undefined
                  }
                  if (SDL2.audioContext !== undefined && SDL2.audio === undefined && SDL2.capture === undefined) {
                      SDL2.audioContext.close();
                      SDL2.audioContext = undefined
                  }
              },
              315427: ($0, $1, $2) => {
                  var w = $0;
                  var h = $1;
                  var pixels = $2;
                  if (!Module["SDL2"]) Module["SDL2"] = {};
                  var SDL2 = Module["SDL2"];
                  if (SDL2.ctxCanvas !== Module["canvas"]) {
                      SDL2.ctx = Module["createContext"](Module["canvas"], false, true);
                      SDL2.ctxCanvas = Module["canvas"]
                  }
                  if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
                      SDL2.image = SDL2.ctx.createImageData(w, h);
                      SDL2.w = w;
                      SDL2.h = h;
                      SDL2.imageCtx = SDL2.ctx
                  }
                  var data = SDL2.image.data;
                  var src = pixels / 4;
                  var dst = 0;
                  var num;
                  if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
                      num = data.length;
                      while (dst < num) {
                          var val = HEAP32[src];
                          data[dst] = val & 255;
                          data[dst + 1] = val >> 8 & 255;
                          data[dst + 2] = val >> 16 & 255;
                          data[dst + 3] = 255;
                          src++;
                          dst += 4
                      }
                  } else {
                      if (SDL2.data32Data !== data) {
                          SDL2.data32 = new Int32Array(data.buffer);
                          SDL2.data8 = new Uint8Array(data.buffer);
                          SDL2.data32Data = data
                      }
                      var data32 = SDL2.data32;
                      num = data32.length;
                      data32.set(HEAP32.subarray(src, src + num));
                      var data8 = SDL2.data8;
                      var i = 3;
                      var j = i + 4 * num;
                      if (num % 8 == 0) {
                          while (i < j) {
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0;
                              data8[i] = 255;
                              i = i + 4 | 0
                          }
                      } else {
                          while (i < j) {
                              data8[i] = 255;
                              i = i + 4 | 0
                          }
                      }
                  }
                  SDL2.ctx.putImageData(SDL2.image, 0, 0)
              },
              316895: ($0, $1, $2, $3, $4) => {
                  var w = $0;
                  var h = $1;
                  var hot_x = $2;
                  var hot_y = $3;
                  var pixels = $4;
                  var canvas = document.createElement("canvas");
                  canvas.width = w;
                  canvas.height = h;
                  var ctx = canvas.getContext("2d");
                  var image = ctx.createImageData(w, h);
                  var data = image.data;
                  var src = pixels / 4;
                  var dst = 0;
                  var num;
                  if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
                      num = data.length;
                      while (dst < num) {
                          var val = HEAP32[src];
                          data[dst] = val & 255;
                          data[dst + 1] = val >> 8 & 255;
                          data[dst + 2] = val >> 16 & 255;
                          data[dst + 3] = val >> 24 & 255;
                          src++;
                          dst += 4
                      }
                  } else {
                      var data32 = new Int32Array(data.buffer);
                      num = data32.length;
                      data32.set(HEAP32.subarray(src, src + num))
                  }
                  ctx.putImageData(image, 0, 0);
                  var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
                  var urlBuf = _malloc(url.length + 1);
                  stringToUTF8(url, urlBuf, url.length + 1);
                  return urlBuf
              },
              317883: $0 => {
                  if (Module["canvas"]) {
                      Module["canvas"].style["cursor"] = UTF8ToString($0)
                  }
              },
              317966: () => {
                  if (Module["canvas"]) {
                      Module["canvas"].style["cursor"] = "none"
                  }
              },
              318035: () => window.innerWidth,
              318065: () => window.innerHeight
          };
          class ExitStatus {
              name = "ExitStatus";
              constructor(status) {
                  this.message = `Program terminated with exit(${status})`;
                  this.status = status
              }
          }
          var terminateWorker = worker => {
              worker.terminate();
              worker.onmessage = e => {}
          };
          var cleanupThread = pthread_ptr => {
              var worker = PThread.pthreads[pthread_ptr];
              PThread.returnWorkerToPool(worker)
          };
          var callRuntimeCallbacks = callbacks => {
              while (callbacks.length > 0) {
                  callbacks.shift()(Module)
              }
          };
          var onPreRuns = [];
          var addOnPreRun = cb => onPreRuns.unshift(cb);
          var spawnThread = threadParams => {
              var worker = PThread.getNewWorker();
              if (!worker) {
                  return 6
              }
              PThread.runningWorkers.push(worker);
              PThread.pthreads[threadParams.pthread_ptr] = worker;
              worker.pthread_ptr = threadParams.pthread_ptr;
              var msg = {
                  cmd: "run",
                  start_routine: threadParams.startRoutine,
                  arg: threadParams.arg,
                  pthread_ptr: threadParams.pthread_ptr
              };
              worker.postMessage(msg, threadParams.transferList);
              return 0
          };
          var runtimeKeepaliveCounter = 0;
          var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
          var stackSave = () => _emscripten_stack_get_current();
          var stackRestore = val => __emscripten_stack_restore(val);
          var stackAlloc = sz => __emscripten_stack_alloc(sz);
          var INT53_MAX = 9007199254740992;
          var INT53_MIN = -9007199254740992;
          var bigintToI53Checked = num => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
          var proxyToMainThread = (funcIndex, emAsmAddr, sync, ...callArgs) => {
              var serializedNumCallArgs = callArgs.length * 2;
              var sp = stackSave();
              var args = stackAlloc(serializedNumCallArgs * 8);
              var b = args >> 3;
              for (var i = 0; i < callArgs.length; i++) {
                  var arg = callArgs[i];
                  if (typeof arg == "bigint") {
                      HEAP64[b + 2 * i] = 1n;
                      HEAP64[b + 2 * i + 1] = arg
                  } else {
                      HEAP64[b + 2 * i] = 0n;
                      HEAPF64[b + 2 * i + 1] = arg
                  }
              }
              var rtn = __emscripten_run_on_main_thread_js(funcIndex, emAsmAddr, serializedNumCallArgs, args, sync);
              stackRestore(sp);
              return rtn
          };

          function _proc_exit(code) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
              EXITSTATUS = code;
              if (!keepRuntimeAlive()) {
                  PThread.terminateAllThreads();
                  Module["onExit"]?.(code);
                  ABORT = true
              }
              quit_(code, new ExitStatus(code))
          }
          var handleException = e => {
              if (e instanceof ExitStatus || e == "unwind") {
                  return EXITSTATUS
              }
              quit_(1, e)
          };

          function exitOnMainThread(returnCode) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
              _exit(returnCode)
          }
          var exitJS = (status, implicit) => {
              EXITSTATUS = status;
              if (ENVIRONMENT_IS_PTHREAD) {
                  exitOnMainThread(status);
                  throw "unwind"
              }
              _proc_exit(status)
          };
          var _exit = exitJS;
          var PThread = {
              unusedWorkers: [],
              runningWorkers: [],
              tlsInitFunctions: [],
              pthreads: {},
              init() {
                  if (!ENVIRONMENT_IS_PTHREAD) {
                      PThread.initMainThread()
                  }
              },
              initMainThread() {
                  var pthreadPoolSize = 2;
                  while (pthreadPoolSize--) {
                      PThread.allocateUnusedWorker()
                  }
                  addOnPreRun(() => {
                      addRunDependency("loading-workers");
                      PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"))
                  })
              },
              terminateAllThreads: () => {
                  for (var worker of PThread.runningWorkers) {
                      terminateWorker(worker)
                  }
                  for (var worker of PThread.unusedWorkers) {
                      terminateWorker(worker)
                  }
                  PThread.unusedWorkers = [];
                  PThread.runningWorkers = [];
                  PThread.pthreads = {}
              },
              returnWorkerToPool: worker => {
                  var pthread_ptr = worker.pthread_ptr;
                  delete PThread.pthreads[pthread_ptr];
                  PThread.unusedWorkers.push(worker);
                  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
                  worker.pthread_ptr = 0;
                  __emscripten_thread_free_data(pthread_ptr)
              },
              threadInitTLS() {
                  PThread.tlsInitFunctions.forEach(f => f())
              },
              loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
                  worker.onmessage = e => {
                      var d = e["data"];
                      var cmd = d.cmd;
                      if (d.targetThread && d.targetThread != _pthread_self()) {
                          var targetWorker = PThread.pthreads[d.targetThread];
                          if (targetWorker) {
                              targetWorker.postMessage(d, d.transferList)
                          } else {
                              err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d.targetThread}, but that thread no longer exists!`)
                          }
                          return
                      }
                      if (cmd === "checkMailbox") {
                          checkMailbox()
                      } else if (cmd === "spawnThread") {
                          spawnThread(d)
                      } else if (cmd === "cleanupThread") {
                          cleanupThread(d.thread)
                      } else if (cmd === "loaded") {
                          worker.loaded = true;
                          onFinishedLoading(worker)
                      } else if (cmd === "alert") {
                          alert(`Thread ${d.threadId}: ${d.text}`)
                      } else if (d.target === "setimmediate") {
                          worker.postMessage(d)
                      } else if (cmd === "callHandler") {
                          Module[d.handler](...d.args)
                      } else if (cmd) {
                          err(`worker sent an unknown command ${cmd}`)
                      }
                  };
                  worker.onerror = e => {
                      var message = "worker sent an error!";
                      err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
                      throw e
                  };
                  var handlers = [];
                  var knownHandlers = ["onExit", "onAbort", "print", "printErr"];
                  for (var handler of knownHandlers) {
                      if (Module.propertyIsEnumerable(handler)) {
                          handlers.push(handler)
                      }
                  }
                  worker.postMessage({
                      cmd: "load",
                      handlers,
                      wasmMemory,
                      wasmModule
                  })
              }),
              loadWasmModuleToAllWorkers(onMaybeReady) {
                  if (ENVIRONMENT_IS_PTHREAD) {
                      return onMaybeReady()
                  }
                  let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
                  pthreadPoolReady.then(onMaybeReady)
              },
              allocateUnusedWorker() {
                  var worker;
                  worker = new Worker(new URL("mgba.js", import.meta.url), {
                      type: "module",
                      name: "em-pthread"
                  });
                  PThread.unusedWorkers.push(worker)
              },
              getNewWorker() {
                  if (PThread.unusedWorkers.length == 0) {
                      PThread.allocateUnusedWorker();
                      PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0])
                  }
                  return PThread.unusedWorkers.pop()
              }
          };
          var onPostRuns = [];
          var addOnPostRun = cb => onPostRuns.unshift(cb);
          var establishStackSpace = pthread_ptr => {
              var stackHigh = HEAPU32[pthread_ptr + 52 >> 2];
              var stackSize = HEAPU32[pthread_ptr + 56 >> 2];
              var stackLow = stackHigh - stackSize;
              _emscripten_stack_set_limits(stackHigh, stackLow);
              stackRestore(stackHigh)
          };
          var wasmTable;
          var getWasmTableEntry = funcPtr => wasmTable.get(funcPtr);
          var invokeEntryPoint = (ptr, arg) => {
              runtimeKeepaliveCounter = 0;
              noExitRuntime = 0;
              var result = getWasmTableEntry(ptr)(arg);

              function finish(result) {
                  if (keepRuntimeAlive()) {
                      EXITSTATUS = result
                  } else {
                      __emscripten_thread_exit(result)
                  }
              }
              finish(result)
          };
          var noExitRuntime = Module["noExitRuntime"] || true;
          var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

          function setValue(ptr, value, type = "i8") {
              if (type.endsWith("*")) type = "*";
              switch (type) {
                  case "i1":
                      HEAP8[ptr] = value;
                      break;
                  case "i8":
                      HEAP8[ptr] = value;
                      break;
                  case "i16":
                      HEAP16[ptr >> 1] = value;
                      break;
                  case "i32":
                      HEAP32[ptr >> 2] = value;
                      break;
                  case "i64":
                      HEAP64[ptr >> 3] = BigInt(value);
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
                      abort(`invalid type for setValue: ${type}`)
              }
          }
          var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;
          var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
              var endIdx = idx + maxBytesToRead;
              var endPtr = idx;
              while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
              if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
                  return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr))
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
          };
          var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
          var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
          var ___call_sighandler = (fp, sig) => getWasmTableEntry(fp)(sig);

          function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
              return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg)
          }
          var _emscripten_has_threading_support = () => typeof SharedArrayBuffer != "undefined";
          var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
              if (!_emscripten_has_threading_support()) {
                  return 6
              }
              var transferList = [];
              var error = 0;
              if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
                  return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg)
              }
              if (error) return error;
              var threadParams = {
                  startRoutine,
                  pthread_ptr,
                  arg,
                  transferList
              };
              if (ENVIRONMENT_IS_PTHREAD) {
                  threadParams.cmd = "spawnThread";
                  postMessage(threadParams, transferList);
                  return 0
              }
              return spawnThread(threadParams)
          };
          var SYSCALLS = {
              varargs: undefined,
              getStr(ptr) {
                  var ret = UTF8ToString(ptr);
                  return ret
              }
          };

          function ___syscall_fcntl64(fd, cmd, varargs) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, fd, cmd, varargs);
              SYSCALLS.varargs = varargs;
              return 0
          }

          function ___syscall_fstat64(fd, buf) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, fd, buf)
          }

          function ___syscall_ftruncate64(fd, length) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, fd, length);
              length = bigintToI53Checked(length)
          }
          var lengthBytesUTF8 = str => {
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
          };
          var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
              if (!(maxBytesToWrite > 0)) return 0;
              var startIdx = outIdx;
              var endIdx = outIdx + maxBytesToWrite - 1;
              for (var i = 0; i < str.length; ++i) {
                  var u = str.charCodeAt(i);
                  if (u >= 55296 && u <= 57343) {
                      var u1 = str.charCodeAt(++i);
                      u = 65536 + ((u & 1023) << 10) | u1 & 1023
                  }
                  if (u <= 127) {
                      if (outIdx >= endIdx) break;
                      heap[outIdx++] = u
                  } else if (u <= 2047) {
                      if (outIdx + 1 >= endIdx) break;
                      heap[outIdx++] = 192 | u >> 6;
                      heap[outIdx++] = 128 | u & 63
                  } else if (u <= 65535) {
                      if (outIdx + 2 >= endIdx) break;
                      heap[outIdx++] = 224 | u >> 12;
                      heap[outIdx++] = 128 | u >> 6 & 63;
                      heap[outIdx++] = 128 | u & 63
                  } else {
                      if (outIdx + 3 >= endIdx) break;
                      heap[outIdx++] = 240 | u >> 18;
                      heap[outIdx++] = 128 | u >> 12 & 63;
                      heap[outIdx++] = 128 | u >> 6 & 63;
                      heap[outIdx++] = 128 | u & 63
                  }
              }
              heap[outIdx] = 0;
              return outIdx - startIdx
          };
          var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);

          function ___syscall_getcwd(buf, size) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, buf, size)
          }

          function ___syscall_getdents64(fd, dirp, count) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, fd, dirp, count)
          }

          function ___syscall_ioctl(fd, op, varargs) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, fd, op, varargs);
              SYSCALLS.varargs = varargs;
              return 0
          }

          function ___syscall_lstat64(path, buf) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, path, buf)
          }

          function ___syscall_mkdirat(dirfd, path, mode) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, dirfd, path, mode)
          }

          function ___syscall_newfstatat(dirfd, path, buf, flags) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, dirfd, path, buf, flags)
          }

          function ___syscall_openat(dirfd, path, flags, varargs) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 0, 1, dirfd, path, flags, varargs);
              SYSCALLS.varargs = varargs
          }

          function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 0, 1, dirfd, path, buf, bufsize)
          }

          function ___syscall_rmdir(path) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 0, 1, path)
          }

          function ___syscall_stat64(path, buf) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 0, 1, path, buf)
          }

          function ___syscall_unlinkat(dirfd, path, flags) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 0, 1, dirfd, path, flags)
          }

          function ___syscall_utimensat(dirfd, path, times, flags) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 0, 1, dirfd, path, times, flags)
          }
          var __abort_js = () => abort("");
          var __emscripten_init_main_thread_js = tb => {
              __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB, 65536, false);
              PThread.threadInitTLS()
          };
          var maybeExit = () => {
              if (!keepRuntimeAlive()) {
                  try {
                      if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS);
                      else _exit(EXITSTATUS)
                  } catch (e) {
                      handleException(e)
                  }
              }
          };
          var callUserCallback = func => {
              if (ABORT) {
                  return
              }
              try {
                  func();
                  maybeExit()
              } catch (e) {
                  handleException(e)
              }
          };
          var __emscripten_thread_mailbox_await = pthread_ptr => {
              if (typeof Atomics.waitAsync === "function") {
                  var wait = Atomics.waitAsync(HEAP32, pthread_ptr >> 2, pthread_ptr);
                  wait.value.then(checkMailbox);
                  var waitingAsync = pthread_ptr + 128;
                  Atomics.store(HEAP32, waitingAsync >> 2, 1)
              }
          };
          var checkMailbox = () => {
              var pthread_ptr = _pthread_self();
              if (pthread_ptr) {
                  __emscripten_thread_mailbox_await(pthread_ptr);
                  callUserCallback(__emscripten_check_mailbox)
              }
          };
          var __emscripten_notify_mailbox_postmessage = (targetThread, currThreadId) => {
              if (targetThread == currThreadId) {
                  setTimeout(checkMailbox)
              } else if (ENVIRONMENT_IS_PTHREAD) {
                  postMessage({
                      targetThread,
                      cmd: "checkMailbox"
                  })
              } else {
                  var worker = PThread.pthreads[targetThread];
                  if (!worker) {
                      return
                  }
                  worker.postMessage({
                      cmd: "checkMailbox"
                  })
              }
          };
          var proxiedJSCallArgs = [];
          var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, numCallArgs, args) => {
              numCallArgs /= 2;
              proxiedJSCallArgs.length = numCallArgs;
              var b = args >> 3;
              for (var i = 0; i < numCallArgs; i++) {
                  if (HEAP64[b + 2 * i]) {
                      proxiedJSCallArgs[i] = HEAP64[b + 2 * i + 1]
                  } else {
                      proxiedJSCallArgs[i] = HEAPF64[b + 2 * i + 1]
                  }
              }
              var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
              PThread.currentProxiedOperationCallerThread = callingThread;
              var rtn = func(...proxiedJSCallArgs);
              PThread.currentProxiedOperationCallerThread = 0;
              return rtn
          };
          var __emscripten_runtime_keepalive_clear = () => {
              noExitRuntime = false;
              runtimeKeepaliveCounter = 0
          };
          var __emscripten_thread_cleanup = thread => {
              if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
              else postMessage({
                  cmd: "cleanupThread",
                  thread
              })
          };
          var __emscripten_thread_set_strongref = thread => {};
          var __emscripten_throw_longjmp = () => {
              throw Infinity
          };
          var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
          var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
          var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
          var ydayFromDate = date => {
              var leap = isLeapYear(date.getFullYear());
              var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
              var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
              return yday
          };

          function __localtime_js(time, tmPtr) {
              time = bigintToI53Checked(time);
              var date = new Date(time * 1e3);
              HEAP32[tmPtr >> 2] = date.getSeconds();
              HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
              HEAP32[tmPtr + 8 >> 2] = date.getHours();
              HEAP32[tmPtr + 12 >> 2] = date.getDate();
              HEAP32[tmPtr + 16 >> 2] = date.getMonth();
              HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
              HEAP32[tmPtr + 24 >> 2] = date.getDay();
              var yday = ydayFromDate(date) | 0;
              HEAP32[tmPtr + 28 >> 2] = yday;
              HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
              var start = new Date(date.getFullYear(), 0, 1);
              var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
              var winterOffset = start.getTimezoneOffset();
              var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
              HEAP32[tmPtr + 32 >> 2] = dst
          }
          var __mktime_js = function(tmPtr) {
              var ret = (() => {
                  var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
                  var dst = HEAP32[tmPtr + 32 >> 2];
                  var guessedOffset = date.getTimezoneOffset();
                  var start = new Date(date.getFullYear(), 0, 1);
                  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
                  var winterOffset = start.getTimezoneOffset();
                  var dstOffset = Math.min(winterOffset, summerOffset);
                  if (dst < 0) {
                      HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
                  } else if (dst > 0 != (dstOffset == guessedOffset)) {
                      var nonDstOffset = Math.max(winterOffset, summerOffset);
                      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
                      date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
                  }
                  HEAP32[tmPtr + 24 >> 2] = date.getDay();
                  var yday = ydayFromDate(date) | 0;
                  HEAP32[tmPtr + 28 >> 2] = yday;
                  HEAP32[tmPtr >> 2] = date.getSeconds();
                  HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
                  HEAP32[tmPtr + 8 >> 2] = date.getHours();
                  HEAP32[tmPtr + 12 >> 2] = date.getDate();
                  HEAP32[tmPtr + 16 >> 2] = date.getMonth();
                  HEAP32[tmPtr + 20 >> 2] = date.getYear();
                  var timeMs = date.getTime();
                  if (isNaN(timeMs)) {
                      return -1
                  }
                  return timeMs / 1e3
              })();
              return BigInt(ret)
          };

          function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 0, 1, len, prot, flags, fd, offset, allocated, addr);
              offset = bigintToI53Checked(offset);
              return -52
          }

          function __msync_js(addr, len, prot, flags, fd, offset) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 0, 1, addr, len, prot, flags, fd, offset);
              offset = bigintToI53Checked(offset);
              if (isNaN(offset)) return 61;
              SYSCALLS.doMsync(addr, SYSCALLS.getStreamFromFD(fd), len, flags, offset);
              return 0
          }

          function __munmap_js(addr, len, prot, flags, fd, offset) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 0, 1, addr, len, prot, flags, fd, offset);
              offset = bigintToI53Checked(offset)
          }
          var __tzset_js = (timezone, daylight, std_name, dst_name) => {
              var currentYear = (new Date).getFullYear();
              var winter = new Date(currentYear, 0, 1);
              var summer = new Date(currentYear, 6, 1);
              var winterOffset = winter.getTimezoneOffset();
              var summerOffset = summer.getTimezoneOffset();
              var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
              HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
              HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
              var extractZone = timezoneOffset => {
                  var sign = timezoneOffset >= 0 ? "-" : "+";
                  var absOffset = Math.abs(timezoneOffset);
                  var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
                  var minutes = String(absOffset % 60).padStart(2, "0");
                  return `UTC${sign}${hours}${minutes}`
              };
              var winterName = extractZone(winterOffset);
              var summerName = extractZone(summerOffset);
              if (summerOffset < winterOffset) {
                  stringToUTF8(winterName, std_name, 17);
                  stringToUTF8(summerName, dst_name, 17)
              } else {
                  stringToUTF8(winterName, dst_name, 17);
                  stringToUTF8(summerName, std_name, 17)
              }
          };
          var _emscripten_get_now = () => performance.timeOrigin + performance.now();
          var _emscripten_date_now = () => Date.now();
          var nowIsMonotonic = 1;
          var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

          function _clock_time_get(clk_id, ignored_precision, ptime) {
              ignored_precision = bigintToI53Checked(ignored_precision);
              if (!checkWasiClock(clk_id)) {
                  return 28
              }
              var now;
              if (clk_id === 0) {
                  now = _emscripten_date_now()
              } else if (nowIsMonotonic) {
                  now = _emscripten_get_now()
              } else {
                  return 52
              }
              var nsec = Math.round(now * 1e3 * 1e3);
              HEAP64[ptime >> 3] = BigInt(nsec);
              return 0
          }
          var runtimeKeepalivePush = () => {
              runtimeKeepaliveCounter += 1
          };
          var runtimeKeepalivePop = () => {
              runtimeKeepaliveCounter -= 1
          };
          var safeSetTimeout = (func, timeout) => {
              runtimeKeepalivePush();
              return setTimeout(() => {
                  runtimeKeepalivePop();
                  callUserCallback(func)
              }, timeout)
          };
          var warnOnce = text => {
              warnOnce.shown ||= {};
              if (!warnOnce.shown[text]) {
                  warnOnce.shown[text] = 1;
                  err(text)
              }
          };
          var Browser = {
              useWebGL: false,
              isFullscreen: false,
              pointerLock: false,
              moduleContextCreatedCallbacks: [],
              workers: [],
              preloadedImages: {},
              preloadedAudios: {},
              getCanvas: () => Module["canvas"],
              init() {
                  if (Browser.initted) return;
                  Browser.initted = true;

                  function pointerLockChange() {
                      var canvas = Browser.getCanvas();
                      Browser.pointerLock = document["pointerLockElement"] === canvas || document["mozPointerLockElement"] === canvas || document["webkitPointerLockElement"] === canvas || document["msPointerLockElement"] === canvas
                  }
                  var canvas = Browser.getCanvas();
                  if (canvas) {
                      canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
                      canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
                      canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
                      document.addEventListener("pointerlockchange", pointerLockChange, false);
                      document.addEventListener("mozpointerlockchange", pointerLockChange, false);
                      document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
                      document.addEventListener("mspointerlockchange", pointerLockChange, false);
                      if (Module["elementPointerLock"]) {
                          canvas.addEventListener("click", ev => {
                              if (!Browser.pointerLock && Browser.getCanvas().requestPointerLock) {
                                  Browser.getCanvas().requestPointerLock();
                                  ev.preventDefault()
                              }
                          }, false)
                      }
                  }
              },
              createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
                  if (useWebGL && Module["ctx"] && canvas == Browser.getCanvas()) return Module["ctx"];
                  var ctx;
                  var contextHandle;
                  if (useWebGL) {
                      var contextAttributes = {
                          antialias: false,
                          alpha: false,
                          majorVersion: 1
                      };
                      if (webGLContextAttributes) {
                          for (var attribute in webGLContextAttributes) {
                              contextAttributes[attribute] = webGLContextAttributes[attribute]
                          }
                      }
                      if (typeof GL != "undefined") {
                          contextHandle = GL.createContext(canvas, contextAttributes);
                          if (contextHandle) {
                              ctx = GL.getContext(contextHandle).GLctx
                          }
                      }
                  } else {
                      ctx = canvas.getContext("2d")
                  }
                  if (!ctx) return null;
                  if (setInModule) {
                      Module["ctx"] = ctx;
                      if (useWebGL) GL.makeContextCurrent(contextHandle);
                      Browser.useWebGL = useWebGL;
                      Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
                      Browser.init()
                  }
                  return ctx
              },
              fullscreenHandlersInstalled: false,
              lockPointer: undefined,
              resizeCanvas: undefined,
              requestFullscreen(lockPointer, resizeCanvas) {
                  Browser.lockPointer = lockPointer;
                  Browser.resizeCanvas = resizeCanvas;
                  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
                  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
                  var canvas = Browser.getCanvas();

                  function fullscreenChange() {
                      Browser.isFullscreen = false;
                      var canvasContainer = canvas.parentNode;
                      if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                          canvas.exitFullscreen = Browser.exitFullscreen;
                          if (Browser.lockPointer) canvas.requestPointerLock();
                          Browser.isFullscreen = true;
                          if (Browser.resizeCanvas) {
                              Browser.setFullscreenCanvasSize()
                          } else {
                              Browser.updateCanvasDimensions(canvas)
                          }
                      } else {
                          canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                          canvasContainer.parentNode.removeChild(canvasContainer);
                          if (Browser.resizeCanvas) {
                              Browser.setWindowedCanvasSize()
                          } else {
                              Browser.updateCanvasDimensions(canvas)
                          }
                      }
                      Module["onFullScreen"]?.(Browser.isFullscreen);
                      Module["onFullscreen"]?.(Browser.isFullscreen)
                  }
                  if (!Browser.fullscreenHandlersInstalled) {
                      Browser.fullscreenHandlersInstalled = true;
                      document.addEventListener("fullscreenchange", fullscreenChange, false);
                      document.addEventListener("mozfullscreenchange", fullscreenChange, false);
                      document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
                      document.addEventListener("MSFullscreenChange", fullscreenChange, false)
                  }
                  var canvasContainer = document.createElement("div");
                  canvas.parentNode.insertBefore(canvasContainer, canvas);
                  canvasContainer.appendChild(canvas);
                  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
                  canvasContainer.requestFullscreen()
              },
              exitFullscreen() {
                  if (!Browser.isFullscreen) {
                      return false
                  }
                  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
                  CFS.apply(document, []);
                  return true
              },
              safeSetTimeout(func, timeout) {
                  return safeSetTimeout(func, timeout)
              },
              getMimetype(name) {
                  return {
                      jpg: "image/jpeg",
                      jpeg: "image/jpeg",
                      png: "image/png",
                      bmp: "image/bmp",
                      ogg: "audio/ogg",
                      wav: "audio/wav",
                      mp3: "audio/mpeg"
                  } [name.slice(name.lastIndexOf(".") + 1)]
              },
              getUserMedia(func) {
                  window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
                  window.getUserMedia(func)
              },
              getMovementX(event) {
                  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
              },
              getMovementY(event) {
                  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
              },
              getMouseWheelDelta(event) {
                  var delta = 0;
                  switch (event.type) {
                      case "DOMMouseScroll":
                          delta = event.detail / 3;
                          break;
                      case "mousewheel":
                          delta = event.wheelDelta / 120;
                          break;
                      case "wheel":
                          delta = event.deltaY;
                          switch (event.deltaMode) {
                              case 0:
                                  delta /= 100;
                                  break;
                              case 1:
                                  delta /= 3;
                                  break;
                              case 2:
                                  delta *= 80;
                                  break;
                              default:
                                  throw "unrecognized mouse wheel delta mode: " + event.deltaMode
                          }
                          break;
                      default:
                          throw "unrecognized mouse wheel event: " + event.type
                  }
                  return delta
              },
              mouseX: 0,
              mouseY: 0,
              mouseMovementX: 0,
              mouseMovementY: 0,
              touches: {},
              lastTouches: {},
              calculateMouseCoords(pageX, pageY) {
                  var canvas = Browser.getCanvas();
                  var rect = canvas.getBoundingClientRect();
                  var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
                  var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
                  var adjustedX = pageX - (scrollX + rect.left);
                  var adjustedY = pageY - (scrollY + rect.top);
                  adjustedX = adjustedX * (canvas.width / rect.width);
                  adjustedY = adjustedY * (canvas.height / rect.height);
                  return {
                      x: adjustedX,
                      y: adjustedY
                  }
              },
              setMouseCoords(pageX, pageY) {
                  const {
                      x,
                      y
                  } = Browser.calculateMouseCoords(pageX, pageY);
                  Browser.mouseMovementX = x - Browser.mouseX;
                  Browser.mouseMovementY = y - Browser.mouseY;
                  Browser.mouseX = x;
                  Browser.mouseY = y
              },
              calculateMouseEvent(event) {
                  if (Browser.pointerLock) {
                      if (event.type != "mousemove" && "mozMovementX" in event) {
                          Browser.mouseMovementX = Browser.mouseMovementY = 0
                      } else {
                          Browser.mouseMovementX = Browser.getMovementX(event);
                          Browser.mouseMovementY = Browser.getMovementY(event)
                      }
                      Browser.mouseX += Browser.mouseMovementX;
                      Browser.mouseY += Browser.mouseMovementY
                  } else {
                      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                          var touch = event.touch;
                          if (touch === undefined) {
                              return
                          }
                          var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
                          if (event.type === "touchstart") {
                              Browser.lastTouches[touch.identifier] = coords;
                              Browser.touches[touch.identifier] = coords
                          } else if (event.type === "touchend" || event.type === "touchmove") {
                              var last = Browser.touches[touch.identifier];
                              last ||= coords;
                              Browser.lastTouches[touch.identifier] = last;
                              Browser.touches[touch.identifier] = coords
                          }
                          return
                      }
                      Browser.setMouseCoords(event.pageX, event.pageY)
                  }
              },
              resizeListeners: [],
              updateResizeListeners() {
                  var canvas = Browser.getCanvas();
                  Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height))
              },
              setCanvasSize(width, height, noUpdates) {
                  var canvas = Browser.getCanvas();
                  Browser.updateCanvasDimensions(canvas, width, height);
                  if (!noUpdates) Browser.updateResizeListeners()
              },
              windowedWidth: 0,
              windowedHeight: 0,
              setFullscreenCanvasSize() {
                  if (typeof SDL != "undefined") {
                      var flags = HEAPU32[SDL.screen >> 2];
                      flags = flags | 8388608;
                      HEAP32[SDL.screen >> 2] = flags
                  }
                  Browser.updateCanvasDimensions(Browser.getCanvas());
                  Browser.updateResizeListeners()
              },
              setWindowedCanvasSize() {
                  if (typeof SDL != "undefined") {
                      var flags = HEAPU32[SDL.screen >> 2];
                      flags = flags & ~8388608;
                      HEAP32[SDL.screen >> 2] = flags
                  }
                  Browser.updateCanvasDimensions(Browser.getCanvas());
                  Browser.updateResizeListeners()
              },
              updateCanvasDimensions(canvas, wNative, hNative) {
                  if (wNative && hNative) {
                      canvas.widthNative = wNative;
                      canvas.heightNative = hNative
                  } else {
                      wNative = canvas.widthNative;
                      hNative = canvas.heightNative
                  }
                  var w = wNative;
                  var h = hNative;
                  if (Module["forcedAspectRatio"] > 0) {
                      if (w / h < Module["forcedAspectRatio"]) {
                          w = Math.round(h * Module["forcedAspectRatio"])
                      } else {
                          h = Math.round(w / Module["forcedAspectRatio"])
                      }
                  }
                  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
                      var factor = Math.min(screen.width / w, screen.height / h);
                      w = Math.round(w * factor);
                      h = Math.round(h * factor)
                  }
                  if (Browser.resizeCanvas) {
                      if (canvas.width != w) canvas.width = w;
                      if (canvas.height != h) canvas.height = h;
                      if (typeof canvas.style != "undefined") {
                          canvas.style.removeProperty("width");
                          canvas.style.removeProperty("height")
                      }
                  } else {
                      if (canvas.width != wNative) canvas.width = wNative;
                      if (canvas.height != hNative) canvas.height = hNative;
                      if (typeof canvas.style != "undefined") {
                          if (w != wNative || h != hNative) {
                              canvas.style.setProperty("width", w + "px", "important");
                              canvas.style.setProperty("height", h + "px", "important")
                          } else {
                              canvas.style.removeProperty("width");
                              canvas.style.removeProperty("height")
                          }
                      }
                  }
              }
          };
          var EGL = {
              errorCode: 12288,
              defaultDisplayInitialized: false,
              currentContext: 0,
              currentReadSurface: 0,
              currentDrawSurface: 0,
              contextAttributes: {
                  alpha: false,
                  depth: false,
                  stencil: false,
                  antialias: false
              },
              stringCache: {},
              setErrorCode(code) {
                  EGL.errorCode = code
              },
              chooseConfig(display, attribList, config, config_size, numConfigs) {
                  if (display != 62e3) {
                      EGL.setErrorCode(12296);
                      return 0
                  }
                  if (attribList) {
                      for (;;) {
                          var param = HEAP32[attribList >> 2];
                          if (param == 12321) {
                              var alphaSize = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.alpha = alphaSize > 0
                          } else if (param == 12325) {
                              var depthSize = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.depth = depthSize > 0
                          } else if (param == 12326) {
                              var stencilSize = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.stencil = stencilSize > 0
                          } else if (param == 12337) {
                              var samples = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.antialias = samples > 0
                          } else if (param == 12338) {
                              var samples = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.antialias = samples == 1
                          } else if (param == 12544) {
                              var requestedPriority = HEAP32[attribList + 4 >> 2];
                              EGL.contextAttributes.lowLatency = requestedPriority != 12547
                          } else if (param == 12344) {
                              break
                          }
                          attribList += 8
                      }
                  }
                  if ((!config || !config_size) && !numConfigs) {
                      EGL.setErrorCode(12300);
                      return 0
                  }
                  if (numConfigs) {
                      HEAP32[numConfigs >> 2] = 1
                  }
                  if (config && config_size > 0) {
                      HEAPU32[config >> 2] = 62002
                  }
                  EGL.setErrorCode(12288);
                  return 1
              }
          };

          function _eglBindAPI(api) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 0, 1, api);
              if (api == 12448) {
                  EGL.setErrorCode(12288);
                  return 1
              }
              EGL.setErrorCode(12300);
              return 0
          }

          function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 0, 1, display, attrib_list, configs, config_size, numConfigs);
              return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs)
          }
          var GLctx;
          var webgl_enable_ANGLE_instanced_arrays = ctx => {
              var ext = ctx.getExtension("ANGLE_instanced_arrays");
              if (ext) {
                  ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
                  ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
                  ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
                  return 1
              }
          };
          var webgl_enable_OES_vertex_array_object = ctx => {
              var ext = ctx.getExtension("OES_vertex_array_object");
              if (ext) {
                  ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
                  ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
                  ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
                  ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
                  return 1
              }
          };
          var webgl_enable_WEBGL_draw_buffers = ctx => {
              var ext = ctx.getExtension("WEBGL_draw_buffers");
              if (ext) {
                  ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
                  return 1
              }
          };
          var webgl_enable_EXT_polygon_offset_clamp = ctx => !!(ctx.extPolygonOffsetClamp = ctx.getExtension("EXT_polygon_offset_clamp"));
          var webgl_enable_EXT_clip_control = ctx => !!(ctx.extClipControl = ctx.getExtension("EXT_clip_control"));
          var webgl_enable_WEBGL_polygon_mode = ctx => !!(ctx.webglPolygonMode = ctx.getExtension("WEBGL_polygon_mode"));
          var webgl_enable_WEBGL_multi_draw = ctx => !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
          var getEmscriptenSupportedExtensions = ctx => {
              var supportedExtensions = ["ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_disjoint_timer_query", "EXT_frag_depth", "EXT_shader_texture_lod", "EXT_sRGB", "OES_element_index_uint", "OES_fbo_render_mipmap", "OES_standard_derivatives", "OES_texture_float", "OES_texture_half_float", "OES_texture_half_float_linear", "OES_vertex_array_object", "WEBGL_color_buffer_float", "WEBGL_depth_texture", "WEBGL_draw_buffers", "EXT_clip_control", "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_float_blend", "EXT_polygon_offset_clamp", "EXT_texture_compression_bptc", "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic", "KHR_parallel_shader_compile", "OES_texture_float_linear", "WEBGL_blend_func_extended", "WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_debug_renderer_info", "WEBGL_debug_shaders", "WEBGL_lose_context", "WEBGL_multi_draw", "WEBGL_polygon_mode"];
              return (ctx.getSupportedExtensions() || []).filter(ext => supportedExtensions.includes(ext))
          };
          var GL = {
              counter: 1,
              buffers: [],
              programs: [],
              framebuffers: [],
              renderbuffers: [],
              textures: [],
              shaders: [],
              vaos: [],
              contexts: {},
              offscreenCanvases: {},
              queries: [],
              stringCache: {},
              unpackAlignment: 4,
              unpackRowLength: 0,
              recordError: errorCode => {
                  if (!GL.lastError) {
                      GL.lastError = errorCode
                  }
              },
              getNewId: table => {
                  var ret = GL.counter++;
                  for (var i = table.length; i < ret; i++) {
                      table[i] = null
                  }
                  return ret
              },
              genObject: (n, buffers, createFunction, objectTable) => {
                  for (var i = 0; i < n; i++) {
                      var buffer = GLctx[createFunction]();
                      var id = buffer && GL.getNewId(objectTable);
                      if (buffer) {
                          buffer.name = id;
                          objectTable[id] = buffer
                      } else {
                          GL.recordError(1282)
                      }
                      HEAP32[buffers + i * 4 >> 2] = id
                  }
              },
              getSource: (shader, count, string, length) => {
                  var source = "";
                  for (var i = 0; i < count; ++i) {
                      var len = length ? HEAPU32[length + i * 4 >> 2] : undefined;
                      source += UTF8ToString(HEAPU32[string + i * 4 >> 2], len)
                  }
                  return source
              },
              createContext: (canvas, webGLContextAttributes) => {
                  if (!canvas.getContextSafariWebGL2Fixed) {
                      canvas.getContextSafariWebGL2Fixed = canvas.getContext;

                      function fixedGetContext(ver, attrs) {
                          var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                          return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
                      }
                      canvas.getContext = fixedGetContext
                  }
                  var ctx = canvas.getContext("webgl", webGLContextAttributes);
                  if (!ctx) return 0;
                  var handle = GL.registerContext(ctx, webGLContextAttributes);
                  return handle
              },
              registerContext: (ctx, webGLContextAttributes) => {
                  var handle = _malloc(8);
                  HEAPU32[handle + 4 >> 2] = _pthread_self();
                  var context = {
                      handle,
                      attributes: webGLContextAttributes,
                      version: webGLContextAttributes.majorVersion,
                      GLctx: ctx
                  };
                  if (ctx.canvas) ctx.canvas.GLctxObject = context;
                  GL.contexts[handle] = context;
                  if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
                      GL.initExtensions(context)
                  }
                  return handle
              },
              makeContextCurrent: contextHandle => {
                  GL.currentContext = GL.contexts[contextHandle];
                  Module["ctx"] = GLctx = GL.currentContext?.GLctx;
                  return !(contextHandle && !GLctx)
              },
              getContext: contextHandle => GL.contexts[contextHandle],
              deleteContext: contextHandle => {
                  if (GL.currentContext === GL.contexts[contextHandle]) {
                      GL.currentContext = null
                  }
                  if (typeof JSEvents == "object") {
                      JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas)
                  }
                  if (GL.contexts[contextHandle]?.GLctx.canvas) {
                      GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined
                  }
                  _free(GL.contexts[contextHandle].handle);
                  GL.contexts[contextHandle] = null
              },
              initExtensions: context => {
                  context ||= GL.currentContext;
                  if (context.initExtensionsDone) return;
                  context.initExtensionsDone = true;
                  var GLctx = context.GLctx;
                  webgl_enable_WEBGL_multi_draw(GLctx);
                  webgl_enable_EXT_polygon_offset_clamp(GLctx);
                  webgl_enable_EXT_clip_control(GLctx);
                  webgl_enable_WEBGL_polygon_mode(GLctx);
                  webgl_enable_ANGLE_instanced_arrays(GLctx);
                  webgl_enable_OES_vertex_array_object(GLctx);
                  webgl_enable_WEBGL_draw_buffers(GLctx);
                  {
                      GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
                  }
                  getEmscriptenSupportedExtensions(GLctx).forEach(ext => {
                      if (!ext.includes("lose_context") && !ext.includes("debug")) {
                          GLctx.getExtension(ext)
                      }
                  })
              }
          };

          function _eglCreateContext(display, config, hmm, contextAttribs) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 0, 1, display, config, hmm, contextAttribs);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              var glesContextVersion = 1;
              for (;;) {
                  var param = HEAP32[contextAttribs >> 2];
                  if (param == 12440) {
                      glesContextVersion = HEAP32[contextAttribs + 4 >> 2]
                  } else if (param == 12344) {
                      break
                  } else {
                      EGL.setErrorCode(12292);
                      return 0
                  }
                  contextAttribs += 8
              }
              if (glesContextVersion != 2) {
                  EGL.setErrorCode(12293);
                  return 0
              }
              EGL.contextAttributes.majorVersion = glesContextVersion - 1;
              EGL.contextAttributes.minorVersion = 0;
              EGL.context = GL.createContext(Browser.getCanvas(), EGL.contextAttributes);
              if (EGL.context != 0) {
                  EGL.setErrorCode(12288);
                  GL.makeContextCurrent(EGL.context);
                  Browser.useWebGL = true;
                  Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
                  GL.makeContextCurrent(null);
                  return 62004
              } else {
                  EGL.setErrorCode(12297);
                  return 0
              }
          }

          function _eglCreateWindowSurface(display, config, win, attrib_list) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 0, 1, display, config, win, attrib_list);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (config != 62002) {
                  EGL.setErrorCode(12293);
                  return 0
              }
              EGL.setErrorCode(12288);
              return 62006
          }

          function _eglDestroyContext(display, context) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(25, 0, 1, display, context);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (context != 62004) {
                  EGL.setErrorCode(12294);
                  return 0
              }
              GL.deleteContext(EGL.context);
              EGL.setErrorCode(12288);
              if (EGL.currentContext == context) {
                  EGL.currentContext = 0
              }
              return 1
          }

          function _eglDestroySurface(display, surface) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(26, 0, 1, display, surface);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (surface != 62006) {
                  EGL.setErrorCode(12301);
                  return 1
              }
              if (EGL.currentReadSurface == surface) {
                  EGL.currentReadSurface = 0
              }
              if (EGL.currentDrawSurface == surface) {
                  EGL.currentDrawSurface = 0
              }
              EGL.setErrorCode(12288);
              return 1
          }

          function _eglGetConfigAttrib(display, config, attribute, value) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(27, 0, 1, display, config, attribute, value);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (config != 62002) {
                  EGL.setErrorCode(12293);
                  return 0
              }
              if (!value) {
                  EGL.setErrorCode(12300);
                  return 0
              }
              EGL.setErrorCode(12288);
              switch (attribute) {
                  case 12320:
                      HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 32 : 24;
                      return 1;
                  case 12321:
                      HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 8 : 0;
                      return 1;
                  case 12322:
                      HEAP32[value >> 2] = 8;
                      return 1;
                  case 12323:
                      HEAP32[value >> 2] = 8;
                      return 1;
                  case 12324:
                      HEAP32[value >> 2] = 8;
                      return 1;
                  case 12325:
                      HEAP32[value >> 2] = EGL.contextAttributes.depth ? 24 : 0;
                      return 1;
                  case 12326:
                      HEAP32[value >> 2] = EGL.contextAttributes.stencil ? 8 : 0;
                      return 1;
                  case 12327:
                      HEAP32[value >> 2] = 12344;
                      return 1;
                  case 12328:
                      HEAP32[value >> 2] = 62002;
                      return 1;
                  case 12329:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12330:
                      HEAP32[value >> 2] = 4096;
                      return 1;
                  case 12331:
                      HEAP32[value >> 2] = 16777216;
                      return 1;
                  case 12332:
                      HEAP32[value >> 2] = 4096;
                      return 1;
                  case 12333:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12334:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12335:
                      HEAP32[value >> 2] = 12344;
                      return 1;
                  case 12337:
                      HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 4 : 0;
                      return 1;
                  case 12338:
                      HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 1 : 0;
                      return 1;
                  case 12339:
                      HEAP32[value >> 2] = 4;
                      return 1;
                  case 12340:
                      HEAP32[value >> 2] = 12344;
                      return 1;
                  case 12341:
                  case 12342:
                  case 12343:
                      HEAP32[value >> 2] = -1;
                      return 1;
                  case 12345:
                  case 12346:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12347:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12348:
                      HEAP32[value >> 2] = 1;
                      return 1;
                  case 12349:
                  case 12350:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  case 12351:
                      HEAP32[value >> 2] = 12430;
                      return 1;
                  case 12352:
                      HEAP32[value >> 2] = 4;
                      return 1;
                  case 12354:
                      HEAP32[value >> 2] = 0;
                      return 1;
                  default:
                      EGL.setErrorCode(12292);
                      return 0
              }
          }

          function _eglGetDisplay(nativeDisplayType) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(28, 0, 1, nativeDisplayType);
              EGL.setErrorCode(12288);
              if (nativeDisplayType != 0 && nativeDisplayType != 1) {
                  return 0
              }
              return 62e3
          }

          function _eglGetError() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(29, 0, 1);
              return EGL.errorCode
          }

          function _eglInitialize(display, majorVersion, minorVersion) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(30, 0, 1, display, majorVersion, minorVersion);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (majorVersion) {
                  HEAP32[majorVersion >> 2] = 1
              }
              if (minorVersion) {
                  HEAP32[minorVersion >> 2] = 4
              }
              EGL.defaultDisplayInitialized = true;
              EGL.setErrorCode(12288);
              return 1
          }

          function _eglMakeCurrent(display, draw, read, context) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(31, 0, 1, display, draw, read, context);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (context != 0 && context != 62004) {
                  EGL.setErrorCode(12294);
                  return 0
              }
              if (read != 0 && read != 62006 || draw != 0 && draw != 62006) {
                  EGL.setErrorCode(12301);
                  return 0
              }
              GL.makeContextCurrent(context ? EGL.context : null);
              EGL.currentContext = context;
              EGL.currentDrawSurface = draw;
              EGL.currentReadSurface = read;
              EGL.setErrorCode(12288);
              return 1
          }
          var stringToNewUTF8 = str => {
              var size = lengthBytesUTF8(str) + 1;
              var ret = _malloc(size);
              if (ret) stringToUTF8(str, ret, size);
              return ret
          };

          function _eglQueryString(display, name) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(32, 0, 1, display, name);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              EGL.setErrorCode(12288);
              if (EGL.stringCache[name]) return EGL.stringCache[name];
              var ret;
              switch (name) {
                  case 12371:
                      ret = stringToNewUTF8("Emscripten");
                      break;
                  case 12372:
                      ret = stringToNewUTF8("1.4 Emscripten EGL");
                      break;
                  case 12373:
                      ret = stringToNewUTF8("");
                      break;
                  case 12429:
                      ret = stringToNewUTF8("OpenGL_ES");
                      break;
                  default:
                      EGL.setErrorCode(12300);
                      return 0
              }
              EGL.stringCache[name] = ret;
              return ret
          }

          function _eglSwapBuffers(dpy, surface) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(33, 0, 1, dpy, surface);
              if (!EGL.defaultDisplayInitialized) {
                  EGL.setErrorCode(12289)
              } else if (!GLctx) {
                  EGL.setErrorCode(12290)
              } else if (GLctx.isContextLost()) {
                  EGL.setErrorCode(12302)
              } else {
                  EGL.setErrorCode(12288);
                  return 1
              }
              return 0
          }
          var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
              MainLoop.func = iterFunc;
              MainLoop.arg = arg;
              var thisMainLoopId = MainLoop.currentlyRunningMainloop;

              function checkIsRunning() {
                  if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
                      runtimeKeepalivePop();
                      maybeExit();
                      return false
                  }
                  return true
              }
              MainLoop.running = false;
              MainLoop.runner = function MainLoop_runner() {
                  if (ABORT) return;
                  if (MainLoop.queue.length > 0) {
                      var start = Date.now();
                      var blocker = MainLoop.queue.shift();
                      blocker.func(blocker.arg);
                      if (MainLoop.remainingBlockers) {
                          var remaining = MainLoop.remainingBlockers;
                          var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                          if (blocker.counted) {
                              MainLoop.remainingBlockers = next
                          } else {
                              next = next + .5;
                              MainLoop.remainingBlockers = (8 * remaining + next) / 9
                          }
                      }
                      MainLoop.updateStatus();
                      if (!checkIsRunning()) return;
                      setTimeout(MainLoop.runner, 0);
                      return
                  }
                  if (!checkIsRunning()) return;
                  MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
                  if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
                      MainLoop.scheduler();
                      return
                  } else if (MainLoop.timingMode == 0) {
                      MainLoop.tickStartTime = _emscripten_get_now()
                  }
                  MainLoop.runIter(iterFunc);
                  if (!checkIsRunning()) return;
                  MainLoop.scheduler()
              };
              if (!noSetTiming) {
                  if (fps > 0) {
                      _emscripten_set_main_loop_timing(0, 1e3 / fps)
                  } else {
                      _emscripten_set_main_loop_timing(1, 1)
                  }
                  MainLoop.scheduler()
              }
              if (simulateInfiniteLoop) {
                  throw "unwind"
              }
          };
          var MainLoop = {
              running: false,
              scheduler: null,
              method: "",
              currentlyRunningMainloop: 0,
              func: null,
              arg: 0,
              timingMode: 0,
              timingValue: 0,
              currentFrameNumber: 0,
              queue: [],
              preMainLoop: [],
              postMainLoop: [],
              pause() {
                  MainLoop.scheduler = null;
                  MainLoop.currentlyRunningMainloop++
              },
              resume() {
                  MainLoop.currentlyRunningMainloop++;
                  var timingMode = MainLoop.timingMode;
                  var timingValue = MainLoop.timingValue;
                  var func = MainLoop.func;
                  MainLoop.func = null;
                  setMainLoop(func, 0, false, MainLoop.arg, true);
                  _emscripten_set_main_loop_timing(timingMode, timingValue);
                  MainLoop.scheduler()
              },
              updateStatus() {
                  if (Module["setStatus"]) {
                      var message = Module["statusMessage"] || "Please wait...";
                      var remaining = MainLoop.remainingBlockers ?? 0;
                      var expected = MainLoop.expectedBlockers ?? 0;
                      if (remaining) {
                          if (remaining < expected) {
                              Module["setStatus"](`{message} ({expected - remaining}/{expected})`)
                          } else {
                              Module["setStatus"](message)
                          }
                      } else {
                          Module["setStatus"]("")
                      }
                  }
              },
              init() {
                  Module["preMainLoop"] && MainLoop.preMainLoop.push(Module["preMainLoop"]);
                  Module["postMainLoop"] && MainLoop.postMainLoop.push(Module["postMainLoop"])
              },
              runIter(func) {
                  if (ABORT) return;
                  for (var pre of MainLoop.preMainLoop) {
                      if (pre() === false) {
                          return
                      }
                  }
                  callUserCallback(func);
                  for (var post of MainLoop.postMainLoop) {
                      post()
                  }
              },
              nextRAF: 0,
              fakeRequestAnimationFrame(func) {
                  var now = Date.now();
                  if (MainLoop.nextRAF === 0) {
                      MainLoop.nextRAF = now + 1e3 / 60
                  } else {
                      while (now + 2 >= MainLoop.nextRAF) {
                          MainLoop.nextRAF += 1e3 / 60
                      }
                  }
                  var delay = Math.max(MainLoop.nextRAF - now, 0);
                  setTimeout(func, delay)
              },
              requestAnimationFrame(func) {
                  if (typeof requestAnimationFrame == "function") {
                      requestAnimationFrame(func);
                      return
                  }
                  var RAF = MainLoop.fakeRequestAnimationFrame;
                  RAF(func)
              }
          };
          var _emscripten_set_main_loop_timing = (mode, value) => {
              MainLoop.timingMode = mode;
              MainLoop.timingValue = value;
              if (!MainLoop.func) {
                  return 1
              }
              if (!MainLoop.running) {
                  runtimeKeepalivePush();
                  MainLoop.running = true
              }
              if (mode == 0) {
                  MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
                      var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
                      setTimeout(MainLoop.runner, timeUntilNextTick)
                  };
                  MainLoop.method = "timeout"
              } else if (mode == 1) {
                  MainLoop.scheduler = function MainLoop_scheduler_rAF() {
                      MainLoop.requestAnimationFrame(MainLoop.runner)
                  };
                  MainLoop.method = "rAF"
              } else if (mode == 2) {
                  if (typeof MainLoop.setImmediate == "undefined") {
                      if (typeof setImmediate == "undefined") {
                          var setImmediates = [];
                          var emscriptenMainLoopMessageId = "setimmediate";
                          var MainLoop_setImmediate_messageHandler = event => {
                              if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                                  event.stopPropagation();
                                  setImmediates.shift()()
                              }
                          };
                          addEventListener("message", MainLoop_setImmediate_messageHandler, true);
                          MainLoop.setImmediate = func => {
                              setImmediates.push(func);
                              if (ENVIRONMENT_IS_WORKER) {
                                  Module["setImmediates"] ??= [];
                                  Module["setImmediates"].push(func);
                                  postMessage({
                                      target: emscriptenMainLoopMessageId
                                  })
                              } else postMessage(emscriptenMainLoopMessageId, "*")
                          }
                      } else {
                          MainLoop.setImmediate = setImmediate
                      }
                  }
                  MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
                      MainLoop.setImmediate(MainLoop.runner)
                  };
                  MainLoop.method = "immediate"
              }
              return 0
          };

          function _eglSwapInterval(display, interval) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(34, 0, 1, display, interval);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
              else _emscripten_set_main_loop_timing(1, interval);
              EGL.setErrorCode(12288);
              return 1
          }

          function _eglTerminate(display) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(35, 0, 1, display);
              if (display != 62e3) {
                  EGL.setErrorCode(12296);
                  return 0
              }
              EGL.currentContext = 0;
              EGL.currentReadSurface = 0;
              EGL.currentDrawSurface = 0;
              EGL.defaultDisplayInitialized = false;
              EGL.setErrorCode(12288);
              return 1
          }

          function _eglWaitClient() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(36, 0, 1);
              EGL.setErrorCode(12288);
              return 1
          }
          var _eglWaitGL = _eglWaitClient;

          function _eglWaitNative(nativeEngineId) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(37, 0, 1, nativeEngineId);
              EGL.setErrorCode(12288);
              return 1
          }
          var readEmAsmArgsArray = [];
          var readEmAsmArgs = (sigPtr, buf) => {
              readEmAsmArgsArray.length = 0;
              var ch;
              while (ch = HEAPU8[sigPtr++]) {
                  var wide = ch != 105;
                  wide &= ch != 112;
                  buf += wide && buf % 8 ? 4 : 0;
                  readEmAsmArgsArray.push(ch == 112 ? HEAPU32[buf >> 2] : ch == 106 ? HEAP64[buf >> 3] : ch == 105 ? HEAP32[buf >> 2] : HEAPF64[buf >> 3]);
                  buf += wide ? 8 : 4
              }
              return readEmAsmArgsArray
          };
          var runEmAsmFunction = (code, sigPtr, argbuf) => {
              var args = readEmAsmArgs(sigPtr, argbuf);
              return ASM_CONSTS[code](...args)
          };
          var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
          var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
              var args = readEmAsmArgs(sigPtr, argbuf);
              if (ENVIRONMENT_IS_PTHREAD) {
                  return proxyToMainThread(0, emAsmAddr, sync, ...args)
              }
              return ASM_CONSTS[emAsmAddr](...args)
          };
          var _emscripten_asm_const_int_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
          var _emscripten_asm_const_ptr_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
          var _emscripten_cancel_main_loop = () => {
              MainLoop.pause();
              MainLoop.func = null
          };
          var _emscripten_check_blocking_allowed = () => {};
          var JSEvents = {
              memcpy(target, src, size) {
                  HEAP8.set(HEAP8.subarray(src, src + size), target)
              },
              removeAllEventListeners() {
                  while (JSEvents.eventHandlers.length) {
                      JSEvents._removeHandler(JSEvents.eventHandlers.length - 1)
                  }
                  JSEvents.deferredCalls = []
              },
              inEventHandler: 0,
              deferredCalls: [],
              deferCall(targetFunction, precedence, argsList) {
                  function arraysHaveEqualContent(arrA, arrB) {
                      if (arrA.length != arrB.length) return false;
                      for (var i in arrA) {
                          if (arrA[i] != arrB[i]) return false
                      }
                      return true
                  }
                  for (var call of JSEvents.deferredCalls) {
                      if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                          return
                      }
                  }
                  JSEvents.deferredCalls.push({
                      targetFunction,
                      precedence,
                      argsList
                  });
                  JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence)
              },
              removeDeferredCalls(targetFunction) {
                  JSEvents.deferredCalls = JSEvents.deferredCalls.filter(call => call.targetFunction != targetFunction)
              },
              canPerformEventHandlerRequests() {
                  if (navigator.userActivation) {
                      return navigator.userActivation.isActive
                  }
                  return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
              },
              runDeferredCalls() {
                  if (!JSEvents.canPerformEventHandlerRequests()) {
                      return
                  }
                  var deferredCalls = JSEvents.deferredCalls;
                  JSEvents.deferredCalls = [];
                  for (var call of deferredCalls) {
                      call.targetFunction(...call.argsList)
                  }
              },
              eventHandlers: [],
              removeAllHandlersOnTarget: (target, eventTypeString) => {
                  for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                      if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                          JSEvents._removeHandler(i--)
                      }
                  }
              },
              _removeHandler(i) {
                  var h = JSEvents.eventHandlers[i];
                  h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
                  JSEvents.eventHandlers.splice(i, 1)
              },
              registerOrRemoveHandler(eventHandler) {
                  if (!eventHandler.target) {
                      return -4
                  }
                  if (eventHandler.callbackfunc) {
                      eventHandler.eventListenerFunc = function(event) {
                          ++JSEvents.inEventHandler;
                          JSEvents.currentEventHandler = eventHandler;
                          JSEvents.runDeferredCalls();
                          eventHandler.handlerFunc(event);
                          JSEvents.runDeferredCalls();
                          --JSEvents.inEventHandler
                      };
                      eventHandler.target.addEventListener(eventHandler.eventTypeString, eventHandler.eventListenerFunc, eventHandler.useCapture);
                      JSEvents.eventHandlers.push(eventHandler)
                  } else {
                      for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                          if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                              JSEvents._removeHandler(i--)
                          }
                      }
                  }
                  return 0
              },
              getTargetThreadForEventCallback(targetThread) {
                  switch (targetThread) {
                      case 1:
                          return 0;
                      case 2:
                          return PThread.currentProxiedOperationCallerThread;
                      default:
                          return targetThread
                  }
              },
              getNodeNameForTarget(target) {
                  if (!target) return "";
                  if (target == window) return "#window";
                  if (target == screen) return "#screen";
                  return target?.nodeName || ""
              },
              fullscreenEnabled() {
                  return document.fullscreenEnabled || document.webkitFullscreenEnabled
              }
          };
          var currentFullscreenStrategy = {};
          var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;
          var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
          var findEventTarget = target => {
              target = maybeCStringToJsString(target);
              var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : null);
              return domElement
          };
          var findCanvasEventTarget = findEventTarget;
          var getCanvasSizeCallingThread = (target, width, height) => {
              var canvas = findCanvasEventTarget(target);
              if (!canvas) return -4;
              if (!canvas.controlTransferredOffscreen) {
                  HEAP32[width >> 2] = canvas.width;
                  HEAP32[height >> 2] = canvas.height
              } else {
                  return -4
              }
              return 0
          };

          function getCanvasSizeMainThread(target, width, height) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(39, 0, 1, target, width, height);
              return getCanvasSizeCallingThread(target, width, height)
          }
          var _emscripten_get_canvas_element_size = (target, width, height) => {
              var canvas = findCanvasEventTarget(target);
              if (canvas) {
                  return getCanvasSizeCallingThread(target, width, height)
              }
              return getCanvasSizeMainThread(target, width, height)
          };
          var stringToUTF8OnStack = str => {
              var size = lengthBytesUTF8(str) + 1;
              var ret = stackAlloc(size);
              stringToUTF8(str, ret, size);
              return ret
          };
          var getCanvasElementSize = target => {
              var sp = stackSave();
              var w = stackAlloc(8);
              var h = w + 4;
              var targetInt = stringToUTF8OnStack(target.id);
              var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
              var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
              stackRestore(sp);
              return size
          };
          var setCanvasElementSizeCallingThread = (target, width, height) => {
              var canvas = findCanvasEventTarget(target);
              if (!canvas) return -4;
              if (!canvas.controlTransferredOffscreen) {
                  var autoResizeViewport = false;
                  if (canvas.GLctxObject?.GLctx) {
                      var prevViewport = canvas.GLctxObject.GLctx.getParameter(2978);
                      autoResizeViewport = prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height
                  }
                  canvas.width = width;
                  canvas.height = height;
                  if (autoResizeViewport) {
                      canvas.GLctxObject.GLctx.viewport(0, 0, width, height)
                  }
              } else {
                  return -4
              }
              return 0
          };

          function setCanvasElementSizeMainThread(target, width, height) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(40, 0, 1, target, width, height);
              return setCanvasElementSizeCallingThread(target, width, height)
          }
          var _emscripten_set_canvas_element_size = (target, width, height) => {
              var canvas = findCanvasEventTarget(target);
              if (canvas) {
                  return setCanvasElementSizeCallingThread(target, width, height)
              }
              return setCanvasElementSizeMainThread(target, width, height)
          };
          var setCanvasElementSize = (target, width, height) => {
              if (!target.controlTransferredOffscreen) {
                  target.width = width;
                  target.height = height
              } else {
                  var sp = stackSave();
                  var targetInt = stringToUTF8OnStack(target.id);
                  _emscripten_set_canvas_element_size(targetInt, width, height);
                  stackRestore(sp)
              }
          };
          var registerRestoreOldStyle = canvas => {
              var canvasSize = getCanvasElementSize(canvas);
              var oldWidth = canvasSize[0];
              var oldHeight = canvasSize[1];
              var oldCssWidth = canvas.style.width;
              var oldCssHeight = canvas.style.height;
              var oldBackgroundColor = canvas.style.backgroundColor;
              var oldDocumentBackgroundColor = document.body.style.backgroundColor;
              var oldPaddingLeft = canvas.style.paddingLeft;
              var oldPaddingRight = canvas.style.paddingRight;
              var oldPaddingTop = canvas.style.paddingTop;
              var oldPaddingBottom = canvas.style.paddingBottom;
              var oldMarginLeft = canvas.style.marginLeft;
              var oldMarginRight = canvas.style.marginRight;
              var oldMarginTop = canvas.style.marginTop;
              var oldMarginBottom = canvas.style.marginBottom;
              var oldDocumentBodyMargin = document.body.style.margin;
              var oldDocumentOverflow = document.documentElement.style.overflow;
              var oldDocumentScroll = document.body.scroll;
              var oldImageRendering = canvas.style.imageRendering;

              function restoreOldStyle() {
                  var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
                  if (!fullscreenElement) {
                      document.removeEventListener("fullscreenchange", restoreOldStyle);
                      document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
                      setCanvasElementSize(canvas, oldWidth, oldHeight);
                      canvas.style.width = oldCssWidth;
                      canvas.style.height = oldCssHeight;
                      canvas.style.backgroundColor = oldBackgroundColor;
                      if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
                      document.body.style.backgroundColor = oldDocumentBackgroundColor;
                      canvas.style.paddingLeft = oldPaddingLeft;
                      canvas.style.paddingRight = oldPaddingRight;
                      canvas.style.paddingTop = oldPaddingTop;
                      canvas.style.paddingBottom = oldPaddingBottom;
                      canvas.style.marginLeft = oldMarginLeft;
                      canvas.style.marginRight = oldMarginRight;
                      canvas.style.marginTop = oldMarginTop;
                      canvas.style.marginBottom = oldMarginBottom;
                      document.body.style.margin = oldDocumentBodyMargin;
                      document.documentElement.style.overflow = oldDocumentOverflow;
                      document.body.scroll = oldDocumentScroll;
                      canvas.style.imageRendering = oldImageRendering;
                      if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
                      if (currentFullscreenStrategy.canvasResizedCallback) {
                          if (currentFullscreenStrategy.canvasResizedCallbackTargetThread) __emscripten_run_callback_on_thread(currentFullscreenStrategy.canvasResizedCallbackTargetThread, currentFullscreenStrategy.canvasResizedCallback, 37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
                          else getWasmTableEntry(currentFullscreenStrategy.canvasResizedCallback)(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData)
                      }
                  }
              }
              document.addEventListener("fullscreenchange", restoreOldStyle);
              document.addEventListener("webkitfullscreenchange", restoreOldStyle);
              return restoreOldStyle
          };
          var setLetterbox = (element, topBottom, leftRight) => {
              element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
              element.style.paddingTop = element.style.paddingBottom = topBottom + "px"
          };
          var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
              left: 0,
              top: 0
          };
          var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
              var restoreOldStyle = registerRestoreOldStyle(target);
              var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
              var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
              var rect = getBoundingClientRect(target);
              var windowedCssWidth = rect.width;
              var windowedCssHeight = rect.height;
              var canvasSize = getCanvasElementSize(target);
              var windowedRttWidth = canvasSize[0];
              var windowedRttHeight = canvasSize[1];
              if (strategy.scaleMode == 3) {
                  setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
                  cssWidth = windowedCssWidth;
                  cssHeight = windowedCssHeight
              } else if (strategy.scaleMode == 2) {
                  if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
                      var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
                      setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
                      cssHeight = desiredCssHeight
                  } else {
                      var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
                      setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
                      cssWidth = desiredCssWidth
                  }
              }
              target.style.backgroundColor ||= "black";
              document.body.style.backgroundColor ||= "black";
              target.style.width = cssWidth + "px";
              target.style.height = cssHeight + "px";
              if (strategy.filteringMode == 1) {
                  target.style.imageRendering = "optimizeSpeed";
                  target.style.imageRendering = "-moz-crisp-edges";
                  target.style.imageRendering = "-o-crisp-edges";
                  target.style.imageRendering = "-webkit-optimize-contrast";
                  target.style.imageRendering = "optimize-contrast";
                  target.style.imageRendering = "crisp-edges";
                  target.style.imageRendering = "pixelated"
              }
              var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
              if (strategy.canvasResolutionScaleMode != 0) {
                  var newWidth = cssWidth * dpiScale | 0;
                  var newHeight = cssHeight * dpiScale | 0;
                  setCanvasElementSize(target, newWidth, newHeight);
                  if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight)
              }
              return restoreOldStyle
          };
          var JSEvents_requestFullscreen = (target, strategy) => {
              if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
                  JSEvents_resizeCanvasForFullscreen(target, strategy)
              }
              if (target.requestFullscreen) {
                  target.requestFullscreen()
              } else if (target.webkitRequestFullscreen) {
                  target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
              } else {
                  return JSEvents.fullscreenEnabled() ? -3 : -1
              }
              currentFullscreenStrategy = strategy;
              if (strategy.canvasResizedCallback) {
                  if (strategy.canvasResizedCallbackTargetThread) __emscripten_run_callback_on_thread(strategy.canvasResizedCallbackTargetThread, strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData);
                  else getWasmTableEntry(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData)
              }
              return 0
          };

          function _emscripten_exit_fullscreen() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(38, 0, 1);
              if (!JSEvents.fullscreenEnabled()) return -1;
              JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
              var d = specialHTMLTargets[1];
              if (d.exitFullscreen) {
                  d.fullscreenElement && d.exitFullscreen()
              } else if (d.webkitExitFullscreen) {
                  d.webkitFullscreenElement && d.webkitExitFullscreen()
              } else {
                  return -1
              }
              return 0
          }
          var requestPointerLock = target => {
              if (target.requestPointerLock) {
                  target.requestPointerLock()
              } else {
                  if (document.body.requestPointerLock) {
                      return -3
                  }
                  return -1
              }
              return 0
          };

          function _emscripten_exit_pointerlock() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(41, 0, 1);
              JSEvents.removeDeferredCalls(requestPointerLock);
              if (document.exitPointerLock) {
                  document.exitPointerLock()
              } else {
                  return -1
              }
              return 0
          }
          var _emscripten_exit_with_live_runtime = () => {
              runtimeKeepalivePush();
              throw "unwind"
          };

          function _emscripten_force_exit(status) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(42, 0, 1, status);
              __emscripten_runtime_keepalive_clear();
              _exit(status)
          }

          function _emscripten_get_device_pixel_ratio() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(43, 0, 1);
              return devicePixelRatio
          }

          function _emscripten_get_element_css_size(target, width, height) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(44, 0, 1, target, width, height);
              target = findEventTarget(target);
              if (!target) return -4;
              var rect = getBoundingClientRect(target);
              HEAPF64[width >> 3] = rect.width;
              HEAPF64[height >> 3] = rect.height;
              return 0
          }
          var fillGamepadEventData = (eventStruct, e) => {
              HEAPF64[eventStruct >> 3] = e.timestamp;
              for (var i = 0; i < e.axes.length; ++i) {
                  HEAPF64[eventStruct + i * 8 + 16 >> 3] = e.axes[i]
              }
              for (var i = 0; i < e.buttons.length; ++i) {
                  if (typeof e.buttons[i] == "object") {
                      HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i].value
                  } else {
                      HEAPF64[eventStruct + i * 8 + 528 >> 3] = e.buttons[i]
                  }
              }
              for (var i = 0; i < e.buttons.length; ++i) {
                  if (typeof e.buttons[i] == "object") {
                      HEAP8[eventStruct + i + 1040] = e.buttons[i].pressed
                  } else {
                      HEAP8[eventStruct + i + 1040] = e.buttons[i] == 1
                  }
              }
              HEAP8[eventStruct + 1104] = e.connected;
              HEAP32[eventStruct + 1108 >> 2] = e.index;
              HEAP32[eventStruct + 8 >> 2] = e.axes.length;
              HEAP32[eventStruct + 12 >> 2] = e.buttons.length;
              stringToUTF8(e.id, eventStruct + 1112, 64);
              stringToUTF8(e.mapping, eventStruct + 1176, 64)
          };

          function _emscripten_get_gamepad_status(index, gamepadState) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(45, 0, 1, index, gamepadState);
              if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
              if (!JSEvents.lastGamepadState[index]) return -7;
              fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
              return 0
          }
          var _emscripten_get_main_loop_timing = (mode, value) => {
              if (mode) HEAP32[mode >> 2] = MainLoop.timingMode;
              if (value) HEAP32[value >> 2] = MainLoop.timingValue
          };

          function _emscripten_get_num_gamepads() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(46, 0, 1);
              return JSEvents.lastGamepadState.length
          }

          function _emscripten_get_screen_size(width, height) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(47, 0, 1, width, height);
              HEAP32[width >> 2] = screen.width;
              HEAP32[height >> 2] = screen.height
          }
          var _glActiveTexture = x0 => GLctx.activeTexture(x0);
          var _emscripten_glActiveTexture = _glActiveTexture;
          var _glAttachShader = (program, shader) => {
              GLctx.attachShader(GL.programs[program], GL.shaders[shader])
          };
          var _emscripten_glAttachShader = _glAttachShader;
          var _glBeginQueryEXT = (target, id) => {
              GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id])
          };
          var _emscripten_glBeginQueryEXT = _glBeginQueryEXT;
          var _glBindAttribLocation = (program, index, name) => {
              GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
          };
          var _emscripten_glBindAttribLocation = _glBindAttribLocation;
          var _glBindBuffer = (target, buffer) => {
              GLctx.bindBuffer(target, GL.buffers[buffer])
          };
          var _emscripten_glBindBuffer = _glBindBuffer;
          var _glBindFramebuffer = (target, framebuffer) => {
              GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
          };
          var _emscripten_glBindFramebuffer = _glBindFramebuffer;
          var _glBindRenderbuffer = (target, renderbuffer) => {
              GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
          };
          var _emscripten_glBindRenderbuffer = _glBindRenderbuffer;
          var _glBindTexture = (target, texture) => {
              GLctx.bindTexture(target, GL.textures[texture])
          };
          var _emscripten_glBindTexture = _glBindTexture;
          var _glBindVertexArray = vao => {
              GLctx.bindVertexArray(GL.vaos[vao])
          };
          var _glBindVertexArrayOES = _glBindVertexArray;
          var _emscripten_glBindVertexArrayOES = _glBindVertexArrayOES;
          var _glBlendColor = (x0, x1, x2, x3) => GLctx.blendColor(x0, x1, x2, x3);
          var _emscripten_glBlendColor = _glBlendColor;
          var _glBlendEquation = x0 => GLctx.blendEquation(x0);
          var _emscripten_glBlendEquation = _glBlendEquation;
          var _glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);
          var _emscripten_glBlendEquationSeparate = _glBlendEquationSeparate;
          var _glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);
          var _emscripten_glBlendFunc = _glBlendFunc;
          var _glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);
          var _emscripten_glBlendFuncSeparate = _glBlendFuncSeparate;
          var _glBufferData = (target, size, data, usage) => {
              GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
          };
          var _emscripten_glBufferData = _glBufferData;
          var _glBufferSubData = (target, offset, size, data) => {
              GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
          };
          var _emscripten_glBufferSubData = _glBufferSubData;
          var _glCheckFramebufferStatus = x0 => GLctx.checkFramebufferStatus(x0);
          var _emscripten_glCheckFramebufferStatus = _glCheckFramebufferStatus;
          var _glClear = x0 => GLctx.clear(x0);
          var _emscripten_glClear = _glClear;
          var _glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);
          var _emscripten_glClearColor = _glClearColor;
          var _glClearDepthf = x0 => GLctx.clearDepth(x0);
          var _emscripten_glClearDepthf = _glClearDepthf;
          var _glClearStencil = x0 => GLctx.clearStencil(x0);
          var _emscripten_glClearStencil = _glClearStencil;
          var _glClipControlEXT = (origin, depth) => {
              GLctx.extClipControl["clipControlEXT"](origin, depth)
          };
          var _emscripten_glClipControlEXT = _glClipControlEXT;
          var _glColorMask = (red, green, blue, alpha) => {
              GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
          };
          var _emscripten_glColorMask = _glColorMask;
          var _glCompileShader = shader => {
              GLctx.compileShader(GL.shaders[shader])
          };
          var _emscripten_glCompileShader = _glCompileShader;
          var _glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
              GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8.subarray(data, data + imageSize))
          };
          var _emscripten_glCompressedTexImage2D = _glCompressedTexImage2D;
          var _glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
              GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, HEAPU8.subarray(data, data + imageSize))
          };
          var _emscripten_glCompressedTexSubImage2D = _glCompressedTexSubImage2D;
          var _glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
          var _emscripten_glCopyTexImage2D = _glCopyTexImage2D;
          var _glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
          var _emscripten_glCopyTexSubImage2D = _glCopyTexSubImage2D;
          var _glCreateProgram = () => {
              var id = GL.getNewId(GL.programs);
              var program = GLctx.createProgram();
              program.name = id;
              program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
              program.uniformIdCounter = 1;
              GL.programs[id] = program;
              return id
          };
          var _emscripten_glCreateProgram = _glCreateProgram;
          var _glCreateShader = shaderType => {
              var id = GL.getNewId(GL.shaders);
              GL.shaders[id] = GLctx.createShader(shaderType);
              return id
          };
          var _emscripten_glCreateShader = _glCreateShader;
          var _glCullFace = x0 => GLctx.cullFace(x0);
          var _emscripten_glCullFace = _glCullFace;
          var _glDeleteBuffers = (n, buffers) => {
              for (var i = 0; i < n; i++) {
                  var id = HEAP32[buffers + i * 4 >> 2];
                  var buffer = GL.buffers[id];
                  if (!buffer) continue;
                  GLctx.deleteBuffer(buffer);
                  buffer.name = 0;
                  GL.buffers[id] = null
              }
          };
          var _emscripten_glDeleteBuffers = _glDeleteBuffers;
          var _glDeleteFramebuffers = (n, framebuffers) => {
              for (var i = 0; i < n; ++i) {
                  var id = HEAP32[framebuffers + i * 4 >> 2];
                  var framebuffer = GL.framebuffers[id];
                  if (!framebuffer) continue;
                  GLctx.deleteFramebuffer(framebuffer);
                  framebuffer.name = 0;
                  GL.framebuffers[id] = null
              }
          };
          var _emscripten_glDeleteFramebuffers = _glDeleteFramebuffers;
          var _glDeleteProgram = id => {
              if (!id) return;
              var program = GL.programs[id];
              if (!program) {
                  GL.recordError(1281);
                  return
              }
              GLctx.deleteProgram(program);
              program.name = 0;
              GL.programs[id] = null
          };
          var _emscripten_glDeleteProgram = _glDeleteProgram;
          var _glDeleteQueriesEXT = (n, ids) => {
              for (var i = 0; i < n; i++) {
                  var id = HEAP32[ids + i * 4 >> 2];
                  var query = GL.queries[id];
                  if (!query) continue;
                  GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
                  GL.queries[id] = null
              }
          };
          var _emscripten_glDeleteQueriesEXT = _glDeleteQueriesEXT;
          var _glDeleteRenderbuffers = (n, renderbuffers) => {
              for (var i = 0; i < n; i++) {
                  var id = HEAP32[renderbuffers + i * 4 >> 2];
                  var renderbuffer = GL.renderbuffers[id];
                  if (!renderbuffer) continue;
                  GLctx.deleteRenderbuffer(renderbuffer);
                  renderbuffer.name = 0;
                  GL.renderbuffers[id] = null
              }
          };
          var _emscripten_glDeleteRenderbuffers = _glDeleteRenderbuffers;
          var _glDeleteShader = id => {
              if (!id) return;
              var shader = GL.shaders[id];
              if (!shader) {
                  GL.recordError(1281);
                  return
              }
              GLctx.deleteShader(shader);
              GL.shaders[id] = null
          };
          var _emscripten_glDeleteShader = _glDeleteShader;
          var _glDeleteTextures = (n, textures) => {
              for (var i = 0; i < n; i++) {
                  var id = HEAP32[textures + i * 4 >> 2];
                  var texture = GL.textures[id];
                  if (!texture) continue;
                  GLctx.deleteTexture(texture);
                  texture.name = 0;
                  GL.textures[id] = null
              }
          };
          var _emscripten_glDeleteTextures = _glDeleteTextures;
          var _glDeleteVertexArrays = (n, vaos) => {
              for (var i = 0; i < n; i++) {
                  var id = HEAP32[vaos + i * 4 >> 2];
                  GLctx.deleteVertexArray(GL.vaos[id]);
                  GL.vaos[id] = null
              }
          };
          var _glDeleteVertexArraysOES = _glDeleteVertexArrays;
          var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArraysOES;
          var _glDepthFunc = x0 => GLctx.depthFunc(x0);
          var _emscripten_glDepthFunc = _glDepthFunc;
          var _glDepthMask = flag => {
              GLctx.depthMask(!!flag)
          };
          var _emscripten_glDepthMask = _glDepthMask;
          var _glDepthRangef = (x0, x1) => GLctx.depthRange(x0, x1);
          var _emscripten_glDepthRangef = _glDepthRangef;
          var _glDetachShader = (program, shader) => {
              GLctx.detachShader(GL.programs[program], GL.shaders[shader])
          };
          var _emscripten_glDetachShader = _glDetachShader;
          var _glDisable = x0 => GLctx.disable(x0);
          var _emscripten_glDisable = _glDisable;
          var _glDisableVertexAttribArray = index => {
              GLctx.disableVertexAttribArray(index)
          };
          var _emscripten_glDisableVertexAttribArray = _glDisableVertexAttribArray;
          var _glDrawArrays = (mode, first, count) => {
              GLctx.drawArrays(mode, first, count)
          };
          var _emscripten_glDrawArrays = _glDrawArrays;
          var _glDrawArraysInstanced = (mode, first, count, primcount) => {
              GLctx.drawArraysInstanced(mode, first, count, primcount)
          };
          var _glDrawArraysInstancedANGLE = _glDrawArraysInstanced;
          var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstancedANGLE;
          var tempFixedLengthArray = [];
          var _glDrawBuffers = (n, bufs) => {
              var bufArray = tempFixedLengthArray[n];
              for (var i = 0; i < n; i++) {
                  bufArray[i] = HEAP32[bufs + i * 4 >> 2]
              }
              GLctx.drawBuffers(bufArray)
          };
          var _glDrawBuffersWEBGL = _glDrawBuffers;
          var _emscripten_glDrawBuffersWEBGL = _glDrawBuffersWEBGL;
          var _glDrawElements = (mode, count, type, indices) => {
              GLctx.drawElements(mode, count, type, indices)
          };
          var _emscripten_glDrawElements = _glDrawElements;
          var _glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
              GLctx.drawElementsInstanced(mode, count, type, indices, primcount)
          };
          var _glDrawElementsInstancedANGLE = _glDrawElementsInstanced;
          var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstancedANGLE;
          var _glEnable = x0 => GLctx.enable(x0);
          var _emscripten_glEnable = _glEnable;
          var _glEnableVertexAttribArray = index => {
              GLctx.enableVertexAttribArray(index)
          };
          var _emscripten_glEnableVertexAttribArray = _glEnableVertexAttribArray;
          var _glEndQueryEXT = target => {
              GLctx.disjointTimerQueryExt["endQueryEXT"](target)
          };
          var _emscripten_glEndQueryEXT = _glEndQueryEXT;
          var _glFinish = () => GLctx.finish();
          var _emscripten_glFinish = _glFinish;
          var _glFlush = () => GLctx.flush();
          var _emscripten_glFlush = _glFlush;
          var _glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
              GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
          };
          var _emscripten_glFramebufferRenderbuffer = _glFramebufferRenderbuffer;
          var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
              GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
          };
          var _emscripten_glFramebufferTexture2D = _glFramebufferTexture2D;
          var _glFrontFace = x0 => GLctx.frontFace(x0);
          var _emscripten_glFrontFace = _glFrontFace;
          var _glGenBuffers = (n, buffers) => {
              GL.genObject(n, buffers, "createBuffer", GL.buffers)
          };
          var _emscripten_glGenBuffers = _glGenBuffers;
          var _glGenFramebuffers = (n, ids) => {
              GL.genObject(n, ids, "createFramebuffer", GL.framebuffers)
          };
          var _emscripten_glGenFramebuffers = _glGenFramebuffers;
          var _glGenQueriesEXT = (n, ids) => {
              for (var i = 0; i < n; i++) {
                  var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
                  if (!query) {
                      GL.recordError(1282);
                      while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
                      return
                  }
                  var id = GL.getNewId(GL.queries);
                  query.name = id;
                  GL.queries[id] = query;
                  HEAP32[ids + i * 4 >> 2] = id
              }
          };
          var _emscripten_glGenQueriesEXT = _glGenQueriesEXT;
          var _glGenRenderbuffers = (n, renderbuffers) => {
              GL.genObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
          };
          var _emscripten_glGenRenderbuffers = _glGenRenderbuffers;
          var _glGenTextures = (n, textures) => {
              GL.genObject(n, textures, "createTexture", GL.textures)
          };
          var _emscripten_glGenTextures = _glGenTextures;
          var _glGenVertexArrays = (n, arrays) => {
              GL.genObject(n, arrays, "createVertexArray", GL.vaos)
          };
          var _glGenVertexArraysOES = _glGenVertexArrays;
          var _emscripten_glGenVertexArraysOES = _glGenVertexArraysOES;
          var _glGenerateMipmap = x0 => GLctx.generateMipmap(x0);
          var _emscripten_glGenerateMipmap = _glGenerateMipmap;
          var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
              program = GL.programs[program];
              var info = GLctx[funcName](program, index);
              if (info) {
                  var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
                  if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
                  if (size) HEAP32[size >> 2] = info.size;
                  if (type) HEAP32[type >> 2] = info.type
              }
          };
          var _glGetActiveAttrib = (program, index, bufSize, length, size, type, name) => __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name);
          var _emscripten_glGetActiveAttrib = _glGetActiveAttrib;
          var _glGetActiveUniform = (program, index, bufSize, length, size, type, name) => __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);
          var _emscripten_glGetActiveUniform = _glGetActiveUniform;
          var _glGetAttachedShaders = (program, maxCount, count, shaders) => {
              var result = GLctx.getAttachedShaders(GL.programs[program]);
              var len = result.length;
              if (len > maxCount) {
                  len = maxCount
              }
              HEAP32[count >> 2] = len;
              for (var i = 0; i < len; ++i) {
                  var id = GL.shaders.indexOf(result[i]);
                  HEAP32[shaders + i * 4 >> 2] = id
              }
          };
          var _emscripten_glGetAttachedShaders = _glGetAttachedShaders;
          var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
          var _emscripten_glGetAttribLocation = _glGetAttribLocation;
          var writeI53ToI64 = (ptr, num) => {
              HEAPU32[ptr >> 2] = num;
              var lower = HEAPU32[ptr >> 2];
              HEAPU32[ptr + 4 >> 2] = (num - lower) / 4294967296
          };
          var emscriptenWebGLGet = (name_, p, type) => {
              if (!p) {
                  GL.recordError(1281);
                  return
              }
              var ret = undefined;
              switch (name_) {
                  case 36346:
                      ret = 1;
                      break;
                  case 36344:
                      if (type != 0 && type != 1) {
                          GL.recordError(1280)
                      }
                      return;
                  case 36345:
                      ret = 0;
                      break;
                  case 34466:
                      var formats = GLctx.getParameter(34467);
                      ret = formats ? formats.length : 0;
                      break
              }
              if (ret === undefined) {
                  var result = GLctx.getParameter(name_);
                  switch (typeof result) {
                      case "number":
                          ret = result;
                          break;
                      case "boolean":
                          ret = result ? 1 : 0;
                          break;
                      case "string":
                          GL.recordError(1280);
                          return;
                      case "object":
                          if (result === null) {
                              switch (name_) {
                                  case 34964:
                                  case 35725:
                                  case 34965:
                                  case 36006:
                                  case 36007:
                                  case 32873:
                                  case 34229:
                                  case 34068: {
                                      ret = 0;
                                      break
                                  }
                                  default: {
                                      GL.recordError(1280);
                                      return
                                  }
                              }
                          } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                              for (var i = 0; i < result.length; ++i) {
                                  switch (type) {
                                      case 0:
                                          HEAP32[p + i * 4 >> 2] = result[i];
                                          break;
                                      case 2:
                                          HEAPF32[p + i * 4 >> 2] = result[i];
                                          break;
                                      case 4:
                                          HEAP8[p + i] = result[i] ? 1 : 0;
                                          break
                                  }
                              }
                              return
                          } else {
                              try {
                                  ret = result.name | 0
                              } catch (e) {
                                  GL.recordError(1280);
                                  err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                                  return
                              }
                          }
                          break;
                      default:
                          GL.recordError(1280);
                          err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof result}!`);
                          return
                  }
              }
              switch (type) {
                  case 1:
                      writeI53ToI64(p, ret);
                      break;
                  case 0:
                      HEAP32[p >> 2] = ret;
                      break;
                  case 2:
                      HEAPF32[p >> 2] = ret;
                      break;
                  case 4:
                      HEAP8[p] = ret ? 1 : 0;
                      break
              }
          };
          var _glGetBooleanv = (name_, p) => emscriptenWebGLGet(name_, p, 4);
          var _emscripten_glGetBooleanv = _glGetBooleanv;
          var _glGetBufferParameteriv = (target, value, data) => {
              if (!data) {
                  GL.recordError(1281);
                  return
              }
              HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
          };
          var _emscripten_glGetBufferParameteriv = _glGetBufferParameteriv;
          var _glGetError = () => {
              var error = GLctx.getError() || GL.lastError;
              GL.lastError = 0;
              return error
          };
          var _emscripten_glGetError = _glGetError;
          var _glGetFloatv = (name_, p) => emscriptenWebGLGet(name_, p, 2);
          var _emscripten_glGetFloatv = _glGetFloatv;
          var _glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
              var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
              if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
                  result = result.name | 0
              }
              HEAP32[params >> 2] = result
          };
          var _emscripten_glGetFramebufferAttachmentParameteriv = _glGetFramebufferAttachmentParameteriv;
          var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
          var _emscripten_glGetIntegerv = _glGetIntegerv;
          var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
              var log = GLctx.getProgramInfoLog(GL.programs[program]);
              if (log === null) log = "(unknown error)";
              var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
              if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
          };
          var _emscripten_glGetProgramInfoLog = _glGetProgramInfoLog;
          var _glGetProgramiv = (program, pname, p) => {
              if (!p) {
                  GL.recordError(1281);
                  return
              }
              if (program >= GL.counter) {
                  GL.recordError(1281);
                  return
              }
              program = GL.programs[program];
              if (pname == 35716) {
                  var log = GLctx.getProgramInfoLog(program);
                  if (log === null) log = "(unknown error)";
                  HEAP32[p >> 2] = log.length + 1
              } else if (pname == 35719) {
                  if (!program.maxUniformLength) {
                      var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
                      for (var i = 0; i < numActiveUniforms; ++i) {
                          program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
                      }
                  }
                  HEAP32[p >> 2] = program.maxUniformLength
              } else if (pname == 35722) {
                  if (!program.maxAttributeLength) {
                      var numActiveAttributes = GLctx.getProgramParameter(program, 35721);
                      for (var i = 0; i < numActiveAttributes; ++i) {
                          program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
                      }
                  }
                  HEAP32[p >> 2] = program.maxAttributeLength
              } else if (pname == 35381) {
                  if (!program.maxUniformBlockNameLength) {
                      var numActiveUniformBlocks = GLctx.getProgramParameter(program, 35382);
                      for (var i = 0; i < numActiveUniformBlocks; ++i) {
                          program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
                      }
                  }
                  HEAP32[p >> 2] = program.maxUniformBlockNameLength
              } else {
                  HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname)
              }
          };
          var _emscripten_glGetProgramiv = _glGetProgramiv;
          var _glGetQueryObjecti64vEXT = (id, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              var query = GL.queries[id];
              var param;
              {
                  param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname)
              }
              var ret;
              if (typeof param == "boolean") {
                  ret = param ? 1 : 0
              } else {
                  ret = param
              }
              writeI53ToI64(params, ret)
          };
          var _emscripten_glGetQueryObjecti64vEXT = _glGetQueryObjecti64vEXT;
          var _glGetQueryObjectivEXT = (id, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              var query = GL.queries[id];
              var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
              var ret;
              if (typeof param == "boolean") {
                  ret = param ? 1 : 0
              } else {
                  ret = param
              }
              HEAP32[params >> 2] = ret
          };
          var _emscripten_glGetQueryObjectivEXT = _glGetQueryObjectivEXT;
          var _glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;
          var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjectui64vEXT;
          var _glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;
          var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectuivEXT;
          var _glGetQueryivEXT = (target, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
          };
          var _emscripten_glGetQueryivEXT = _glGetQueryivEXT;
          var _glGetRenderbufferParameteriv = (target, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
          };
          var _emscripten_glGetRenderbufferParameteriv = _glGetRenderbufferParameteriv;
          var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
              var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
              if (log === null) log = "(unknown error)";
              var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
              if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
          };
          var _emscripten_glGetShaderInfoLog = _glGetShaderInfoLog;
          var _glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
              var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
              HEAP32[range >> 2] = result.rangeMin;
              HEAP32[range + 4 >> 2] = result.rangeMax;
              HEAP32[precision >> 2] = result.precision
          };
          var _emscripten_glGetShaderPrecisionFormat = _glGetShaderPrecisionFormat;
          var _glGetShaderSource = (shader, bufSize, length, source) => {
              var result = GLctx.getShaderSource(GL.shaders[shader]);
              if (!result) return;
              var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
              if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
          };
          var _emscripten_glGetShaderSource = _glGetShaderSource;
          var _glGetShaderiv = (shader, pname, p) => {
              if (!p) {
                  GL.recordError(1281);
                  return
              }
              if (pname == 35716) {
                  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
                  if (log === null) log = "(unknown error)";
                  var logLength = log ? log.length + 1 : 0;
                  HEAP32[p >> 2] = logLength
              } else if (pname == 35720) {
                  var source = GLctx.getShaderSource(GL.shaders[shader]);
                  var sourceLength = source ? source.length + 1 : 0;
                  HEAP32[p >> 2] = sourceLength
              } else {
                  HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
              }
          };
          var _emscripten_glGetShaderiv = _glGetShaderiv;
          var webglGetExtensions = () => {
              var exts = getEmscriptenSupportedExtensions(GLctx);
              exts = exts.concat(exts.map(e => "GL_" + e));
              return exts
          };
          var _glGetString = name_ => {
              var ret = GL.stringCache[name_];
              if (!ret) {
                  switch (name_) {
                      case 7939:
                          ret = stringToNewUTF8(webglGetExtensions().join(" "));
                          break;
                      case 7936:
                      case 7937:
                      case 37445:
                      case 37446:
                          var s = GLctx.getParameter(name_);
                          if (!s) {
                              GL.recordError(1280)
                          }
                          ret = s ? stringToNewUTF8(s) : 0;
                          break;
                      case 7938:
                          var webGLVersion = GLctx.getParameter(7938);
                          var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
                          ret = stringToNewUTF8(glVersion);
                          break;
                      case 35724:
                          var glslVersion = GLctx.getParameter(35724);
                          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                          var ver_num = glslVersion.match(ver_re);
                          if (ver_num !== null) {
                              if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                              glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`
                          }
                          ret = stringToNewUTF8(glslVersion);
                          break;
                      default:
                          GL.recordError(1280)
                  }
                  GL.stringCache[name_] = ret
              }
              return ret
          };
          var _emscripten_glGetString = _glGetString;
          var _glGetTexParameterfv = (target, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
          };
          var _emscripten_glGetTexParameterfv = _glGetTexParameterfv;
          var _glGetTexParameteriv = (target, pname, params) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
          };
          var _emscripten_glGetTexParameteriv = _glGetTexParameteriv;
          var jstoi_q = str => parseInt(str);
          var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");
          var webglPrepareUniformLocationsBeforeFirstUse = program => {
              var uniformLocsById = program.uniformLocsById,
                  uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
                  i, j;
              if (!uniformLocsById) {
                  program.uniformLocsById = uniformLocsById = {};
                  program.uniformArrayNamesById = {};
                  var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
                  for (i = 0; i < numActiveUniforms; ++i) {
                      var u = GLctx.getActiveUniform(program, i);
                      var nm = u.name;
                      var sz = u.size;
                      var lb = webglGetLeftBracePos(nm);
                      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
                      var id = program.uniformIdCounter;
                      program.uniformIdCounter += sz;
                      uniformSizeAndIdsByName[arrayName] = [sz, id];
                      for (j = 0; j < sz; ++j) {
                          uniformLocsById[id] = j;
                          program.uniformArrayNamesById[id++] = arrayName
                      }
                  }
              }
          };
          var _glGetUniformLocation = (program, name) => {
              name = UTF8ToString(name);
              if (program = GL.programs[program]) {
                  webglPrepareUniformLocationsBeforeFirstUse(program);
                  var uniformLocsById = program.uniformLocsById;
                  var arrayIndex = 0;
                  var uniformBaseName = name;
                  var leftBrace = webglGetLeftBracePos(name);
                  if (leftBrace > 0) {
                      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
                      uniformBaseName = name.slice(0, leftBrace)
                  }
                  var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
                  if (sizeAndId && arrayIndex < sizeAndId[0]) {
                      arrayIndex += sizeAndId[1];
                      if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
                          return arrayIndex
                      }
                  }
              } else {
                  GL.recordError(1281)
              }
              return -1
          };
          var _emscripten_glGetUniformLocation = _glGetUniformLocation;
          var webglGetUniformLocation = location => {
              var p = GLctx.currentProgram;
              if (p) {
                  var webglLoc = p.uniformLocsById[location];
                  if (typeof webglLoc == "number") {
                      p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""))
                  }
                  return webglLoc
              } else {
                  GL.recordError(1282)
              }
          };
          var emscriptenWebGLGetUniform = (program, location, params, type) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              program = GL.programs[program];
              webglPrepareUniformLocationsBeforeFirstUse(program);
              var data = GLctx.getUniform(program, webglGetUniformLocation(location));
              if (typeof data == "number" || typeof data == "boolean") {
                  switch (type) {
                      case 0:
                          HEAP32[params >> 2] = data;
                          break;
                      case 2:
                          HEAPF32[params >> 2] = data;
                          break
                  }
              } else {
                  for (var i = 0; i < data.length; i++) {
                      switch (type) {
                          case 0:
                              HEAP32[params + i * 4 >> 2] = data[i];
                              break;
                          case 2:
                              HEAPF32[params + i * 4 >> 2] = data[i];
                              break
                      }
                  }
              }
          };
          var _glGetUniformfv = (program, location, params) => {
              emscriptenWebGLGetUniform(program, location, params, 2)
          };
          var _emscripten_glGetUniformfv = _glGetUniformfv;
          var _glGetUniformiv = (program, location, params) => {
              emscriptenWebGLGetUniform(program, location, params, 0)
          };
          var _emscripten_glGetUniformiv = _glGetUniformiv;
          var _glGetVertexAttribPointerv = (index, pname, pointer) => {
              if (!pointer) {
                  GL.recordError(1281);
                  return
              }
              HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
          };
          var _emscripten_glGetVertexAttribPointerv = _glGetVertexAttribPointerv;
          var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
              if (!params) {
                  GL.recordError(1281);
                  return
              }
              var data = GLctx.getVertexAttrib(index, pname);
              if (pname == 34975) {
                  HEAP32[params >> 2] = data && data["name"]
              } else if (typeof data == "number" || typeof data == "boolean") {
                  switch (type) {
                      case 0:
                          HEAP32[params >> 2] = data;
                          break;
                      case 2:
                          HEAPF32[params >> 2] = data;
                          break;
                      case 5:
                          HEAP32[params >> 2] = Math.fround(data);
                          break
                  }
              } else {
                  for (var i = 0; i < data.length; i++) {
                      switch (type) {
                          case 0:
                              HEAP32[params + i * 4 >> 2] = data[i];
                              break;
                          case 2:
                              HEAPF32[params + i * 4 >> 2] = data[i];
                              break;
                          case 5:
                              HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
                              break
                      }
                  }
              }
          };
          var _glGetVertexAttribfv = (index, pname, params) => {
              emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
          };
          var _emscripten_glGetVertexAttribfv = _glGetVertexAttribfv;
          var _glGetVertexAttribiv = (index, pname, params) => {
              emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
          };
          var _emscripten_glGetVertexAttribiv = _glGetVertexAttribiv;
          var _glHint = (x0, x1) => GLctx.hint(x0, x1);
          var _emscripten_glHint = _glHint;
          var _glIsBuffer = buffer => {
              var b = GL.buffers[buffer];
              if (!b) return 0;
              return GLctx.isBuffer(b)
          };
          var _emscripten_glIsBuffer = _glIsBuffer;
          var _glIsEnabled = x0 => GLctx.isEnabled(x0);
          var _emscripten_glIsEnabled = _glIsEnabled;
          var _glIsFramebuffer = framebuffer => {
              var fb = GL.framebuffers[framebuffer];
              if (!fb) return 0;
              return GLctx.isFramebuffer(fb)
          };
          var _emscripten_glIsFramebuffer = _glIsFramebuffer;
          var _glIsProgram = program => {
              program = GL.programs[program];
              if (!program) return 0;
              return GLctx.isProgram(program)
          };
          var _emscripten_glIsProgram = _glIsProgram;
          var _glIsQueryEXT = id => {
              var query = GL.queries[id];
              if (!query) return 0;
              return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
          };
          var _emscripten_glIsQueryEXT = _glIsQueryEXT;
          var _glIsRenderbuffer = renderbuffer => {
              var rb = GL.renderbuffers[renderbuffer];
              if (!rb) return 0;
              return GLctx.isRenderbuffer(rb)
          };
          var _emscripten_glIsRenderbuffer = _glIsRenderbuffer;
          var _glIsShader = shader => {
              var s = GL.shaders[shader];
              if (!s) return 0;
              return GLctx.isShader(s)
          };
          var _emscripten_glIsShader = _glIsShader;
          var _glIsTexture = id => {
              var texture = GL.textures[id];
              if (!texture) return 0;
              return GLctx.isTexture(texture)
          };
          var _emscripten_glIsTexture = _glIsTexture;
          var _glIsVertexArray = array => {
              var vao = GL.vaos[array];
              if (!vao) return 0;
              return GLctx.isVertexArray(vao)
          };
          var _glIsVertexArrayOES = _glIsVertexArray;
          var _emscripten_glIsVertexArrayOES = _glIsVertexArrayOES;
          var _glLineWidth = x0 => GLctx.lineWidth(x0);
          var _emscripten_glLineWidth = _glLineWidth;
          var _glLinkProgram = program => {
              program = GL.programs[program];
              GLctx.linkProgram(program);
              program.uniformLocsById = 0;
              program.uniformSizeAndIdsByName = {}
          };
          var _emscripten_glLinkProgram = _glLinkProgram;
          var _glPixelStorei = (pname, param) => {
              if (pname == 3317) {
                  GL.unpackAlignment = param
              } else if (pname == 3314) {
                  GL.unpackRowLength = param
              }
              GLctx.pixelStorei(pname, param)
          };
          var _emscripten_glPixelStorei = _glPixelStorei;
          var _glPolygonModeWEBGL = (face, mode) => {
              GLctx.webglPolygonMode["polygonModeWEBGL"](face, mode)
          };
          var _emscripten_glPolygonModeWEBGL = _glPolygonModeWEBGL;
          var _glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);
          var _emscripten_glPolygonOffset = _glPolygonOffset;
          var _glPolygonOffsetClampEXT = (factor, units, clamp) => {
              GLctx.extPolygonOffsetClamp["polygonOffsetClampEXT"](factor, units, clamp)
          };
          var _emscripten_glPolygonOffsetClampEXT = _glPolygonOffsetClampEXT;
          var _glQueryCounterEXT = (id, target) => {
              GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target)
          };
          var _emscripten_glQueryCounterEXT = _glQueryCounterEXT;
          var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
              function roundedToNextMultipleOf(x, y) {
                  return x + y - 1 & -y
              }
              var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
              var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
              return height * alignedRowSize
          };
          var colorChannelsInGlTextureFormat = format => {
              var colorChannels = {
                  5: 3,
                  6: 4,
                  8: 2,
                  29502: 3,
                  29504: 4
              };
              return colorChannels[format - 6402] || 1
          };
          var heapObjectForWebGLType = type => {
              type -= 5120;
              if (type == 1) return HEAPU8;
              if (type == 4) return HEAP32;
              if (type == 6) return HEAPF32;
              if (type == 5 || type == 28922) return HEAPU32;
              return HEAPU16
          };
          var toTypedArrayIndex = (pointer, heap) => pointer >>> 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
          var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
              var heap = heapObjectForWebGLType(type);
              var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
              var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
              return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap))
          };
          var _glReadPixels = (x, y, width, height, format, type, pixels) => {
              var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
              if (!pixelData) {
                  GL.recordError(1280);
                  return
              }
              GLctx.readPixels(x, y, width, height, format, type, pixelData)
          };
          var _emscripten_glReadPixels = _glReadPixels;
          var _glReleaseShaderCompiler = () => {};
          var _emscripten_glReleaseShaderCompiler = _glReleaseShaderCompiler;
          var _glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);
          var _emscripten_glRenderbufferStorage = _glRenderbufferStorage;
          var _glSampleCoverage = (value, invert) => {
              GLctx.sampleCoverage(value, !!invert)
          };
          var _emscripten_glSampleCoverage = _glSampleCoverage;
          var _glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
          var _emscripten_glScissor = _glScissor;
          var _glShaderBinary = (count, shaders, binaryformat, binary, length) => {
              GL.recordError(1280)
          };
          var _emscripten_glShaderBinary = _glShaderBinary;
          var _glShaderSource = (shader, count, string, length) => {
              var source = GL.getSource(shader, count, string, length);
              GLctx.shaderSource(GL.shaders[shader], source)
          };
          var _emscripten_glShaderSource = _glShaderSource;
          var _glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);
          var _emscripten_glStencilFunc = _glStencilFunc;
          var _glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);
          var _emscripten_glStencilFuncSeparate = _glStencilFuncSeparate;
          var _glStencilMask = x0 => GLctx.stencilMask(x0);
          var _emscripten_glStencilMask = _glStencilMask;
          var _glStencilMaskSeparate = (x0, x1) => GLctx.stencilMaskSeparate(x0, x1);
          var _emscripten_glStencilMaskSeparate = _glStencilMaskSeparate;
          var _glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);
          var _emscripten_glStencilOp = _glStencilOp;
          var _glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);
          var _emscripten_glStencilOpSeparate = _glStencilOpSeparate;
          var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
              var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
              GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData)
          };
          var _emscripten_glTexImage2D = _glTexImage2D;
          var _glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);
          var _emscripten_glTexParameterf = _glTexParameterf;
          var _glTexParameterfv = (target, pname, params) => {
              var param = HEAPF32[params >> 2];
              GLctx.texParameterf(target, pname, param)
          };
          var _emscripten_glTexParameterfv = _glTexParameterfv;
          var _glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
          var _emscripten_glTexParameteri = _glTexParameteri;
          var _glTexParameteriv = (target, pname, params) => {
              var param = HEAP32[params >> 2];
              GLctx.texParameteri(target, pname, param)
          };
          var _emscripten_glTexParameteriv = _glTexParameteriv;
          var _glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
              var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0) : null;
              GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
          };
          var _emscripten_glTexSubImage2D = _glTexSubImage2D;
          var _glUniform1f = (location, v0) => {
              GLctx.uniform1f(webglGetUniformLocation(location), v0)
          };
          var _emscripten_glUniform1f = _glUniform1f;
          var miniTempWebGLFloatBuffers = [];
          var _glUniform1fv = (location, count, value) => {
              if (count <= 288) {
                  var view = miniTempWebGLFloatBuffers[count];
                  for (var i = 0; i < count; ++i) {
                      view[i] = HEAPF32[value + 4 * i >> 2]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
              }
              GLctx.uniform1fv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform1fv = _glUniform1fv;
          var _glUniform1i = (location, v0) => {
              GLctx.uniform1i(webglGetUniformLocation(location), v0)
          };
          var _emscripten_glUniform1i = _glUniform1i;
          var miniTempWebGLIntBuffers = [];
          var _glUniform1iv = (location, count, value) => {
              if (count <= 288) {
                  var view = miniTempWebGLIntBuffers[count];
                  for (var i = 0; i < count; ++i) {
                      view[i] = HEAP32[value + 4 * i >> 2]
                  }
              } else {
                  var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2)
              }
              GLctx.uniform1iv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform1iv = _glUniform1iv;
          var _glUniform2f = (location, v0, v1) => {
              GLctx.uniform2f(webglGetUniformLocation(location), v0, v1)
          };
          var _emscripten_glUniform2f = _glUniform2f;
          var _glUniform2fv = (location, count, value) => {
              if (count <= 144) {
                  count *= 2;
                  var view = miniTempWebGLFloatBuffers[count];
                  for (var i = 0; i < count; i += 2) {
                      view[i] = HEAPF32[value + 4 * i >> 2];
                      view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2)
              }
              GLctx.uniform2fv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform2fv = _glUniform2fv;
          var _glUniform2i = (location, v0, v1) => {
              GLctx.uniform2i(webglGetUniformLocation(location), v0, v1)
          };
          var _emscripten_glUniform2i = _glUniform2i;
          var _glUniform2iv = (location, count, value) => {
              if (count <= 144) {
                  count *= 2;
                  var view = miniTempWebGLIntBuffers[count];
                  for (var i = 0; i < count; i += 2) {
                      view[i] = HEAP32[value + 4 * i >> 2];
                      view[i + 1] = HEAP32[value + (4 * i + 4) >> 2]
                  }
              } else {
                  var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2)
              }
              GLctx.uniform2iv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform2iv = _glUniform2iv;
          var _glUniform3f = (location, v0, v1, v2) => {
              GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2)
          };
          var _emscripten_glUniform3f = _glUniform3f;
          var _glUniform3fv = (location, count, value) => {
              if (count <= 96) {
                  count *= 3;
                  var view = miniTempWebGLFloatBuffers[count];
                  for (var i = 0; i < count; i += 3) {
                      view[i] = HEAPF32[value + 4 * i >> 2];
                      view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                      view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
              }
              GLctx.uniform3fv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform3fv = _glUniform3fv;
          var _glUniform3i = (location, v0, v1, v2) => {
              GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2)
          };
          var _emscripten_glUniform3i = _glUniform3i;
          var _glUniform3iv = (location, count, value) => {
              if (count <= 96) {
                  count *= 3;
                  var view = miniTempWebGLIntBuffers[count];
                  for (var i = 0; i < count; i += 3) {
                      view[i] = HEAP32[value + 4 * i >> 2];
                      view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
                      view[i + 2] = HEAP32[value + (4 * i + 8) >> 2]
                  }
              } else {
                  var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2)
              }
              GLctx.uniform3iv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform3iv = _glUniform3iv;
          var _glUniform4f = (location, v0, v1, v2, v3) => {
              GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3)
          };
          var _emscripten_glUniform4f = _glUniform4f;
          var _glUniform4fv = (location, count, value) => {
              if (count <= 72) {
                  var view = miniTempWebGLFloatBuffers[4 * count];
                  var heap = HEAPF32;
                  value = value >> 2;
                  count *= 4;
                  for (var i = 0; i < count; i += 4) {
                      var dst = value + i;
                      view[i] = heap[dst];
                      view[i + 1] = heap[dst + 1];
                      view[i + 2] = heap[dst + 2];
                      view[i + 3] = heap[dst + 3]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
              }
              GLctx.uniform4fv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform4fv = _glUniform4fv;
          var _glUniform4i = (location, v0, v1, v2, v3) => {
              GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3)
          };
          var _emscripten_glUniform4i = _glUniform4i;
          var _glUniform4iv = (location, count, value) => {
              if (count <= 72) {
                  count *= 4;
                  var view = miniTempWebGLIntBuffers[count];
                  for (var i = 0; i < count; i += 4) {
                      view[i] = HEAP32[value + 4 * i >> 2];
                      view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
                      view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
                      view[i + 3] = HEAP32[value + (4 * i + 12) >> 2]
                  }
              } else {
                  var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2)
              }
              GLctx.uniform4iv(webglGetUniformLocation(location), view)
          };
          var _emscripten_glUniform4iv = _glUniform4iv;
          var _glUniformMatrix2fv = (location, count, transpose, value) => {
              if (count <= 72) {
                  count *= 4;
                  var view = miniTempWebGLFloatBuffers[count];
                  for (var i = 0; i < count; i += 4) {
                      view[i] = HEAPF32[value + 4 * i >> 2];
                      view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                      view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                      view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
              }
              GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view)
          };
          var _emscripten_glUniformMatrix2fv = _glUniformMatrix2fv;
          var _glUniformMatrix3fv = (location, count, transpose, value) => {
              if (count <= 32) {
                  count *= 9;
                  var view = miniTempWebGLFloatBuffers[count];
                  for (var i = 0; i < count; i += 9) {
                      view[i] = HEAPF32[value + 4 * i >> 2];
                      view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
                      view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
                      view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
                      view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
                      view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
                      view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
                      view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
                      view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
              }
              GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view)
          };
          var _emscripten_glUniformMatrix3fv = _glUniformMatrix3fv;
          var _glUniformMatrix4fv = (location, count, transpose, value) => {
              if (count <= 18) {
                  var view = miniTempWebGLFloatBuffers[16 * count];
                  var heap = HEAPF32;
                  value = value >> 2;
                  count *= 16;
                  for (var i = 0; i < count; i += 16) {
                      var dst = value + i;
                      view[i] = heap[dst];
                      view[i + 1] = heap[dst + 1];
                      view[i + 2] = heap[dst + 2];
                      view[i + 3] = heap[dst + 3];
                      view[i + 4] = heap[dst + 4];
                      view[i + 5] = heap[dst + 5];
                      view[i + 6] = heap[dst + 6];
                      view[i + 7] = heap[dst + 7];
                      view[i + 8] = heap[dst + 8];
                      view[i + 9] = heap[dst + 9];
                      view[i + 10] = heap[dst + 10];
                      view[i + 11] = heap[dst + 11];
                      view[i + 12] = heap[dst + 12];
                      view[i + 13] = heap[dst + 13];
                      view[i + 14] = heap[dst + 14];
                      view[i + 15] = heap[dst + 15]
                  }
              } else {
                  var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
              }
              GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view)
          };
          var _emscripten_glUniformMatrix4fv = _glUniformMatrix4fv;
          var _glUseProgram = program => {
              program = GL.programs[program];
              GLctx.useProgram(program);
              GLctx.currentProgram = program
          };
          var _emscripten_glUseProgram = _glUseProgram;
          var _glValidateProgram = program => {
              GLctx.validateProgram(GL.programs[program])
          };
          var _emscripten_glValidateProgram = _glValidateProgram;
          var _glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);
          var _emscripten_glVertexAttrib1f = _glVertexAttrib1f;
          var _glVertexAttrib1fv = (index, v) => {
              GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
          };
          var _emscripten_glVertexAttrib1fv = _glVertexAttrib1fv;
          var _glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);
          var _emscripten_glVertexAttrib2f = _glVertexAttrib2f;
          var _glVertexAttrib2fv = (index, v) => {
              GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
          };
          var _emscripten_glVertexAttrib2fv = _glVertexAttrib2fv;
          var _glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);
          var _emscripten_glVertexAttrib3f = _glVertexAttrib3f;
          var _glVertexAttrib3fv = (index, v) => {
              GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
          };
          var _emscripten_glVertexAttrib3fv = _glVertexAttrib3fv;
          var _glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
          var _emscripten_glVertexAttrib4f = _glVertexAttrib4f;
          var _glVertexAttrib4fv = (index, v) => {
              GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
          };
          var _emscripten_glVertexAttrib4fv = _glVertexAttrib4fv;
          var _glVertexAttribDivisor = (index, divisor) => {
              GLctx.vertexAttribDivisor(index, divisor)
          };
          var _glVertexAttribDivisorANGLE = _glVertexAttribDivisor;
          var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisorANGLE;
          var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
              GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
          };
          var _emscripten_glVertexAttribPointer = _glVertexAttribPointer;
          var _glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);
          var _emscripten_glViewport = _glViewport;
          var _emscripten_has_asyncify = () => 0;
          var _emscripten_pause_main_loop = () => MainLoop.pause();
          var doRequestFullscreen = (target, strategy) => {
              if (!JSEvents.fullscreenEnabled()) return -1;
              target = findEventTarget(target);
              if (!target) return -4;
              if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
                  return -3
              }
              if (!JSEvents.canPerformEventHandlerRequests()) {
                  if (strategy.deferUntilInEventHandler) {
                      JSEvents.deferCall(JSEvents_requestFullscreen, 1, [target, strategy]);
                      return 1
                  }
                  return -2
              }
              return JSEvents_requestFullscreen(target, strategy)
          };

          function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(48, 0, 1, target, deferUntilInEventHandler, fullscreenStrategy);
              var strategy = {
                  scaleMode: HEAP32[fullscreenStrategy >> 2],
                  canvasResolutionScaleMode: HEAP32[fullscreenStrategy + 4 >> 2],
                  filteringMode: HEAP32[fullscreenStrategy + 8 >> 2],
                  deferUntilInEventHandler,
                  canvasResizedCallbackTargetThread: HEAP32[fullscreenStrategy + 20 >> 2],
                  canvasResizedCallback: HEAP32[fullscreenStrategy + 12 >> 2],
                  canvasResizedCallbackUserData: HEAP32[fullscreenStrategy + 16 >> 2]
              };
              return doRequestFullscreen(target, strategy)
          }

          function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(49, 0, 1, target, deferUntilInEventHandler);
              target = findEventTarget(target);
              if (!target) return -4;
              if (!target.requestPointerLock) {
                  return -1
              }
              if (!JSEvents.canPerformEventHandlerRequests()) {
                  if (deferUntilInEventHandler) {
                      JSEvents.deferCall(requestPointerLock, 2, [target]);
                      return 1
                  }
                  return -2
              }
              return requestPointerLock(target)
          }
          var abortOnCannotGrowMemory = requestedSize => {
              abort("OOM")
          };
          var _emscripten_resize_heap = requestedSize => {
              var oldSize = HEAPU8.length;
              requestedSize >>>= 0;
              abortOnCannotGrowMemory(requestedSize)
          };
          var _emscripten_resume_main_loop = () => MainLoop.resume();

          function _emscripten_sample_gamepad_data() {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(50, 0, 1);
              try {
                  if (navigator.getGamepads) return (JSEvents.lastGamepadState = navigator.getGamepads()) ? 0 : -1
              } catch (e) {
                  navigator.getGamepads = null
              }
              return -1
          }
          var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
              var beforeUnloadEventHandlerFunc = (e = event) => {
                  var confirmationMessage = getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData);
                  if (confirmationMessage) {
                      confirmationMessage = UTF8ToString(confirmationMessage)
                  }
                  if (confirmationMessage) {
                      e.preventDefault();
                      e.returnValue = confirmationMessage;
                      return confirmationMessage
                  }
              };
              var eventHandler = {
                  target: findEventTarget(target),
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: beforeUnloadEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(51, 0, 1, userData, callbackfunc, targetThread);
              if (typeof onbeforeunload == "undefined") return -1;
              if (targetThread !== 1) return -5;
              return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload")
          }
          var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.focusEvent ||= _malloc(256);
              var focusEventHandlerFunc = (e = event) => {
                  var nodeName = JSEvents.getNodeNameForTarget(e.target);
                  var id = e.target.id ? e.target.id : "";
                  var focusEvent = targetThread ? _malloc(256) : JSEvents.focusEvent;
                  stringToUTF8(nodeName, focusEvent + 0, 128);
                  stringToUTF8(id, focusEvent + 128, 128);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, focusEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, focusEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target: findEventTarget(target),
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: focusEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(52, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread)
          }

          function _emscripten_set_element_css_size(target, width, height) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(53, 0, 1, target, width, height);
              target = findEventTarget(target);
              if (!target) return -4;
              target.style.width = width + "px";
              target.style.height = height + "px";
              return 0
          }

          function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(54, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread)
          }
          var fillFullscreenChangeEventData = eventStruct => {
              var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
              var isFullscreen = !!fullscreenElement;
              HEAP8[eventStruct] = isFullscreen;
              HEAP8[eventStruct + 1] = JSEvents.fullscreenEnabled();
              var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
              var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
              var id = reportedElement?.id || "";
              stringToUTF8(nodeName, eventStruct + 2, 128);
              stringToUTF8(id, eventStruct + 130, 128);
              HEAP32[eventStruct + 260 >> 2] = reportedElement ? reportedElement.clientWidth : 0;
              HEAP32[eventStruct + 264 >> 2] = reportedElement ? reportedElement.clientHeight : 0;
              HEAP32[eventStruct + 268 >> 2] = screen.width;
              HEAP32[eventStruct + 272 >> 2] = screen.height;
              if (isFullscreen) {
                  JSEvents.previousFullscreenElement = fullscreenElement
              }
          };
          var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.fullscreenChangeEvent ||= _malloc(276);
              var fullscreenChangeEventhandlerFunc = (e = event) => {
                  var fullscreenChangeEvent = targetThread ? _malloc(276) : JSEvents.fullscreenChangeEvent;
                  fillFullscreenChangeEventData(fullscreenChangeEvent);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, fullscreenChangeEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: fullscreenChangeEventhandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(55, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              if (!JSEvents.fullscreenEnabled()) return -1;
              target = findEventTarget(target);
              if (!target) return -4;
              registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
              return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread)
          }
          var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.gamepadEvent ||= _malloc(1240);
              var gamepadEventHandlerFunc = (e = event) => {
                  var gamepadEvent = targetThread ? _malloc(1240) : JSEvents.gamepadEvent;
                  fillGamepadEventData(gamepadEvent, e["gamepad"]);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, gamepadEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, gamepadEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target: findEventTarget(target),
                  allowsDeferredCalls: true,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: gamepadEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(56, 0, 1, userData, useCapture, callbackfunc, targetThread);
              if (_emscripten_sample_gamepad_data()) return -1;
              return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread)
          }

          function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(57, 0, 1, userData, useCapture, callbackfunc, targetThread);
              if (_emscripten_sample_gamepad_data()) return -1;
              return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread)
          }
          var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.keyEvent ||= _malloc(160);
              var keyEventHandlerFunc = e => {
                  var keyEventData = targetThread ? _malloc(160) : JSEvents.keyEvent;
                  HEAPF64[keyEventData >> 3] = e.timeStamp;
                  var idx = keyEventData >> 2;
                  HEAP32[idx + 2] = e.location;
                  HEAP8[keyEventData + 12] = e.ctrlKey;
                  HEAP8[keyEventData + 13] = e.shiftKey;
                  HEAP8[keyEventData + 14] = e.altKey;
                  HEAP8[keyEventData + 15] = e.metaKey;
                  HEAP8[keyEventData + 16] = e.repeat;
                  HEAP32[idx + 5] = e.charCode;
                  HEAP32[idx + 6] = e.keyCode;
                  HEAP32[idx + 7] = e.which;
                  stringToUTF8(e.key || "", keyEventData + 32, 32);
                  stringToUTF8(e.code || "", keyEventData + 64, 32);
                  stringToUTF8(e.char || "", keyEventData + 96, 32);
                  stringToUTF8(e.locale || "", keyEventData + 128, 32);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, keyEventData, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target: findEventTarget(target),
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: keyEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(58, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread)
          }

          function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(59, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread)
          }

          function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(60, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread)
          }
          var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
              var iterFunc = getWasmTableEntry(func);
              setMainLoop(iterFunc, fps, simulateInfiniteLoop)
          };
          var fillMouseEventData = (eventStruct, e, target) => {
              HEAPF64[eventStruct >> 3] = e.timeStamp;
              var idx = eventStruct >> 2;
              HEAP32[idx + 2] = e.screenX;
              HEAP32[idx + 3] = e.screenY;
              HEAP32[idx + 4] = e.clientX;
              HEAP32[idx + 5] = e.clientY;
              HEAP8[eventStruct + 24] = e.ctrlKey;
              HEAP8[eventStruct + 25] = e.shiftKey;
              HEAP8[eventStruct + 26] = e.altKey;
              HEAP8[eventStruct + 27] = e.metaKey;
              HEAP16[idx * 2 + 14] = e.button;
              HEAP16[idx * 2 + 15] = e.buttons;
              HEAP32[idx + 8] = e["movementX"];
              HEAP32[idx + 9] = e["movementY"];
              var rect = getBoundingClientRect(target);
              HEAP32[idx + 10] = e.clientX - (rect.left | 0);
              HEAP32[idx + 11] = e.clientY - (rect.top | 0)
          };
          var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.mouseEvent ||= _malloc(64);
              target = findEventTarget(target);
              var mouseEventHandlerFunc = (e = event) => {
                  fillMouseEventData(JSEvents.mouseEvent, e, target);
                  if (targetThread) {
                      var mouseEventData = _malloc(64);
                      fillMouseEventData(mouseEventData, e, target);
                      __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, mouseEventData, userData)
                  } else if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: mouseEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(61, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread)
          }

          function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(62, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread)
          }

          function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(63, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread)
          }

          function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(64, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread)
          }

          function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(65, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread)
          }
          var fillPointerlockChangeEventData = eventStruct => {
              var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
              var isPointerlocked = !!pointerLockElement;
              HEAP8[eventStruct] = isPointerlocked;
              var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
              var id = pointerLockElement?.id || "";
              stringToUTF8(nodeName, eventStruct + 1, 128);
              stringToUTF8(id, eventStruct + 129, 128)
          };
          var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.pointerlockChangeEvent ||= _malloc(257);
              var pointerlockChangeEventHandlerFunc = (e = event) => {
                  var pointerlockChangeEvent = targetThread ? _malloc(257) : JSEvents.pointerlockChangeEvent;
                  fillPointerlockChangeEventData(pointerlockChangeEvent);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, pointerlockChangeEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: pointerlockChangeEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(66, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              if (!document || !document.body || !document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock) {
                  return -1
              }
              target = findEventTarget(target);
              if (!target) return -4;
              registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mozpointerlockchange", targetThread);
              registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "webkitpointerlockchange", targetThread);
              registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mspointerlockchange", targetThread);
              return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread)
          }
          var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.uiEvent ||= _malloc(36);
              target = findEventTarget(target);
              var uiEventHandlerFunc = (e = event) => {
                  if (e.target != target) {
                      return
                  }
                  var b = document.body;
                  if (!b) {
                      return
                  }
                  var uiEvent = targetThread ? _malloc(36) : JSEvents.uiEvent;
                  HEAP32[uiEvent >> 2] = 0;
                  HEAP32[uiEvent + 4 >> 2] = b.clientWidth;
                  HEAP32[uiEvent + 8 >> 2] = b.clientHeight;
                  HEAP32[uiEvent + 12 >> 2] = innerWidth;
                  HEAP32[uiEvent + 16 >> 2] = innerHeight;
                  HEAP32[uiEvent + 20 >> 2] = outerWidth;
                  HEAP32[uiEvent + 24 >> 2] = outerHeight;
                  HEAP32[uiEvent + 28 >> 2] = pageXOffset | 0;
                  HEAP32[uiEvent + 32 >> 2] = pageYOffset | 0;
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, uiEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: uiEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(67, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread)
          }
          var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.touchEvent ||= _malloc(1552);
              target = findEventTarget(target);
              var touchEventHandlerFunc = e => {
                  var t, touches = {},
                      et = e.touches;
                  for (let t of et) {
                      t.isChanged = t.onTarget = 0;
                      touches[t.identifier] = t
                  }
                  for (let t of e.changedTouches) {
                      t.isChanged = 1;
                      touches[t.identifier] = t
                  }
                  for (let t of e.targetTouches) {
                      touches[t.identifier].onTarget = 1
                  }
                  var touchEvent = targetThread ? _malloc(1552) : JSEvents.touchEvent;
                  HEAPF64[touchEvent >> 3] = e.timeStamp;
                  HEAP8[touchEvent + 12] = e.ctrlKey;
                  HEAP8[touchEvent + 13] = e.shiftKey;
                  HEAP8[touchEvent + 14] = e.altKey;
                  HEAP8[touchEvent + 15] = e.metaKey;
                  var idx = touchEvent + 16;
                  var targetRect = getBoundingClientRect(target);
                  var numTouches = 0;
                  for (let t of Object.values(touches)) {
                      var idx32 = idx >> 2;
                      HEAP32[idx32 + 0] = t.identifier;
                      HEAP32[idx32 + 1] = t.screenX;
                      HEAP32[idx32 + 2] = t.screenY;
                      HEAP32[idx32 + 3] = t.clientX;
                      HEAP32[idx32 + 4] = t.clientY;
                      HEAP32[idx32 + 5] = t.pageX;
                      HEAP32[idx32 + 6] = t.pageY;
                      HEAP8[idx + 28] = t.isChanged;
                      HEAP8[idx + 29] = t.onTarget;
                      HEAP32[idx32 + 8] = t.clientX - (targetRect.left | 0);
                      HEAP32[idx32 + 9] = t.clientY - (targetRect.top | 0);
                      idx += 48;
                      if (++numTouches > 31) {
                          break
                      }
                  }
                  HEAP32[touchEvent + 8 >> 2] = numTouches;
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, touchEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, touchEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: touchEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(68, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread)
          }

          function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(69, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread)
          }

          function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(70, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread)
          }

          function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(71, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread)
          }
          var fillVisibilityChangeEventData = eventStruct => {
              var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
              var visibilityState = visibilityStates.indexOf(document.visibilityState);
              HEAP8[eventStruct] = document.hidden;
              HEAP32[eventStruct + 4 >> 2] = visibilityState
          };
          var registerVisibilityChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.visibilityChangeEvent ||= _malloc(8);
              var visibilityChangeEventHandlerFunc = (e = event) => {
                  var visibilityChangeEvent = targetThread ? _malloc(8) : JSEvents.visibilityChangeEvent;
                  fillVisibilityChangeEventData(visibilityChangeEvent);
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, visibilityChangeEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: visibilityChangeEventHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(72, 0, 1, userData, useCapture, callbackfunc, targetThread);
              if (!specialHTMLTargets[1]) {
                  return -4
              }
              return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread)
          }
          var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
              targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
              JSEvents.wheelEvent ||= _malloc(96);
              var wheelHandlerFunc = (e = event) => {
                  var wheelEvent = targetThread ? _malloc(96) : JSEvents.wheelEvent;
                  fillMouseEventData(wheelEvent, e, target);
                  HEAPF64[wheelEvent + 64 >> 3] = e["deltaX"];
                  HEAPF64[wheelEvent + 72 >> 3] = e["deltaY"];
                  HEAPF64[wheelEvent + 80 >> 3] = e["deltaZ"];
                  HEAP32[wheelEvent + 88 >> 2] = e["deltaMode"];
                  if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, wheelEvent, userData);
                  else if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault()
              };
              var eventHandler = {
                  target,
                  allowsDeferredCalls: true,
                  eventTypeString,
                  callbackfunc,
                  handlerFunc: wheelHandlerFunc,
                  useCapture
              };
              return JSEvents.registerOrRemoveHandler(eventHandler)
          };

          function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(73, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
              target = findEventTarget(target);
              if (!target) return -4;
              if (typeof target.onwheel != "undefined") {
                  return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread)
              } else {
                  return -1
              }
          }

          function _emscripten_set_window_title(title) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(74, 0, 1, title);
              return document.title = UTF8ToString(title)
          }
          var _emscripten_sleep = () => {
              throw "Please compile your program with async support in order to use asynchronous operations like emscripten_sleep"
          };
          var ENV = {};
          var getExecutableName = () => thisProgram || "./this.program";
          var getEnvStrings = () => {
              if (!getEnvStrings.strings) {
                  var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
                  var env = {
                      USER: "web_user",
                      LOGNAME: "web_user",
                      PATH: "/",
                      PWD: "/",
                      HOME: "/home/web_user",
                      LANG: lang,
                      _: getExecutableName()
                  };
                  for (var x in ENV) {
                      if (ENV[x] === undefined) delete env[x];
                      else env[x] = ENV[x]
                  }
                  var strings = [];
                  for (var x in env) {
                      strings.push(`${x}=${env[x]}`)
                  }
                  getEnvStrings.strings = strings
              }
              return getEnvStrings.strings
          };
          var stringToAscii = (str, buffer) => {
              for (var i = 0; i < str.length; ++i) {
                  HEAP8[buffer++] = str.charCodeAt(i)
              }
              HEAP8[buffer] = 0
          };
          var _environ_get = function(__environ, environ_buf) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(75, 0, 1, __environ, environ_buf);
              var bufSize = 0;
              getEnvStrings().forEach((string, i) => {
                  var ptr = environ_buf + bufSize;
                  HEAPU32[__environ + i * 4 >> 2] = ptr;
                  stringToAscii(string, ptr);
                  bufSize += string.length + 1
              });
              return 0
          };
          var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(76, 0, 1, penviron_count, penviron_buf_size);
              var strings = getEnvStrings();
              HEAPU32[penviron_count >> 2] = strings.length;
              var bufSize = 0;
              strings.forEach(string => bufSize += string.length + 1);
              HEAPU32[penviron_buf_size >> 2] = bufSize;
              return 0
          };

          function _fd_close(fd) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(77, 0, 1, fd);
              return 52
          }

          function _fd_read(fd, iov, iovcnt, pnum) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(78, 0, 1, fd, iov, iovcnt, pnum);
              return 52
          }

          function _fd_seek(fd, offset, whence, newOffset) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(79, 0, 1, fd, offset, whence, newOffset);
              offset = bigintToI53Checked(offset);
              return 70
          }

          function _fd_sync(fd) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(80, 0, 1, fd);
              return 52
          }
          var printCharBuffers = [null, [],
              []
          ];
          var printChar = (stream, curr) => {
              var buffer = printCharBuffers[stream];
              if (curr === 0 || curr === 10) {
                  (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
                  buffer.length = 0
              } else {
                  buffer.push(curr)
              }
          };

          function _fd_write(fd, iov, iovcnt, pnum) {
              if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(81, 0, 1, fd, iov, iovcnt, pnum);
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
          var listenOnce = (object, event, func) => object.addEventListener(event, func, {
              once: true
          });
          var autoResumeAudioContext = (ctx, elements) => {
              if (!elements) {
                  elements = [document, document.getElementById("canvas")]
              } ["keydown", "mousedown", "touchstart"].forEach(event => {
                  elements.forEach(element => {
                      if (element) {
                          listenOnce(element, event, () => {
                              if (ctx.state === "suspended") ctx.resume()
                          })
                      }
                  })
              })
          };
          var dynCall = (sig, ptr, args = []) => {
              var rtn = getWasmTableEntry(ptr)(...args);
              return rtn
          };
          var getCFunc = ident => {
              var func = Module["_" + ident];
              return func
          };
          var writeArrayToMemory = (array, buffer) => {
              HEAP8.set(array, buffer)
          };
          var ccall = (ident, returnType, argTypes, args, opts) => {
              var toC = {
                  string: str => {
                      var ret = 0;
                      if (str !== null && str !== undefined && str !== 0) {
                          ret = stringToUTF8OnStack(str)
                      }
                      return ret
                  },
                  array: arr => {
                      var ret = stackAlloc(arr.length);
                      writeArrayToMemory(arr, ret);
                      return ret
                  }
              };

              function convertReturnValue(ret) {
                  if (returnType === "string") {
                      return UTF8ToString(ret)
                  }
                  if (returnType === "boolean") return Boolean(ret);
                  return ret
              }
              var func = getCFunc(ident);
              var cArgs = [];
              var stack = 0;
              if (args) {
                  for (var i = 0; i < args.length; i++) {
                      var converter = toC[argTypes[i]];
                      if (converter) {
                          if (stack === 0) stack = stackSave();
                          cArgs[i] = converter(args[i])
                      } else {
                          cArgs[i] = args[i]
                      }
                  }
              }
              var ret = func(...cArgs);

              function onDone(ret) {
                  if (stack !== 0) stackRestore(stack);
                  return convertReturnValue(ret)
              }
              ret = onDone(ret);
              return ret
          };
          var cwrap = (ident, returnType, argTypes, opts) => {
              var numericArgs = !argTypes || argTypes.every(type => type === "number" || type === "boolean");
              var numericRet = returnType !== "string";
              if (numericRet && numericArgs && !opts) {
                  return getCFunc(ident)
              }
              return (...args) => ccall(ident, returnType, argTypes, args, opts)
          };
          var uleb128Encode = (n, target) => {
              if (n < 128) {
                  target.push(n)
              } else {
                  target.push(n % 128 | 128, n >> 7)
              }
          };
          var sigToWasmTypes = sig => {
              var typeNames = {
                  i: "i32",
                  j: "i64",
                  f: "f32",
                  d: "f64",
                  e: "externref",
                  p: "i32"
              };
              var type = {
                  parameters: [],
                  results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
              };
              for (var i = 1; i < sig.length; ++i) {
                  type.parameters.push(typeNames[sig[i]])
              }
              return type
          };
          var generateFuncType = (sig, target) => {
              var sigRet = sig.slice(0, 1);
              var sigParam = sig.slice(1);
              var typeCodes = {
                  i: 127,
                  p: 127,
                  j: 126,
                  f: 125,
                  d: 124,
                  e: 111
              };
              target.push(96);
              uleb128Encode(sigParam.length, target);
              for (var i = 0; i < sigParam.length; ++i) {
                  target.push(typeCodes[sigParam[i]])
              }
              if (sigRet == "v") {
                  target.push(0)
              } else {
                  target.push(1, typeCodes[sigRet])
              }
          };
          var convertJsFunctionToWasm = (func, sig) => {
              if (typeof WebAssembly.Function == "function") {
                  return new WebAssembly.Function(sigToWasmTypes(sig), func)
              }
              var typeSectionBody = [1];
              generateFuncType(sig, typeSectionBody);
              var bytes = [0, 97, 115, 109, 1, 0, 0, 0, 1];
              uleb128Encode(typeSectionBody.length, bytes);
              bytes.push(...typeSectionBody);
              bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
              var module = new WebAssembly.Module(new Uint8Array(bytes));
              var instance = new WebAssembly.Instance(module, {
                  e: {
                      f: func
                  }
              });
              var wrappedFunc = instance.exports["f"];
              return wrappedFunc
          };
          var updateTableMap = (offset, count) => {
              if (functionsInTableMap) {
                  for (var i = offset; i < offset + count; i++) {
                      var item = getWasmTableEntry(i);
                      if (item) {
                          functionsInTableMap.set(item, i)
                      }
                  }
              }
          };
          var functionsInTableMap;
          var getFunctionAddress = func => {
              if (!functionsInTableMap) {
                  functionsInTableMap = new WeakMap;
                  updateTableMap(0, wasmTable.length)
              }
              return functionsInTableMap.get(func) || 0
          };
          var freeTableIndexes = [];
          var getEmptyTableSlot = () => {
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
          };
          var setWasmTableEntry = (idx, func) => wasmTable.set(idx, func);
          var addFunction = (func, sig) => {
              var rtn = getFunctionAddress(func);
              if (rtn) {
                  return rtn
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
          };
          var removeFunction = index => {
              functionsInTableMap.delete(getWasmTableEntry(index));
              setWasmTableEntry(index, null);
              freeTableIndexes.push(index)
          };
          PThread.init();
          Module["requestFullscreen"] = Browser.requestFullscreen;
          Module["setCanvasSize"] = Browser.setCanvasSize;
          Module["getUserMedia"] = Browser.getUserMedia;
          Module["createContext"] = Browser.createContext;
          Module["requestAnimationFrame"] = MainLoop.requestAnimationFrame;
          Module["pauseMainLoop"] = MainLoop.pause;
          Module["resumeMainLoop"] = MainLoop.resume;
          MainLoop.init();
          for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));
          var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
          for (var i = 0; i <= 288; ++i) {
              miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i)
          }
          var miniTempWebGLIntBuffersStorage = new Int32Array(288);
          for (var i = 0; i <= 288; ++i) {
              miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i)
          }
          var proxiedFunctionTable = [_proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_ftruncate64, ___syscall_getcwd, ___syscall_getdents64, ___syscall_ioctl, ___syscall_lstat64, ___syscall_mkdirat, ___syscall_newfstatat, ___syscall_openat, ___syscall_readlinkat, ___syscall_rmdir, ___syscall_stat64, ___syscall_unlinkat, ___syscall_utimensat, __mmap_js, __msync_js, __munmap_js, _eglBindAPI, _eglChooseConfig, _eglCreateContext, _eglCreateWindowSurface, _eglDestroyContext, _eglDestroySurface, _eglGetConfigAttrib, _eglGetDisplay, _eglGetError, _eglInitialize, _eglMakeCurrent, _eglQueryString, _eglSwapBuffers, _eglSwapInterval, _eglTerminate, _eglWaitClient, _eglWaitNative, _emscripten_exit_fullscreen, getCanvasSizeMainThread, setCanvasElementSizeMainThread, _emscripten_exit_pointerlock, _emscripten_force_exit, _emscripten_get_device_pixel_ratio, _emscripten_get_element_css_size, _emscripten_get_gamepad_status, _emscripten_get_num_gamepads, _emscripten_get_screen_size, _emscripten_request_fullscreen_strategy, _emscripten_request_pointerlock, _emscripten_sample_gamepad_data, _emscripten_set_beforeunload_callback_on_thread, _emscripten_set_blur_callback_on_thread, _emscripten_set_element_css_size, _emscripten_set_focus_callback_on_thread, _emscripten_set_fullscreenchange_callback_on_thread, _emscripten_set_gamepadconnected_callback_on_thread, _emscripten_set_gamepaddisconnected_callback_on_thread, _emscripten_set_keydown_callback_on_thread, _emscripten_set_keypress_callback_on_thread, _emscripten_set_keyup_callback_on_thread, _emscripten_set_mousedown_callback_on_thread, _emscripten_set_mouseenter_callback_on_thread, _emscripten_set_mouseleave_callback_on_thread, _emscripten_set_mousemove_callback_on_thread, _emscripten_set_mouseup_callback_on_thread, _emscripten_set_pointerlockchange_callback_on_thread, _emscripten_set_resize_callback_on_thread, _emscripten_set_touchcancel_callback_on_thread, _emscripten_set_touchend_callback_on_thread, _emscripten_set_touchmove_callback_on_thread, _emscripten_set_touchstart_callback_on_thread, _emscripten_set_visibilitychange_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _emscripten_set_window_title, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_sync, _fd_write];
          var wasmImports;

          function assignWasmImports() {
              wasmImports = {
                  Xa: ___assert_fail,
                  fb: ___call_sighandler,
                  ib: ___pthread_create_js,
                  V: ___syscall_fcntl64,
                  Cb: ___syscall_fstat64,
                  xb: ___syscall_ftruncate64,
                  wb: ___syscall_getcwd,
                  eb: ___syscall_getdents64,
                  Db: ___syscall_ioctl,
                  zb: ___syscall_lstat64,
                  qb: ___syscall_mkdirat,
                  Ab: ___syscall_newfstatat,
                  W: ___syscall_openat,
                  db: ___syscall_readlinkat,
                  ab: ___syscall_rmdir,
                  Bb: ___syscall_stat64,
                  cb: ___syscall_unlinkat,
                  _a: ___syscall_utimensat,
                  Hb: __abort_js,
                  tb: __emscripten_init_main_thread_js,
                  $a: __emscripten_notify_mailbox_postmessage,
                  jb: __emscripten_receive_on_main_thread_js,
                  hb: __emscripten_runtime_keepalive_clear,
                  R: __emscripten_thread_cleanup,
                  sb: __emscripten_thread_mailbox_await,
                  Fb: __emscripten_thread_set_strongref,
                  Ya: __emscripten_throw_longjmp,
                  nb: __localtime_js,
                  ob: __mktime_js,
                  kb: __mmap_js,
                  lb: __msync_js,
                  mb: __munmap_js,
                  pb: __tzset_js,
                  Gb: _clock_time_get,
                  Ta: _eglBindAPI,
                  Wa: _eglChooseConfig,
                  Ka: _eglCreateContext,
                  Ma: _eglCreateWindowSurface,
                  La: _eglDestroyContext,
                  Na: _eglDestroySurface,
                  bb: _eglGetConfigAttrib,
                  P: _eglGetDisplay,
                  Ja: _eglGetError,
                  Ua: _eglInitialize,
                  Oa: _eglMakeCurrent,
                  Ia: _eglQueryString,
                  Pa: _eglSwapBuffers,
                  Qa: _eglSwapInterval,
                  Va: _eglTerminate,
                  Sa: _eglWaitGL,
                  Ra: _eglWaitNative,
                  r: _emscripten_asm_const_int,
                  b: _emscripten_asm_const_int_sync_on_main_thread,
                  $: _emscripten_asm_const_ptr_sync_on_main_thread,
                  Pc: _emscripten_cancel_main_loop,
                  S: _emscripten_check_blocking_allowed,
                  X: _emscripten_date_now,
                  Ca: _emscripten_exit_fullscreen,
                  Ga: _emscripten_exit_pointerlock,
                  Eb: _emscripten_exit_with_live_runtime,
                  Ec: _emscripten_force_exit,
                  i: _emscripten_get_device_pixel_ratio,
                  f: _emscripten_get_element_css_size,
                  Z: _emscripten_get_gamepad_status,
                  aa: _emscripten_get_main_loop_timing,
                  e: _emscripten_get_now,
                  $b: _emscripten_get_num_gamepads,
                  Ha: _emscripten_get_screen_size,
                  ia: _emscripten_glActiveTexture,
                  ha: _emscripten_glAttachShader,
                  ya: _emscripten_glBeginQueryEXT,
                  ga: _emscripten_glBindAttribLocation,
                  fa: _emscripten_glBindBuffer,
                  ea: _emscripten_glBindFramebuffer,
                  da: _emscripten_glBindRenderbuffer,
                  qe: _emscripten_glBindTexture,
                  qa: _emscripten_glBindVertexArrayOES,
                  pe: _emscripten_glBlendColor,
                  oe: _emscripten_glBlendEquation,
                  ne: _emscripten_glBlendEquationSeparate,
                  me: _emscripten_glBlendFunc,
                  le: _emscripten_glBlendFuncSeparate,
                  ke: _emscripten_glBufferData,
                  je: _emscripten_glBufferSubData,
                  ie: _emscripten_glCheckFramebufferStatus,
                  he: _emscripten_glClear,
                  ge: _emscripten_glClearColor,
                  fe: _emscripten_glClearDepthf,
                  ee: _emscripten_glClearStencil,
                  Jb: _emscripten_glClipControlEXT,
                  de: _emscripten_glColorMask,
                  ce: _emscripten_glCompileShader,
                  be: _emscripten_glCompressedTexImage2D,
                  ae: _emscripten_glCompressedTexSubImage2D,
                  $d: _emscripten_glCopyTexImage2D,
                  _d: _emscripten_glCopyTexSubImage2D,
                  Zd: _emscripten_glCreateProgram,
                  Yd: _emscripten_glCreateShader,
                  Xd: _emscripten_glCullFace,
                  Wd: _emscripten_glDeleteBuffers,
                  Vd: _emscripten_glDeleteFramebuffers,
                  Ud: _emscripten_glDeleteProgram,
                  Aa: _emscripten_glDeleteQueriesEXT,
                  Td: _emscripten_glDeleteRenderbuffers,
                  Sd: _emscripten_glDeleteShader,
                  Rd: _emscripten_glDeleteTextures,
                  pa: _emscripten_glDeleteVertexArraysOES,
                  Qd: _emscripten_glDepthFunc,
                  Pd: _emscripten_glDepthMask,
                  Nd: _emscripten_glDepthRangef,
                  Md: _emscripten_glDetachShader,
                  Ld: _emscripten_glDisable,
                  Kd: _emscripten_glDisableVertexAttribArray,
                  Jd: _emscripten_glDrawArrays,
                  la: _emscripten_glDrawArraysInstancedANGLE,
                  ma: _emscripten_glDrawBuffersWEBGL,
                  Id: _emscripten_glDrawElements,
                  ka: _emscripten_glDrawElementsInstancedANGLE,
                  Hd: _emscripten_glEnable,
                  Gd: _emscripten_glEnableVertexAttribArray,
                  xa: _emscripten_glEndQueryEXT,
                  Fd: _emscripten_glFinish,
                  Ed: _emscripten_glFlush,
                  Dd: _emscripten_glFramebufferRenderbuffer,
                  Cd: _emscripten_glFramebufferTexture2D,
                  Bd: _emscripten_glFrontFace,
                  Ad: _emscripten_glGenBuffers,
                  yd: _emscripten_glGenFramebuffers,
                  Ba: _emscripten_glGenQueriesEXT,
                  xd: _emscripten_glGenRenderbuffers,
                  wd: _emscripten_glGenTextures,
                  oa: _emscripten_glGenVertexArraysOES,
                  zd: _emscripten_glGenerateMipmap,
                  vd: _emscripten_glGetActiveAttrib,
                  ud: _emscripten_glGetActiveUniform,
                  td: _emscripten_glGetAttachedShaders,
                  sd: _emscripten_glGetAttribLocation,
                  rd: _emscripten_glGetBooleanv,
                  qd: _emscripten_glGetBufferParameteriv,
                  pd: _emscripten_glGetError,
                  od: _emscripten_glGetFloatv,
                  nd: _emscripten_glGetFramebufferAttachmentParameteriv,
                  md: _emscripten_glGetIntegerv,
                  kd: _emscripten_glGetProgramInfoLog,
                  ld: _emscripten_glGetProgramiv,
                  sa: _emscripten_glGetQueryObjecti64vEXT,
                  ua: _emscripten_glGetQueryObjectivEXT,
                  ra: _emscripten_glGetQueryObjectui64vEXT,
                  ta: _emscripten_glGetQueryObjectuivEXT,
                  va: _emscripten_glGetQueryivEXT,
                  id: _emscripten_glGetRenderbufferParameteriv,
                  gd: _emscripten_glGetShaderInfoLog,
                  fd: _emscripten_glGetShaderPrecisionFormat,
                  ed: _emscripten_glGetShaderSource,
                  hd: _emscripten_glGetShaderiv,
                  dd: _emscripten_glGetString,
                  cd: _emscripten_glGetTexParameterfv,
                  bd: _emscripten_glGetTexParameteriv,
                  Zc: _emscripten_glGetUniformLocation,
                  ad: _emscripten_glGetUniformfv,
                  $c: _emscripten_glGetUniformiv,
                  Wc: _emscripten_glGetVertexAttribPointerv,
                  Yc: _emscripten_glGetVertexAttribfv,
                  Xc: _emscripten_glGetVertexAttribiv,
                  Vc: _emscripten_glHint,
                  Uc: _emscripten_glIsBuffer,
                  Tc: _emscripten_glIsEnabled,
                  Sc: _emscripten_glIsFramebuffer,
                  Rc: _emscripten_glIsProgram,
                  za: _emscripten_glIsQueryEXT,
                  Qc: _emscripten_glIsRenderbuffer,
                  Oc: _emscripten_glIsShader,
                  Nc: _emscripten_glIsTexture,
                  na: _emscripten_glIsVertexArrayOES,
                  Mc: _emscripten_glLineWidth,
                  Lc: _emscripten_glLinkProgram,
                  Kc: _emscripten_glPixelStorei,
                  Ib: _emscripten_glPolygonModeWEBGL,
                  Jc: _emscripten_glPolygonOffset,
                  Kb: _emscripten_glPolygonOffsetClampEXT,
                  wa: _emscripten_glQueryCounterEXT,
                  Ic: _emscripten_glReadPixels,
                  Hc: _emscripten_glReleaseShaderCompiler,
                  Gc: _emscripten_glRenderbufferStorage,
                  Fc: _emscripten_glSampleCoverage,
                  Dc: _emscripten_glScissor,
                  Cc: _emscripten_glShaderBinary,
                  Bc: _emscripten_glShaderSource,
                  Ac: _emscripten_glStencilFunc,
                  zc: _emscripten_glStencilFuncSeparate,
                  yc: _emscripten_glStencilMask,
                  xc: _emscripten_glStencilMaskSeparate,
                  wc: _emscripten_glStencilOp,
                  vc: _emscripten_glStencilOpSeparate,
                  uc: _emscripten_glTexImage2D,
                  tc: _emscripten_glTexParameterf,
                  sc: _emscripten_glTexParameterfv,
                  rc: _emscripten_glTexParameteri,
                  qc: _emscripten_glTexParameteriv,
                  pc: _emscripten_glTexSubImage2D,
                  oc: _emscripten_glUniform1f,
                  nc: _emscripten_glUniform1fv,
                  mc: _emscripten_glUniform1i,
                  lc: _emscripten_glUniform1iv,
                  kc: _emscripten_glUniform2f,
                  jc: _emscripten_glUniform2fv,
                  ic: _emscripten_glUniform2i,
                  hc: _emscripten_glUniform2iv,
                  gc: _emscripten_glUniform3f,
                  fc: _emscripten_glUniform3fv,
                  ec: _emscripten_glUniform3i,
                  dc: _emscripten_glUniform3iv,
                  cc: _emscripten_glUniform4f,
                  bc: _emscripten_glUniform4fv,
                  ac: _emscripten_glUniform4i,
                  _b: _emscripten_glUniform4iv,
                  Zb: _emscripten_glUniformMatrix2fv,
                  Yb: _emscripten_glUniformMatrix3fv,
                  Xb: _emscripten_glUniformMatrix4fv,
                  Wb: _emscripten_glUseProgram,
                  Vb: _emscripten_glValidateProgram,
                  Ub: _emscripten_glVertexAttrib1f,
                  Tb: _emscripten_glVertexAttrib1fv,
                  Sb: _emscripten_glVertexAttrib2f,
                  Rb: _emscripten_glVertexAttrib2fv,
                  Qb: _emscripten_glVertexAttrib3f,
                  Pb: _emscripten_glVertexAttrib3fv,
                  Ob: _emscripten_glVertexAttrib4f,
                  Nb: _emscripten_glVertexAttrib4fv,
                  ja: _emscripten_glVertexAttribDivisorANGLE,
                  Mb: _emscripten_glVertexAttribPointer,
                  Lb: _emscripten_glViewport,
                  o: _emscripten_has_asyncify,
                  q: _emscripten_pause_main_loop,
                  Da: _emscripten_request_fullscreen_strategy,
                  N: _emscripten_request_pointerlock,
                  Za: _emscripten_resize_heap,
                  M: _emscripten_resume_main_loop,
                  _: _emscripten_sample_gamepad_data,
                  s: _emscripten_set_beforeunload_callback_on_thread,
                  E: _emscripten_set_blur_callback_on_thread,
                  h: _emscripten_set_canvas_element_size,
                  m: _emscripten_set_element_css_size,
                  F: _emscripten_set_focus_callback_on_thread,
                  v: _emscripten_set_fullscreenchange_callback_on_thread,
                  Y: _emscripten_set_gamepadconnected_callback_on_thread,
                  U: _emscripten_set_gamepaddisconnected_callback_on_thread,
                  y: _emscripten_set_keydown_callback_on_thread,
                  w: _emscripten_set_keypress_callback_on_thread,
                  x: _emscripten_set_keyup_callback_on_thread,
                  Fa: _emscripten_set_main_loop,
                  Q: _emscripten_set_main_loop_timing,
                  K: _emscripten_set_mousedown_callback_on_thread,
                  I: _emscripten_set_mouseenter_callback_on_thread,
                  H: _emscripten_set_mouseleave_callback_on_thread,
                  L: _emscripten_set_mousemove_callback_on_thread,
                  J: _emscripten_set_mouseup_callback_on_thread,
                  z: _emscripten_set_pointerlockchange_callback_on_thread,
                  u: _emscripten_set_resize_callback_on_thread,
                  A: _emscripten_set_touchcancel_callback_on_thread,
                  C: _emscripten_set_touchend_callback_on_thread,
                  B: _emscripten_set_touchmove_callback_on_thread,
                  D: _emscripten_set_touchstart_callback_on_thread,
                  t: _emscripten_set_visibilitychange_callback_on_thread,
                  G: _emscripten_set_wheel_callback_on_thread,
                  Ea: _emscripten_set_window_title,
                  n: _emscripten_sleep,
                  ub: _environ_get,
                  vb: _environ_sizes_get,
                  O: _exit,
                  j: _fd_close,
                  T: _fd_read,
                  rb: _fd_seek,
                  yb: _fd_sync,
                  p: _fd_write,
                  ca: invoke_ii,
                  ba: invoke_iii,
                  c: invoke_iiii,
                  l: invoke_iiiii,
                  jd: invoke_vi,
                  d: invoke_vii,
                  k: invoke_viii,
                  g: invoke_viiii,
                  _c: invoke_viiiii,
                  Od: invoke_viiiiiiiii,
                  a: wasmMemory,
                  gb: _proc_exit
              }
          }
          var wasmExports = await createWasm();
          var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["re"])();
          var _getPixelData = Module["_getPixelData"] = () => (_getPixelData = Module["_getPixelData"] = wasmExports["te"])();
          var _screenshot = Module["_screenshot"] = a0 => (_screenshot = Module["_screenshot"] = wasmExports["ue"])(a0);
          var _buttonPress = Module["_buttonPress"] = a0 => (_buttonPress = Module["_buttonPress"] = wasmExports["ve"])(a0);
          var _buttonUnpress = Module["_buttonUnpress"] = a0 => (_buttonUnpress = Module["_buttonUnpress"] = wasmExports["we"])(a0);
          var _toggleRewind = Module["_toggleRewind"] = a0 => (_toggleRewind = Module["_toggleRewind"] = wasmExports["xe"])(a0);
          var _setVolume = Module["_setVolume"] = a0 => (_setVolume = Module["_setVolume"] = wasmExports["ye"])(a0);
          var _getVolume = Module["_getVolume"] = () => (_getVolume = Module["_getVolume"] = wasmExports["ze"])();
          var _getMainLoopTimingMode = Module["_getMainLoopTimingMode"] = () => (_getMainLoopTimingMode = Module["_getMainLoopTimingMode"] = wasmExports["Ae"])();
          var _getMainLoopTimingValue = Module["_getMainLoopTimingValue"] = () => (_getMainLoopTimingValue = Module["_getMainLoopTimingValue"] = wasmExports["Be"])();
          var _setMainLoopTiming = Module["_setMainLoopTiming"] = (a0, a1) => (_setMainLoopTiming = Module["_setMainLoopTiming"] = wasmExports["Ce"])(a0, a1);
          var _setFastForwardMultiplier = Module["_setFastForwardMultiplier"] = a0 => (_setFastForwardMultiplier = Module["_setFastForwardMultiplier"] = wasmExports["De"])(a0);
          var _getFastForwardMultiplier = Module["_getFastForwardMultiplier"] = () => (_getFastForwardMultiplier = Module["_getFastForwardMultiplier"] = wasmExports["Ee"])();
          var _quitGame = Module["_quitGame"] = () => (_quitGame = Module["_quitGame"] = wasmExports["Fe"])();
          var _free = a0 => (_free = wasmExports["Ge"])(a0);
          var _quitMgba = Module["_quitMgba"] = () => (_quitMgba = Module["_quitMgba"] = wasmExports["He"])();
          var _quickReload = Module["_quickReload"] = () => (_quickReload = Module["_quickReload"] = wasmExports["Ie"])();
          var _pauseGame = Module["_pauseGame"] = () => (_pauseGame = Module["_pauseGame"] = wasmExports["Je"])();
          var _resumeGame = Module["_resumeGame"] = () => (_resumeGame = Module["_resumeGame"] = wasmExports["Ke"])();
          var _setEventEnable = Module["_setEventEnable"] = a0 => (_setEventEnable = Module["_setEventEnable"] = wasmExports["Le"])(a0);
          var _bindKey = Module["_bindKey"] = (a0, a1) => (_bindKey = Module["_bindKey"] = wasmExports["Me"])(a0, a1);
          var _saveState = Module["_saveState"] = a0 => (_saveState = Module["_saveState"] = wasmExports["Ne"])(a0);
          var _loadState = Module["_loadState"] = a0 => (_loadState = Module["_loadState"] = wasmExports["Oe"])(a0);
          var _autoLoadCheats = Module["_autoLoadCheats"] = () => (_autoLoadCheats = Module["_autoLoadCheats"] = wasmExports["Pe"])();
          var _loadGame = Module["_loadGame"] = (a0, a1) => (_loadGame = Module["_loadGame"] = wasmExports["Qe"])(a0, a1);
          var _saveStateSlot = Module["_saveStateSlot"] = (a0, a1) => (_saveStateSlot = Module["_saveStateSlot"] = wasmExports["Re"])(a0, a1);
          var _loadStateSlot = Module["_loadStateSlot"] = (a0, a1) => (_loadStateSlot = Module["_loadStateSlot"] = wasmExports["Se"])(a0, a1);
          var _addCoreCallbacks = Module["_addCoreCallbacks"] = (a0, a1, a2, a3, a4, a5) => (_addCoreCallbacks = Module["_addCoreCallbacks"] = wasmExports["Te"])(a0, a1, a2, a3, a4, a5);
          var _setIntegerCoreSetting = Module["_setIntegerCoreSetting"] = (a0, a1) => (_setIntegerCoreSetting = Module["_setIntegerCoreSetting"] = wasmExports["Ue"])(a0, a1);
          var _setupConstants = Module["_setupConstants"] = () => (_setupConstants = Module["_setupConstants"] = wasmExports["Ve"])();
          var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["We"])(a0, a1);
          var _malloc = a0 => (_malloc = wasmExports["Xe"])(a0);
          var _pthread_self = () => (_pthread_self = wasmExports["Ye"])();
          var __emscripten_tls_init = () => (__emscripten_tls_init = wasmExports["Ze"])();
          var __emscripten_run_callback_on_thread = (a0, a1, a2, a3, a4) => (__emscripten_run_callback_on_thread = wasmExports["_e"])(a0, a1, a2, a3, a4);
          var __emscripten_thread_init = (a0, a1, a2, a3, a4, a5) => (__emscripten_thread_init = wasmExports["$e"])(a0, a1, a2, a3, a4, a5);
          var __emscripten_thread_crashed = () => (__emscripten_thread_crashed = wasmExports["af"])();
          var __emscripten_run_on_main_thread_js = (a0, a1, a2, a3, a4) => (__emscripten_run_on_main_thread_js = wasmExports["bf"])(a0, a1, a2, a3, a4);
          var __emscripten_thread_free_data = a0 => (__emscripten_thread_free_data = wasmExports["cf"])(a0);
          var __emscripten_thread_exit = a0 => (__emscripten_thread_exit = wasmExports["df"])(a0);
          var __emscripten_check_mailbox = () => (__emscripten_check_mailbox = wasmExports["ef"])();
          var _setThrew = (a0, a1) => (_setThrew = wasmExports["ff"])(a0, a1);
          var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["gf"])(a0, a1);
          var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["hf"])(a0);
          var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["jf"])(a0);
          var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["kf"])();
          var _GBAInputInfo = Module["_GBAInputInfo"] = 120400;
          var _binaryName = Module["_binaryName"] = 196432;
          var _projectName = Module["_projectName"] = 196436;
          var _projectVersion = Module["_projectVersion"] = 196440;
          var _gitCommit = Module["_gitCommit"] = 196416;
          var _gitCommitShort = Module["_gitCommitShort"] = 196420;
          var _gitBranch = Module["_gitBranch"] = 196424;
          var _gitRevision = Module["_gitRevision"] = 196428;
          var _GBIORegisterNames = Module["_GBIORegisterNames"] = 58768;
          var _GBSavestateMagic = Module["_GBSavestateMagic"] = 74032;
          var _GBSavestateVersion = Module["_GBSavestateVersion"] = 74036;
          var _GBA_LUX_LEVELS = Module["_GBA_LUX_LEVELS"] = 103504;
          var _GBAVideoObjSizes = Module["_GBAVideoObjSizes"] = 147840;
          var _GBASavestateMagic = Module["_GBASavestateMagic"] = 147616;
          var _GBASavestateVersion = Module["_GBASavestateVersion"] = 147620;

          function invoke_iiiii(index, a1, a2, a3, a4) {
              var sp = stackSave();
              try {
                  return getWasmTableEntry(index)(a1, a2, a3, a4)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_iiii(index, a1, a2, a3) {
              var sp = stackSave();
              try {
                  return getWasmTableEntry(index)(a1, a2, a3)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_vii(index, a1, a2) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1, a2)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_viiii(index, a1, a2, a3, a4) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1, a2, a3, a4)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_ii(index, a1) {
              var sp = stackSave();
              try {
                  return getWasmTableEntry(index)(a1)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_viii(index, a1, a2, a3) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1, a2, a3)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_iii(index, a1, a2) {
              var sp = stackSave();
              try {
                  return getWasmTableEntry(index)(a1, a2)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_vi(index, a1) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }

          function invoke_viiiii(index, a1, a2, a3, a4, a5) {
              var sp = stackSave();
              try {
                  getWasmTableEntry(index)(a1, a2, a3, a4, a5)
              } catch (e) {
                  stackRestore(sp);
                  if (e !== e + 0) throw e;
                  _setThrew(1, 0)
              }
          }
          Module["cwrap"] = cwrap;
          Module["addFunction"] = addFunction;
          Module["removeFunction"] = removeFunction;

          function callMain() {
              var entryFunction = _main;
              var argc = 0;
              var argv = 0;
              try {
                  var ret = entryFunction(argc, argv);
                  exitJS(ret, true);
                  return ret
              } catch (e) {
                  return handleException(e)
              }
          }

          function run() {
              if (runDependencies > 0) {
                  dependenciesFulfilled = run;
                  return
              }
              if (ENVIRONMENT_IS_PTHREAD) {
                  readyPromiseResolve(Module);
                  initRuntime();
                  return
              }
              preRun();
              if (runDependencies > 0) {
                  dependenciesFulfilled = run;
                  return
              }

              function doRun() {
                  Module["calledRun"] = true;
                  if (ABORT) return;
                  initRuntime();
                  preMain();
                  readyPromiseResolve(Module);
                  Module["onRuntimeInitialized"]?.();
                  var noInitialRun = Module["noInitialRun"];
                  if (!noInitialRun) callMain();
                  postRun()
              }
              if (Module["setStatus"]) {
                  Module["setStatus"]("Running...");
                  setTimeout(() => {
                      setTimeout(() => Module["setStatus"](""), 1);
                      doRun()
                  }, 1)
              } else {
                  doRun()
              }
          }
          if (Module["preInit"]) {
              if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
              while (Module["preInit"].length > 0) {
                  Module["preInit"].pop()()
              }
          }
          run();
          moduleRtn = readyPromise;


          return moduleRtn;
      }
  );
})();
export default mGBA;
var isPthread = globalThis.self?.name?.startsWith('em-pthread');
// When running as a pthread, construct a new instance on startup
isPthread && mGBA();