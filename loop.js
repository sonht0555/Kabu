let running = false;
let lastTime = performance.now();
const targetFPS = 60;
const timestep = 1000 / targetFPS;

function loop(now = performance.now()) {
    if (!running) return;

    const delta = now - lastTime;
    if (delta >= timestep) {
        lastTime = now - (delta % timestep);
        postMessage('tick');
    }

    setTimeout(() => loop(performance.now()), 1); // fallback timer loop
}

onmessage = (e) => {
    if (e.data === 'start') {
        if (!running) {
            running = true;
            lastTime = performance.now();
            loop();
        }
    } else if (e.data === 'stop') {
        running = false;
    }
};
