import * as Main from './main.js';
/* --------------- Declaration --------------- */
let gl = null, program = null, texture = null, ctx2d = null, lut64 = null, lut64Streng = null, lut64Profile = null, imageDataObj = null, fs = null, vs = null;
/* --------------- Function ------------------ */
async function loadLUT64() {
    systemType = gameName.slice(-3);
    const temperatureStreng = localStorage.getItem(`${gameName}_streng`) || "4.0";
    const temperature = (localStorage.getItem(`${gameName}_temperature`) || "warm").toLowerCase();
    if (!lut64 || lut64Streng !== temperatureStreng || lut64Profile !== temperature) {
        const filename = `./src/lut/lut64_${temperature}_${temperatureStreng}.bin`
        console.log(filename);
        const res = await fetch(filename);
        const buf = await res.arrayBuffer();
        lut64 = new Uint8Array(buf);
        lut64Streng = temperatureStreng;
        lut64Profile = temperature;
    }
}
// Setup Webgl
function setupWebGL_Shader(mode) {
    // Webgl setup
    gl = bufferCanvas.getContext("webgl" , {alpha: false,depth: false,antialias: false,premultipliedAlpha: false,preserveDrawingBuffer: false,powerPreference: 'low-power',});
    gl.viewport(0, 0, bufferCanvas.width, bufferCanvas.height);

    // Shader setup
    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }
    vs = `attribute vec2 position;attribute vec2 texcoord;varying vec2 v_texcoord;void main() {gl_Position = vec4(position, 0.0, 1.0);v_texcoord = texcoord;}`;
    if (mode === "webgl") {
        fs = `precision mediump float;varying vec2 v_texcoord;uniform sampler2D texture;void main() {gl_FragColor = texture2D(texture, v_texcoord);}`;
    } else if (mode === "webgl_full") {
        fs = `precision mediump float;varying vec2 v_texcoord;uniform sampler2D texSampler;uniform vec2 game_size;uniform vec2 render_size;uniform float smooth_width;uniform float smooth_height;vec4 interpolate_color(vec2 tex_coord){vec2 ip=floor(tex_coord*game_size-0.5)+0.5;vec2 residual=fract(tex_coord*game_size+0.5);ip/=game_size;vec4 v0=texture2D(texSampler,ip);vec4 v1=texture2D(texSampler,ip+vec2(1.0,0.0)/game_size);vec4 v2=texture2D(texSampler,ip+vec2(0.0,1.0)/game_size);vec4 v3=texture2D(texSampler,ip+vec2(1.0,1.0)/game_size);vec2 smooth_dim=vec2(smooth_width,smooth_height);if(fract(render_size.x/game_size.x)*game_size.x<0.01)smooth_dim.x=0.01;if(fract(render_size.y/game_size.y)*game_size.y<0.01)smooth_dim.y=0.01;vec2 alpha=vec2(smoothstep(0.5-smooth_dim.x*0.5,0.5+smooth_dim.x*0.5,residual.x),smoothstep(0.5-smooth_dim.y*0.5,0.5+smooth_dim.y*0.5,residual.y));return mix(mix(v0,v1,alpha.x),mix(v2,v3,alpha.x),alpha.y);}void main(){gl_FragColor=interpolate_color(v_texcoord);}`
    }
    const vertexShader = createShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
}
// Setup Texture and Buffer
function setupTexture_Buffer(mode) {
    // Texture setup
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mode === "webgl_full") {
        gl.uniform2f(gl.getUniformLocation(program, "game_size"), gameWidth, gameHeight);
        gl.uniform2f(gl.getUniformLocation(program, "render_size"), gl.canvas.width, gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(program, "smooth_width"), gameWidth / gl.canvas.width);
        gl.uniform1f(gl.getUniformLocation(program, "smooth_height"), gameHeight / gl.canvas.height);
    }
    // Buffer setup
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "position"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "position"));

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "texcoord"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "texcoord"));
}
// Setup 2D context
function setup2DContext() {
    ctx2d = bufferCanvas.getContext("2d");
    ctx2d.imageSmoothingEnabled = false;
}
// Render Pixel
async function renderPixel(mode) {
    const pixelData = Main.getPixelData();
    if (!pixelData) return;
    await loadLUT64();
    const imageData = new Uint8ClampedArray(gameWidth * gameHeight * 4);
    for (let y = 0; y < gameHeight; y++) {
        for (let x = 0; x < gameWidth; x++) {
            const srcIndex = y * gameStride + x;
            const destIndex = (y * gameWidth + x) * 4;
            const color = pixelData[srcIndex];
            const r = (color & 0xFF) >> 2;
            const g = ((color >> 8) & 0xFF) >> 2;
            const b = ((color >> 16) & 0xFF) >> 2;
            const lutIndex = ((r * 64 * 64) + (g * 64) + b) * 3;
            imageData[destIndex]     = lut64[lutIndex];
            imageData[destIndex + 1] = lut64[lutIndex + 1];
            imageData[destIndex + 2] = lut64[lutIndex + 2];
            imageData[destIndex + 3] = 255;
        }
    }

    if (mode === "webgl") {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gameWidth, gameHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (mode === "2d") {
        imageDataObj = new ImageData(imageData, gameWidth, gameHeight);
        createImageBitmap(imageDataObj).then((bitmap) => {
            ctx2d.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
            ctx2d.drawImage(bitmap, 0, 0);
        });
    }

    requestAnimationFrame(() => renderPixel(mode));
}
// Switch Render Mode
export async function switchRenderMode(mode) {
    systemType = gameName.slice(-3)
    if (mode === "2d") {
        setupStyle("2d");
        setup2DContext()
        renderPixel("2d");
    } else if (mode === "webgl") {
        setupStyle("2d");
        setupWebGL_Shader("webgl");
        setupTexture_Buffer("webgl");
        renderPixel("webgl");
    } else if (mode === "webgl_full") {
        setupStyle("webgl_full");
        setupWebGL_Shader("webgl_full");
        setupTexture_Buffer("webgl_full");
        renderPixel("webgl");
    }
}