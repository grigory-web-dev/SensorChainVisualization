class PlatesCameraControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3(0, 0, 0);

        // Состояние управления
        this.isRotating = false;
        this.isPanning = false;

        // Последняя позиция мыши
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Чувствительность
        this.rotateSpeed = 0.005;
        this.panSpeed = 0.01;
        this.zoomSpeed = 0.001;  // Уменьшил скорость зума для более плавного приближения

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.domElement.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        this.domElement.addEventListener('wheel', this.onWheel);
    }

    onMouseDown(event) {
        if (event.shiftKey) {
            this.isPanning = true;
        } else {
            this.isRotating = true;
        }

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    onMouseMove(event) {
        if (!this.isRotating && !this.isPanning) return;

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        if (this.isRotating) {
            const theta = deltaX * this.rotateSpeed;
            const phi = deltaY * this.rotateSpeed;

            const position = new THREE.Vector3().copy(this.camera.position);
            position.sub(this.target);
            position.applyAxisAngle(new THREE.Vector3(0, 1, 0), theta);
            position.applyAxisAngle(new THREE.Vector3(1, 0, 0), phi);
            position.add(this.target);

            this.camera.position.copy(position);
            this.camera.lookAt(this.target);
        } else if (this.isPanning) {
            this.target.x -= deltaX * this.panSpeed;
            this.target.y += deltaY * this.panSpeed;
            this.camera.position.x -= deltaX * this.panSpeed;
            this.camera.position.y += deltaY * this.panSpeed;
        }

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    onMouseUp() {
        this.isRotating = false;
        this.isPanning = false;
    }

    onWheel(event) {
        event.preventDefault();

        const zoomDelta = event.deltaY * this.zoomSpeed;
        const position = new THREE.Vector3().copy(this.camera.position);
        position.sub(this.target);
        position.multiplyScalar(1 + zoomDelta);
        position.add(this.target);
        this.camera.position.copy(position);
    }

    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.domElement.removeEventListener('wheel', this.onWheel);
    }
}
