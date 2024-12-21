import { PlatesManager } from './plates.js';
import { Scene3D } from './scene.js';

let scene3D, platesManager;

function initTogglePanel() {
    const toggleButton = document.getElementById('toggle-panel');
    const infoPanel = document.getElementById('info-panel');

    if (toggleButton && infoPanel) {
        toggleButton.addEventListener('click', () => {
            infoPanel.classList.toggle('panel-collapsed');
            toggleButton.classList.toggle('button-collapsed');
        });
    }
}

function init() {
    scene3D = new Scene3D();
    platesManager = new PlatesManager(scene3D);
    scene3D.animate();

    // WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = function() {
        console.log("WebSocket connection established");
    };
    
    ws.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket data:", data);
            platesManager.updatePlates(data);
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    };
    
    ws.onerror = function(error) {
        console.error("WebSocket error:", error);
    };
    
    ws.onclose = function() {
        console.log("WebSocket connection closed");
    };

    initTogglePanel();
}

// Initialize when loaded
window.addEventListener('load', init);