let running = false;

function loop() {
    if (!running) return;

    postMessage('tick');
    requestAnimationFrame(loop);
}

onmessage = (e) => {
    if (e.data === 'start') {
        if (!running) {
            running = true;
            requestAnimationFrame(loop);
        }
    } else if (e.data === 'stop') {
        running = false;
    }
};