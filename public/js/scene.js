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
        console.log('World center:', this.worldCenter);

        // Начальная позиция камеры относительно центра координат
        this.camera.position.set(
            this.worldCenter.x + 5,
            this.worldCenter.y + 5,
            5
        );
        console.log('Initial camera position:', this.camera.position);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
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
            console.log('Scaled delta:', scaledDelta);

            const currentDistance = this.camera.position.distanceTo(this.controls.target);
            console.log('Current distance before zoom:', currentDistance);

            // Плавное изменение расстояния
            const factor = 1 - scaledDelta;
            const newDistance = THREE.MathUtils.clamp(
                currentDistance * factor,
                this.controls.minDistance,
                this.controls.maxDistance
            );

            console.log('New distance after zoom:', newDistance);

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

        // Вывод начальной конфигурации controls
        console.log('Initial controls config:', {
            enableZoom: this.controls.enableZoom,
            minDistance: this.controls.minDistance,
            maxDistance: this.controls.maxDistance,
            zoomSpeed: this.controls.zoomSpeed,
            target: this.controls.target.clone()
        });

        // Custom wheel handler for debugging
        this.renderer.domElement.addEventListener('wheel', (event) => {
            console.log('Wheel event:', {
                deltaY: event.deltaY,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey
            });

            const currentDistance = this.camera.position.distanceTo(this.controls.target);
            console.log('Current distance to target:', currentDistance);
        });

        this.setupEnvironment();
        this.setupLights();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
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

        // Table
        const tableGeometry = new THREE.PlaneGeometry(10, 10);
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
        this.renderer.render(this.scene, this.camera);

        // Обновляем позицию отладочной сферы
        this.targetSphere.position.copy(this.controls.target);
    }

    add(object) {
        this.scene.add(object);
    }
}
