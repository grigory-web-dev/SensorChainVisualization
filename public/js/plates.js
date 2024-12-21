import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        // Основные параметры
        this.scene3D = scene3D;
        this.scene = scene3D.getMovableSystem(); // Для добавления перемещаемых объектов
        this.mainScene = scene3D.scene;          // Для эффектов и рендера
        this.worldCenter = scene3D.worldCenter;
        this.scaleForDisplay = 0.01;  // конвертация мм в метры

        // Массивы для хранения объектов
        this.plates = [];
        this.debugObjects = {
            points: [],
            lines: []
        };

        // Настройка эффектов
        this.setupEffects();

        // Очистка и инициализация
        this.clearScene();

        // Переопределяем рендер для поддержки эффектов
        this.scene3D.render = () => {
            this.scene3D.renderer.render(this.mainScene, this.scene3D.camera);  // Рендерим всю сцену
            this.outlineEffect.render(this.mainScene, this.scene3D.camera);     // Эффекты тоже для всей сцены
        };
    }

    // Настройка визуальных эффектов
    setupEffects() {
        this.outlineEffect = new OutlineEffect(this.scene3D.renderer, {
            defaultThickness: 0.002,
            defaultColor: new THREE.Color(0xff0000),
            defaultAlpha: 0.8,
            defaultKeepAlive: true,
            blur: true,
            blurSize: 2,
            edgeStrength: 2.0
        });
    }

    // Создание 3D объектов
    createPlate(plateData) {
        const height = plateData.height * this.scaleForDisplay * 0.9;
        const width = height * 0.6;
        const thickness = height * 0.1;

        // Геометрия и материал платы
        const geometry = new THREE.BoxGeometry(thickness, height, width);
        const material = new THREE.MeshStandardMaterial({
            color: 0x88ff44,
            metalness: 0.5,
            roughness: 0.2,
            side: THREE.DoubleSide
        });

        const plate = new THREE.Mesh(geometry, material);
        plate.castShadow = true;
        plate.receiveShadow = true;

        // Базовая ориентация
        plate.rotation.set(
            Math.PI / 2,  // X - вертикальная ориентация
            -Math.PI / 2, // Y - направление
            Math.PI / 2   // Z - поворот для правильной ориентации
        );

        // Добавляем метку с номером
        const label = this.createPlateLabel(plateData.plate_id + 1);
        label.position.set(0, 0, -width * 0.7);
        plate.add(label);

        plate.userData = { label, plateData };
        return plate;
    }

    createPlateLabel(number) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: texture })
        );
        sprite.scale.set(0.3, 0.3, 0.3);

        return sprite;
    }

    // Отладочная визуализация
    createDebugPoint(color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(0.03);
        const material = new THREE.MeshBasicMaterial({ color });
        return new THREE.Mesh(geometry, material);
    }

    createDebugLine(start, end, color = 0xffff00) {
        const points = [
            new THREE.Vector3(...start),
            new THREE.Vector3(...end)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color });
        return new THREE.Line(geometry, material);
    }

    // Управление сценой
    clearScene() {
        // Очищаем платы
        this.plates.forEach(plate => {
            this.scene.remove(plate);
            if (plate.geometry) plate.geometry.dispose();
            if (plate.material) plate.material.dispose();
            if (plate.userData.label) {
                this.scene.remove(plate.userData.label);
                if (plate.userData.label.material) {
                    plate.userData.label.material.dispose();
                }
            }
        });
        this.plates = [];

        // Очищаем отладочные объекты
        this.debugObjects.points.forEach(point => {
            this.scene.remove(point);
            point.geometry.dispose();
            point.material.dispose();
        });
        this.debugObjects.points = [];

        this.debugObjects.lines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.debugObjects.lines = [];
    }

    // Обновление состояния
    updatePlates(data) {
        // Проверяем версию протокола
        if (data.version !== "1.0") {
            console.warn("Unsupported protocol version:", data.version);
            return;
        }

        // Очищаем отладочные объекты
        this.debugObjects.points.forEach(point => this.scene.remove(point));
        this.debugObjects.lines.forEach(line => this.scene.remove(line));
        this.debugObjects.points = [];
        this.debugObjects.lines = [];

        // Создаем недостающие платы
        while (this.plates.length < data.plates.length) {
            const plate = this.createPlate(data.plates[this.plates.length]);
            this.scene.add(plate);
            this.plates.push(plate);
        }

        // Обновляем каждую плату
        data.plates.forEach((plateData, i) => {
            this.updateSinglePlate(plateData, i);
        });

        this.updateInfoPanel(data);
    }

    updateSinglePlate(plateData, index) {
        const plate = this.plates[index];
        if (!plate) return;

        // Преобразуем координаты из мм в метры
        const position = plateData.position.map(x => x * this.scaleForDisplay);

        // Создаем отладочные точки
        const pointMesh = this.createDebugPoint();
        pointMesh.position.set(...position);
        this.scene.add(pointMesh);
        this.debugObjects.points.push(pointMesh);

        // Обновляем позицию платы
        plate.position.set(...position);

        // Применяем новую ориентацию
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(
            plateData.orientation[0],
            plateData.orientation[1],
            plateData.orientation[2],
            'XYZ'
        ));
        plate.quaternion.copy(quaternion);
    }

    // Обновление информационной панели
    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        const formatCoord = num => num.toFixed(1).padStart(8);  // Фиксированная ширина для чисел
        const formatAngle = num => (num * 180 / Math.PI).toFixed(1).padStart(8);

        let html = `
            <div class="system-info">
                <div class="plate-info-row">
                    <span class="plate-info-label">Base Height:</span>
                    <span class="plate-info-value">${formatCoord(data.plate_base_height)} mm</span>
                </div>
            </div>
            ${data.plates.map((plate) => `
                <div class="plate-info">
                    <div class="plate-info-title">Plate ${plate.plate_id + 1}</div>
                    <div class="plate-info-row">
                        <span class="plate-info-label">Position:</span>
                        <span class="plate-info-value">(${plate.position.map(formatCoord).join(', ')})</span>
                    </div>
                    <div class="plate-info-row">
                        <span class="plate-info-label">Angles:</span>
                        <span class="plate-info-value">(${plate.orientation.map(formatAngle).join(', ')})</span>
                    </div>
                </div>
            `).join('')}
        `;

        panel.innerHTML = html;
    }
}
