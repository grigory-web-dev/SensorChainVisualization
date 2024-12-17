import { PlatesManager } from './plates.js';
import { Scene3D } from './scene.js';

let scene3D, platesManager;

function init() {
    scene3D = new Scene3D();
    platesManager = new PlatesManager(scene3D);
    scene3D.animate();

    // WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        platesManager.updatePlates(data);
    };
}

// Initialize when loaded
init();
