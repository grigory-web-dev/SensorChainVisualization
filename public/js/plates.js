import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        // Основные параметры
        this.scene3D = scene3D;
        this.scene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.scaleForDisplay = 0.01;  // конвертация мм в метры

        // Массивы для хранения объектов
        this.plates = [];
        this.debugObjects = {
            points: [],
            lines: []
        };

        // Версии протокола, которые мы поддерживаем
        this.supportedVersions = ["1.0", "1.1"];

        // Настройка эффектов
        this.setupEffects();

        // Очистка и инициализация
        this.clearScene();
        this.initPlates();

        // Переопределяем рендер для поддержки эффектов
        this.scene3D.render = () => {
            this.scene3D.renderer.render(this.scene, this.scene3D.camera);
            this.outlineEffect.render(this.scene, this.scene3D.camera);
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

    // Управление 3D объектами
    createPlate(plateData) {
        const height = plateData.height * this.scaleForDisplay * 0.9;
        const width = height * 0.6;
        const thickness = height * 0.1;

        // Геометрия и материал
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

        // Добавляем метку
        const label = this.createPlateLabel(plateData.plate_id + 1);
        label.position.set(0, 0, -width * 0.7);
        plate.add(label);

        plate.userData = { label, plateData };
        return plate;
    }

    createPlateLabel(number) {
        // Создаем текстуру с номером
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
        console.log('Received update data:', JSON.stringify(data, null, 2));

        if (!this.supportedVersions.includes(data.version)) {
            console.warn("Unsupported protocol version:", data.version);
            return;
        }

        // Проверяем статус калибровки
        if (data.needs_recalibration) {
            console.log(`System needs recalibration. Age: ${data.calibration_age.toFixed(1)}s`);
        }

        // Если нет данных о платах, но есть сырые данные - система калибруется
        if (data.plates.length === 0 && data.raw_data) {
            console.log("System is calibrating...");
            this.updateInfoPanel(data);
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

        // Преобразуем координаты
        const position = plateData.position.map(x => x * this.scaleForDisplay);

        // Создаем отладочную визуализацию
        const pointMesh = this.createDebugPoint(
            plateData.position_confidence < 0.5 ? 0xff0000 : 0x00ff00
        );
        pointMesh.position.set(...position);
        this.scene.add(pointMesh);
        this.debugObjects.points.push(pointMesh);

        // Позиционируем плату
        plate.position.set(...position);

        // Применяем ориентацию
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(
            plateData.orientation[0],
            plateData.orientation[1],
            plateData.orientation[2],
            'XYZ'
        ));
        plate.quaternion.copy(quaternion);

        // Визуально отмечаем платы, требующие рекалибровки
        const plateColor = plateData.needs_recalibration ? 0xff4444 : 0x88ff44;
        plate.material.color.setHex(plateColor);
    }

    // Обновление UI
    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        let html = `
            <div class="system-info">
                <div>Base height: ${data.plate_base_height.toFixed(1)} mm</div>
                <div>Calibration age: ${data.calibration_age.toFixed(1)}s</div>
                <div class="status ${data.needs_recalibration ? 'warning' : ''}">
                    Status: ${data.needs_recalibration ? 'Needs Recalibration' : 'OK'}
                </div>
            </div>
        `;

        if (data.plates.length > 0) {
            html += data.plates.map((plate) => `
                <div class="plate-info ${plate.needs_recalibration ? 'warning' : ''}">
                    <div>Plate ${plate.plate_id + 1}:</div>
                    <div>Position: (${plate.position.map(v => v.toFixed(1)).join(', ')}) mm</div>
                    <div>Orientation: (${plate.orientation.map(v => (v * 180 / Math.PI).toFixed(1)).join(', ')})°</div>
                    <div>Confidence: ${(plate.position_confidence * 100).toFixed(1)}%</div>
                </div>
            `).join('');
        } else if (data.raw_data) {
            html += `
                <div class="calibration-info">
                    <div>System is calibrating...</div>
                    <div>Raw data from ${data.raw_data.length} sensors</div>
                </div>
            `;
        }

        panel.innerHTML = html;
    }

    initPlates() {
        // Plates will be initialized when first data arrives
        console.log('Waiting for initial data...');
    }
}
