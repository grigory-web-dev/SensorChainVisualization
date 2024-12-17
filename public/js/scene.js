import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.targetSphere = null; // Для отладки
        this.setupScene();
    }

    setupScene() {
        console.log('Setting up scene...');

        // Scene
        this.scene.background = new THREE.Color(0x222222);

        // Camera
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        // Вычисляем позицию начала координат
        this.worldCenter = {
            x: 0,
            y: -(window.innerHeight / 3),
            z: 0
        };

        // Начальная позиция камеры относительно центра координат
        this.camera.position.set(
            this.worldCenter.x + 5,
            this.worldCenter.y + 5,
            5
        );

        // Renderer с явными настройками теней
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true  // для лучшей точности теней
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('Shadow settings:', {
            enabled: this.renderer.shadowMap.enabled,
            type: this.renderer.shadowMap.type
        });

        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;

        // Отключаем встроенный зум
        this.controls.enableZoom = false;

        // Добавляем свой обработчик зума
        this.renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();

            // Уменьшаем значение deltaY
            const scaledDelta = event.deltaY * 0.0005;
            //// console.log('Scaled delta:', scaledDelta);

            const currentDistance = this.camera.position.distanceTo(this.controls.target);
            //// console.log('Current distance before zoom:', currentDistance);

            // Плавное изменение расстояния
            const factor = 1 - scaledDelta;
            const newDistance = THREE.MathUtils.clamp(
                currentDistance * factor,
                this.controls.minDistance,
                this.controls.maxDistance
            );

            //// console.log('New distance after zoom:', newDistance);

            // Обновляем позицию камеры
            const direction = this.camera.position.clone()
                .sub(this.controls.target)
                .normalize()
                .multiplyScalar(newDistance);

            this.camera.position.copy(this.controls.target).add(direction);

        }, { passive: false });


        // Отладочная сфера для визуализации target
        const targetGeometry = new THREE.SphereGeometry(0.1);
        const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.targetSphere = new THREE.Mesh(targetGeometry, targetMaterial);
        this.targetSphere.position.copy(this.controls.target);
        this.scene.add(this.targetSphere);

        this.setupEnvironment();
        this.setupLights();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Добавим две направленные лампы для лучшего освещения
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(-5, 10, 7);
        mainLight.castShadow = true;

        // Детальная настройка теней
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.radius = 4; // размытие теней
        mainLight.shadow.bias = -0.0001;

        this.scene.add(mainLight);

        // Вспомогательный свет для подсветки теней
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(5, 5, -5);
        this.scene.add(fillLight);

        console.log('Main light settings:', {
            position: mainLight.position,
            castShadow: mainLight.castShadow,
            shadowMapSize: {
                width: mainLight.shadow.mapSize.width,
                height: mainLight.shadow.mapSize.height
            },
            shadowCameraSettings: {
                near: mainLight.shadow.camera.near,
                far: mainLight.shadow.camera.far,
                left: mainLight.shadow.camera.left,
                right: mainLight.shadow.camera.right,
                top: mainLight.shadow.camera.top,
                bottom: mainLight.shadow.camera.bottom
            }
        });

        // Добавляем помощник для отладки теней
        const helper = new THREE.CameraHelper(mainLight.shadow.camera);
        this.scene.add(helper);
    }

    setupEnvironment() {
        // Grid
        const gridHelper = new THREE.GridHelper(10, 10);
        gridHelper.position.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.scene.add(gridHelper);

        // Axes
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.scene.add(axesHelper);

        // Настройка стола для приема теней
        const tableGeometry = new THREE.PlaneGeometry(20, 20);  // увеличим размер для лучшей видимости теней
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.rotation.x = -Math.PI / 2;
        this.table.position.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.table.receiveShadow = true;
        console.log('Table shadow settings:', {
            receiveShadow: this.table.receiveShadow
        });

        this.scene.add(this.table);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    onWindowResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspectRatio;

        // Обновляем позицию центра при изменении размера окна
        this.worldCenter.y = -(window.innerHeight / 3);
        console.log('Updated world center on resize:', this.worldCenter);

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Обновляем позиции элементов сцены
        this.table.position.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.scene.children.forEach(child => {
            if (child.isGridHelper || child.isAxesHelper) {
                child.position.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
            }
        });

        // Обновляем цель камеры
        this.controls.target.set(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);
        this.targetSphere.position.copy(this.controls.target);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        // Используем render вместо прямого вызова renderer
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }
}
