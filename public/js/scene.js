import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.worldCenter = new THREE.Group();
        this.scene.add(this.worldCenter);

        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.setupGrids();
        this.setupMovementControls();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 5, 10);
        this.camera.lookAt(5, 5, 5);
    }

    setupLights() {
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 500;
        mainLight.shadow.camera.right = 150;
        mainLight.shadow.camera.left = -150;
        mainLight.shadow.camera.top = 150;
        mainLight.shadow.camera.bottom = -150;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;

        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 100;
        this.controls.target.set(5, 5, 5);
    }

    setupGrids() {
        const size = 10;
        const divisions = 10;
        const halfHeight = 5;

        // Создаем группу для всех элементов сетки
        const gridGroup = new THREE.Group();

        // Функция создания тонкой сетки
        const createThinGrid = (size, divisions, rotationX = 0, rotationY = 0, rotationZ = 0, position = new THREE.Vector3()) => {
            const step = size / divisions;
            const vertices = [];
            const material = new THREE.LineBasicMaterial({
                color: 0x444444,
                linewidth: 0.5, // Устанавливаем минимальную толщину линий
                opacity: 0.3,
                transparent: true
            });

            // Создаем горизонтальные линии
            for (let i = 0; i <= divisions; i++) {
                const pos = (i * step) - size / 2;
                vertices.push(
                    -size / 2, 0, pos,    // Начальная точка
                    size / 2, 0, pos      // Конечная точка
                );
            }

            // Создаем вертикальные линии
            for (let i = 0; i <= divisions; i++) {
                const pos = (i * step) - size / 2;
                vertices.push(
                    pos, 0, -size / 2,    // Начальная точка
                    pos, 0, size / 2      // Конечная точка
                );
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const grid = new THREE.LineSegments(geometry, material);
            grid.rotation.x = rotationX;
            grid.rotation.y = rotationY;
            grid.rotation.z = rotationZ;
            grid.position.copy(position);

            return grid;
        };

        // Создаем три сетки для разных плоскостей
        const gridXZ = createThinGrid(size, divisions, 0, Math.PI, 0);
        gridGroup.add(gridXZ);

        const gridXY = createThinGrid(
            size,
            divisions,
            Math.PI / 2,
            0,
            0,
            new THREE.Vector3(0, halfHeight, -halfHeight)
        );
        gridGroup.add(gridXY);

        const gridYZ = createThinGrid(
            size,
            divisions,
            0,
            0,
            Math.PI / 2,
            new THREE.Vector3(-halfHeight, halfHeight, 0)
        );
        gridGroup.add(gridYZ);

        // Функция создания меток
        const createLabel = (text, position) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 64;

            ctx.fillStyle = 'white';
            ctx.font = '42px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 64, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.5, 0.25, 1);
            sprite.position.copy(position);

            return sprite;
        };

        // Добавляем метки (значения в мм)
        for (let i = -5; i <= 5; i++) {
            const value = i * 100;

            // Метки по X (на горизонтальной плоскости)
            const xLabel = createLabel(value.toString(),
                new THREE.Vector3(i, 0.2, 0.2));
            gridGroup.add(xLabel);

            // Метки по Z (на горизонтальной плоскости)
            const zLabel = createLabel(value.toString(),
                new THREE.Vector3(0.2, 0.2, i));
            gridGroup.add(zLabel);

            // Метки по Y (на вертикальных плоскостях)
            const yLabelXY = createLabel(value.toString(),
                new THREE.Vector3(0.5 - halfHeight, i + 5, 0.2 - halfHeight));
            gridGroup.add(yLabelXY);
        }

        // Добавляем подписи осей
        const xAxisLabel = createLabel('X', new THREE.Vector3(halfHeight + 0.2, 0, 0));
        const yAxisLabel = createLabel('Y', new THREE.Vector3(-halfHeight, size + 0.2, -halfHeight));
        const zAxisLabel = createLabel('Z', new THREE.Vector3(0, 0, halfHeight + 0.2));

        gridGroup.add(xAxisLabel);
        gridGroup.add(yAxisLabel);
        gridGroup.add(zAxisLabel);

        // Создаем оси
        const createAxis = (start, end, color) => {
            const material = new THREE.LineBasicMaterial({
                color,
                linewidth: 2
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            return new THREE.Line(geometry, material);
        };

        // X - красный (горизонтально)
        gridGroup.add(createAxis(
            new THREE.Vector3(-halfHeight, 0, 0),
            new THREE.Vector3(halfHeight, 0, 0),
            0xff0000
        ));

        // Y - зеленый (вертикально)
        gridGroup.add(createAxis(
            new THREE.Vector3(-halfHeight, 0, -halfHeight),
            new THREE.Vector3(-halfHeight, size, -halfHeight),
            0x00ff00
        ));

        // Z - синий (горизонтально)
        gridGroup.add(createAxis(
            new THREE.Vector3(0, 0, -halfHeight),
            new THREE.Vector3(0, 0, halfHeight),
            0x0000ff
        ));

        this.scene.add(gridGroup);
    }

    setupMovementControls() {
        this.isShiftDown = false;
        this.isCtrlDown = false;
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        if (event.key === 'Shift') this.isShiftDown = true;
        if (event.key === 'Control') this.isCtrlDown = true;
    }

    onKeyUp(event) {
        if (event.key === 'Shift') this.isShiftDown = false;
        if (event.key === 'Control') this.isCtrlDown = false;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getMovableSystem() {
        return this.worldCenter;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
