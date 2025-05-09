let running = false;

function loop() {
    if (!running) return;

    postMessage('tick');
    requestAnimationFrame(loop);
}

onmessage = (e) => {
    if (e.data === 'resume') {
        running = true;
    } else if (e.data === 'pause') {
        running = false;
    } else if (e.data === 'start') {
        if (!running) return;
        loop()
    }
};