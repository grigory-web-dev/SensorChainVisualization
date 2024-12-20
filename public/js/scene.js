// public/js/scene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.targetSphere = null;
        this.setupScene();
    }

    setupScene() {
        console.log('Setting up scene...');

        // Scene
        this.scene.background = new THREE.Color(0x222222);

        // Camera
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        // Центр мира теперь в начале координат
        this.worldCenter = {
            x: 0,
            y: 0,
            z: 0
        };

        // Позиционируем камеру для лучшего обзора сцены
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(this.worldCenter.x, this.worldCenter.y, this.worldCenter.z);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(this.renderer.domElement);

        // Настройка управления камерой
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(
            this.worldCenter.x,
            this.worldCenter.y,
            this.worldCenter.z
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;

        // Отключаем встроенный зум
        this.controls.enableZoom = false;

        // Добавляем свой обработчик зума
        this.renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            const scaledDelta = event.deltaY * 0.001;
            const currentDistance = this.camera.position.distanceTo(this.controls.target);
            const factor = 1 - scaledDelta;
            const newDistance = THREE.MathUtils.clamp(
                currentDistance * factor,
                this.controls.minDistance,
                this.controls.maxDistance
            );

            const direction = this.camera.position.clone()
                .sub(this.controls.target)
                .normalize()
                .multiplyScalar(newDistance);

            this.camera.position.copy(this.controls.target).add(direction);
        }, { passive: false });

        // Сфера для отладки центра
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
        // Общий свет
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Основной направленный свет
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.radius = 4;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        // Дополнительный свет для подсветки теней
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
    }

    setupEnvironment() {
        // Сетка
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // Оси координат
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Плоскость стола
        const tableGeometry = new THREE.PlaneGeometry(20, 20);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.rotation.x = -Math.PI / 2;
        this.table.position.y = 0; // Стол на уровне Y=0
        this.table.receiveShadow = true;
        this.scene.add(this.table);
    }

    onWindowResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }
}
