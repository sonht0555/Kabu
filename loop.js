function loop() {
    postMessage('tick');
    requestAnimationFrame(loop);
}