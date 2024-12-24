export class WebSocketManager {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 1000,
            maxReconnectAttempts: 5,
            ...options
        };

        this.ws = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
        this.connectionStatus = document.createElement('div');
        this.setupStatusIndicator();

        this.connect();
    }

    setupStatusIndicator() {
        this.connectionStatus.className = 'connection-status';
        this.connectionStatus.style.position = 'fixed';
        this.connectionStatus.style.top = '10px';
        this.connectionStatus.style.left = '10px'; // Изменено с right на left
        this.connectionStatus.style.padding = '5px 10px';
        this.connectionStatus.style.borderRadius = '5px';
        this.connectionStatus.style.fontSize = '14px';
        this.connectionStatus.style.zIndex = '1000';
        document.body.appendChild(this.connectionStatus);
        this.updateConnectionStatus('disconnected');
    }

    updateConnectionStatus(status) {
        const statusConfig = {
            connected: { text: '🟢 Connected', color: '#4CAF50' },
            connecting: { text: '🟡 Connecting...', color: '#FFC107' },
            disconnected: { text: '🔴 Disconnected', color: '#F44336' },
            error: { text: '⚠️ Connection Error', color: '#F44336' }
        };

        const config = statusConfig[status];
        if (config) {
            this.connectionStatus.textContent = config.text;
            this.connectionStatus.style.backgroundColor = config.color;
            this.connectionStatus.style.color = 'white';
        }
    }

    connect() {
        try {
            this.updateConnectionStatus('connecting');
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
                this.emit('connected');
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus('disconnected');
                this.emit('disconnected');
                this.tryReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
                this.emit('error', error);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.emit('message', data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    this.emit('error', error);
                }
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionStatus('error');
            this.tryReconnect();
        }
    }

    tryReconnect() {
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), this.options.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.updateConnectionStatus('error');
            this.emit('maxReconnectAttemptsReached');
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
        this.connectionStatus.remove();
    }
}
