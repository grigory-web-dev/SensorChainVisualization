import { PlatesManager } from './plates.js';
import { Scene3D } from './scene.js';
import { WebSocketManager } from './websocket-manager.js';

let scene3D, platesManager, wsManager;

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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function init() {
    // Инициализация 3D сцены
    scene3D = new Scene3D();
    platesManager = new PlatesManager(scene3D);
    scene3D.animate();

    // Инициализация WebSocket с опциями
    wsManager = new WebSocketManager(`ws://${window.location.host}/ws`, {
        reconnectInterval: 1000,
        maxReconnectAttempts: 5
    });

    // Обработчики событий WebSocket
    wsManager.on('connected', () => {
        showNotification('Connected to server', 'success');
    });

    wsManager.on('disconnected', () => {
        showNotification('Disconnected from server', 'warning');
    });

    wsManager.on('error', (error) => {
        showNotification('Connection error occurred', 'error');
        console.error('WebSocket error:', error);
    });

    wsManager.on('maxReconnectAttemptsReached', () => {
        showNotification('Unable to connect to server. Please refresh the page.', 'error');
    });

    wsManager.on('message', (data) => {
        try {
            platesManager.updatePlates(data);
        } catch (error) {
            console.error('Error processing data:', error);
            showNotification('Error processing data from server', 'error');
        }
    });

    // Инициализация UI компонентов
    initTogglePanel();

    // Обработчик закрытия страницы
    window.addEventListener('beforeunload', () => {
        wsManager.close();
    });
}

// Добавляем стили для уведомлений
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-size: 14px;
        z-index: 1000;
        transition: opacity 0.5s;
    }

    .notification.info {
        background-color: #2196F3;
    }

    .notification.success {
        background-color: #4CAF50;
    }

    .notification.warning {
        background-color: #FFC107;
        color: black;
    }

    .notification.error {
        background-color: #F44336;
    }

    .notification.fade-out {
        opacity: 0;
    }
`;
document.head.appendChild(style);

// Initialize when loaded
window.addEventListener('load', init);