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
    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        platesManager.updatePlates(data);
        // Обновляем только содержимое info-panel, не трогая кнопку
        updateInfoPanel(data);
    };

    initTogglePanel();
}

// Функция для обновления только содержимого панели
function updateInfoPanel(data) {
    const infoPanel = document.getElementById('info-panel');
    // Сохраняем состояние collapsed
    const wasCollapsed = infoPanel.classList.contains('panel-collapsed');

    // Обновляем содержимое
    let html = `
        <div class="system-info">
            <div class="plate-info-row">
                <span class="plate-info-label">Base Height:</span>
                <span class="plate-info-value">${data.baseHeight.toFixed(1)} mm</span>
            </div>
        </div>
    `;

    for (let i = 0; i < data.plates.length; i++) {
        const plate = data.plates[i];
        html += `
            <div class="plate-info">
                <div class="plate-info-title">Plate ${i + 1}</div>
                <div class="plate-info-row">
                    <span class="plate-info-label">Position:</span>
                    <span class="plate-info-value">(${plate.position.map(v => v.toFixed(1).padStart(8))})</span>
                </div>
                <div class="plate-info-row">
                    <span class="plate-info-label">Angles:</span>
                    <span class="plate-info-value">(${plate.angles.map(v => v.toFixed(1).padStart(8))})</span>
                </div>
            </div>
        `;
    }

    infoPanel.innerHTML = html;

    // Восстанавливаем состояние collapsed если было
    if (wasCollapsed) {
        infoPanel.classList.add('panel-collapsed');
    }
}

// Initialize when loaded
init();
