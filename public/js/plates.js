import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        // Основные параметры
        this.scene3D = scene3D;
        this.scene = scene3D.getMovableSystem();
        this.mainScene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.scaleForDisplay = 0.01;  // конвертация мм в метры
        this.debugMode = true;  // Включаем отладочный режим

        // Массивы для хранения объектов
        this.plates = [];
        this.debugObjects = {
            points: [],
            lines: [],
            axes: []  // Добавляем массив для осей координат
        };

        // Настройка эффектов
        this.setupEffects();
        this.clearScene();

        this.scene3D.render = () => {
            this.scene3D.renderer.render(this.mainScene, this.scene3D.camera);
            this.outlineEffect.render(this.mainScene, this.scene3D.camera);
        };
    }

    setupEffects() {
        this.outlineEffect = new OutlineEffect(this.scene3D.renderer, {
            defaultThickness: 0.002,
            defaultColor: new THREE.Color(0xff0000),
            defaultAlpha: 0.8,
            defaultKeepAlive: true
        });
    }

    // Создаем оси координат для отладки
    createDebugAxes(size = 0.5) {
        const axes = new THREE.Group();

        // X axis - красный
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(size, 0, 0)
        ]);
        const xAxis = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
        axes.add(xAxis);

        // Y axis - зеленый
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, size, 0)
        ]);
        const yAxis = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
        axes.add(yAxis);

        // Z axis - синий
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, size)
        ]);
        const zAxis = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({ color: 0x0000ff }));
        axes.add(zAxis);

        return axes;
    }

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

        // Поворачиваем на 90 градусов вокруг оси Y
        plate.rotation.set(0, Math.PI / 2, 0);

        // Добавляем метку с номером
        const label = this.createPlateLabel(plateData.plate_id + 1);
        label.position.set(width/2 + 0.1, height/2, 0);
        plate.add(label);

        // Добавляем оси координат для отладки
        if (this.debugMode) {
            const axes = this.createDebugAxes();
            plate.add(axes);
        }

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

    clearScene() {
        // Очищаем платы
        this.plates.forEach(plate => {
            this.scene.remove(plate);
            if (plate.geometry) plate.geometry.dispose();
            if (plate.material) plate.material.dispose();
            if (plate.userData.label) {
                if (plate.userData.label.material) {
                    plate.userData.label.material.dispose();
                }
            }
        });
        this.plates = [];

        // Очищаем отладочные объекты
        Object.values(this.debugObjects).forEach(objects => {
            objects.forEach(obj => {
                this.scene.remove(obj);
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            objects.length = 0;
        });
    }

    updatePlates(data) {
        console.log("Updating plates with data:", data);

        if (!data || !data.version || !data.plates) {
            console.warn("Invalid data format:", data);
            return;
        }

        if (data.version !== "1.0") {
            console.warn("Unsupported protocol version:", data.version);
            return;
        }

        // Очищаем отладочные объекты
        Object.values(this.debugObjects).forEach(objects => {
            objects.forEach(obj => this.scene.remove(obj));
            objects.length = 0;
        });

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
        
        // Отладочный вывод углов
        console.log(`Plate ${index + 1} angles:`, {
            raw: plateData.orientation,
            degrees: plateData.orientation.map(angle => (angle * 180 / Math.PI).toFixed(2) + '°')
        });

        // Создаем отладочные точки
        const pointMesh = this.createDebugPoint();
        pointMesh.position.set(...position);
        this.scene.add(pointMesh);
        this.debugObjects.points.push(pointMesh);

        // Обновляем позицию платы
        plate.position.set(...position);

        // Применяем ориентацию
        const euler = new THREE.Euler(
            plateData.orientation[0],  // roll
            plateData.orientation[1],  // pitch
            plateData.orientation[2],  // yaw
            'XYZ'
        );
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(euler);
        plate.quaternion.copy(quaternion);
    }

    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        const formatCoord = num => (num !== undefined ? num.toFixed(1).padStart(8) : "N/A");
        const formatAngle = num => (num !== undefined ? (num * 180 / Math.PI).toFixed(1).padStart(8) : "N/A");

        let html = `
            <div class="system-info">
                <div class="plate-info-row">
                    <span class="plate-info-label">Base Height:</span>
                    <span class="plate-info-value">${formatCoord(data.baseHeight)} mm</span>
                </div>
            </div>
        `;

        if (data.plates && Array.isArray(data.plates)) {
            html += data.plates.map((plate) => `
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
            `).join('');
        }

        panel.innerHTML = html;
    }
}