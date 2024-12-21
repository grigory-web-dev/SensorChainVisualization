import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor() {
        this.container = document.getElementById('scene-container');
        this.scene = new THREE.Scene();

        // Базовые настройки и размеры
        this.gridSize = 10;  // размер в метрах
        this.gridDivisions = 10;  // количество делений

        // Устанавливаем центр мира в центр куба
        this.worldCenter = new THREE.Vector3(this.gridSize / 2, this.gridSize / 2, this.gridSize / 2);

        // Создаем контейнер для перемещаемой части сцены и смещаем его в центр пола куба
        this.movableSystem = new THREE.Group();
        // this.movableSystem.position.set(this.gridSize / 2, 0, this.gridSize / 2);
        this.movableSystem.position.set(this.gridSize / 2, this.gridSize / 10, this.gridSize / 2);

        this.scene.add(this.movableSystem);

        // Инициализация всех компонентов
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.setupGrids();
        this.setupAxes();
        this.setupDimensionLabels();

        // Настройка управления движением
        this.setupMovementControls();

        // Обработчики событий
        window.addEventListener('resize', () => this.onWindowResize());

        // Запуск анимации
        this.animate();
    }

    setupCamera() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

        // Перемещаем камеру на середину передней грани (XY)
        // X: середина грани (gridSize/2)
        // Y: середина грани (gridSize/2)
        // Z: отодвигаем камеру от грани для лучшего обзора
        this.camera.position.set(
            this.gridSize / 2 + this.gridSize * 0.6,  // X - середина по ширине
            this.gridSize / 2,  // Y - середина по высоте
            this.gridSize + this.gridSize * 0.2   // Z - отодвигаем камеру от куба для обзора
        );
        this.camera.lookAt(this.worldCenter);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Основной направленный свет
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(this.gridSize, this.gridSize, this.gridSize);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = this.gridSize * 2;
        this.scene.add(mainLight);

        // Ambient light для общего освещения
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Hemisphere light для более естественного освещения
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.5);
        this.scene.add(hemisphereLight);
    }

    setupGrids() {
        const mainColor = new THREE.Color(0x888888);
        const secondaryColor = new THREE.Color(0x444444);

        // Создаем сетки для трех граней куба
        // Нижняя сетка (пол)
        const gridXZ = new THREE.GridHelper(this.gridSize, this.gridDivisions);
        gridXZ.material.opacity = 0.5;
        gridXZ.material.transparent = true;
        gridXZ.position.set(this.gridSize / 2, 0, this.gridSize / 2);
        this.scene.add(gridXZ);

        // Задняя сетка
        const gridXY = new THREE.GridHelper(this.gridSize, this.gridDivisions);
        gridXY.rotation.x = Math.PI / 2;
        gridXY.material.opacity = 0.3;
        gridXY.material.transparent = true;
        gridXY.position.set(this.gridSize / 2, this.gridSize / 2, 0);
        this.scene.add(gridXY);

        // Боковая сетка
        const gridYZ = new THREE.GridHelper(this.gridSize, this.gridDivisions);
        gridYZ.rotation.z = Math.PI / 2;
        gridYZ.material.opacity = 0.3;
        gridYZ.material.transparent = true;
        gridYZ.position.set(0, this.gridSize / 2, this.gridSize / 2);
        this.scene.add(gridYZ);
    }


    setupDimensionLabels() {
        const step = this.gridSize / this.gridDivisions;
        const offset = 0.4;

        // Создаем метки для делений (только для положительных значений)
        for (let i = 0; i <= this.gridSize; i += step) {
            // Метки по оси X
            this.addDimensionLabel(
                (i * 1000).toFixed(0),
                new THREE.Vector3(i, -offset, 0),
                'center'
            );

            // Метки по оси Y
            this.addDimensionLabel(
                (i * 1000).toFixed(0),
                new THREE.Vector3(-offset, i, 0),
                'right'
            );

            // Метки по оси Z
            this.addDimensionLabel(
                (i * 1000).toFixed(0),
                new THREE.Vector3(0, -offset, i),
                'center'
            );
        }

        // Подписи осей
        const axisOffset = this.gridSize + 1.0;
        this.addAxisLabel('X (mm)', new THREE.Vector3(axisOffset, 0, 0), 'red');
        this.addAxisLabel('Y (mm)', new THREE.Vector3(0, axisOffset, 0), 'green');
        this.addAxisLabel('Z (mm)', new THREE.Vector3(0, 0, axisOffset), 'blue');
    }

    addDimensionLabel(text, position, align = 'center') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 32;

        context.fillStyle = '#666666';
        context.font = '24px Arial';
        context.textAlign = align;
        context.textBaseline = 'middle';

        const padding = 10;
        const xPosition = align === 'center' ? canvas.width / 2 :
            align === 'right' ? canvas.width - padding :
                padding;

        context.fillText(text, xPosition, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.copy(position);
        sprite.scale.set(0.75, 0.25, 1);

        this.scene.add(sprite);
    }

    addAxisLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = color;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.copy(position);
        sprite.scale.set(2, 0.5, 1);

        this.scene.add(sprite);
    }

    setupAxes() {
        const radius = 0.02;
        const axisMaterial = {
            x: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
            y: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            z: new THREE.MeshBasicMaterial({ color: 0x0000ff })
        };

        // Создаем оси по ребрам куба
        ['x', 'y', 'z'].forEach(axis => {
            const geometry = new THREE.CylinderGeometry(radius, radius, this.gridSize);
            const mesh = new THREE.Mesh(geometry, axisMaterial[axis]);

            switch (axis) {
                case 'x':
                    mesh.rotation.z = -Math.PI / 2;
                    mesh.position.set(this.gridSize / 2, 0, 0);
                    break;
                case 'y':
                    mesh.position.set(0, this.gridSize / 2, 0);
                    break;
                case 'z':
                    mesh.rotation.x = Math.PI / 2;
                    mesh.position.set(0, 0, this.gridSize / 2);
                    break;
            }
            this.scene.add(mesh);
        });
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.copy(this.worldCenter);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupMovementControls() {
        this.isMoving = false;
        this.isRotating = false;
        this.dragOffset = new THREE.Vector3();
        this.intersection = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.movePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.lastMousePosition = new THREE.Vector2();

        // Создаем плоскость для движения
        const planeGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.dragPlane.rotation.x = -Math.PI / 2;
        this.dragPlane.position.set(this.gridSize / 2, 0, this.gridSize / 2);
        this.dragPlane.visible = false;
        this.scene.add(this.dragPlane);

        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        if (event.key === 'Shift') {
            this.controls.enabled = false;
            this.dragPlane.visible = true;
        } else if (event.key === 'Control') {
            this.controls.enabled = false;
        }
    }

    onKeyUp(event) {
        if (event.key === 'Shift') {
            this.controls.enabled = true;
            this.dragPlane.visible = false;
            this.isMoving = false;  // Добавляем сброс флага движения
        } else if (event.key === 'Control') {
            this.controls.enabled = true;
            this.isRotating = false;  // Добавляем сброс флага вращения
        }
    }

    onMouseDown(event) {
        if (event.ctrlKey && event.button === 0) {
            this.isRotating = true;
            this.lastMousePosition.set(event.clientX, event.clientY);
            return;
        }

        if (event.shiftKey) {
            const mousePosition = new THREE.Vector2(
                (event.clientX / this.container.clientWidth) * 2 - 1,
                -(event.clientY / this.container.clientHeight) * 2 + 1
            );

            this.raycaster.setFromCamera(mousePosition, this.camera);
            this.lastMouseY = event.clientY;

            if (event.button === 0) {
                // Используем dragPlane для пересечения
                const intersects = this.raycaster.ray.intersectPlane(this.movePlane, this.intersection);
                if (intersects) {
                    this.isMoving = true;
                    this.moveType = 'horizontal';
                    this.dragOffset.subVectors(this.movableSystem.position, this.intersection);
                }
            } else if (event.button === 2) {
                this.isMoving = true;
                this.moveType = 'vertical';
            }
        }
    }

    onMouseMove(event) {
        if (this.isRotating) {
            const deltaX = event.clientX - this.lastMousePosition.x;
            const deltaY = event.clientY - this.lastMousePosition.y;

            this.movableSystem.rotation.y += deltaX * 0.01;
            this.movableSystem.rotation.x += deltaY * 0.01;

            this.lastMousePosition.set(event.clientX, event.clientY);
            return;
        }

        if (!this.isMoving) return;

        if (this.moveType === 'horizontal') {
            const mousePosition = new THREE.Vector2(
                (event.clientX / this.container.clientWidth) * 2 - 1,
                -(event.clientY / this.container.clientHeight) * 2 + 1
            );

            this.raycaster.setFromCamera(mousePosition, this.camera);

            if (this.raycaster.ray.intersectPlane(this.movePlane, this.intersection)) {
                const newPosition = new THREE.Vector3();
                newPosition.addVectors(this.intersection, this.dragOffset);
                // Сохраняем текущую высоту
                newPosition.y = this.movableSystem.position.y;
                this.movableSystem.position.copy(newPosition);
            }
        } else if (this.moveType === 'vertical') {
            const deltaY = (event.clientY - this.lastMouseY) * 0.01;
            this.movableSystem.position.y = Math.max(0, this.movableSystem.position.y - deltaY);
            this.lastMouseY = event.clientY;
        }
    }

    onMouseUp() {
        this.isMoving = false;
        this.isRotating = false;
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getMovableSystem() {
        return this.movableSystem;
    }
}
