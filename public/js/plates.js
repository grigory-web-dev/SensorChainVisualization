import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.scene = scene3D.getMovableSystem();
        this.mainScene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.debugMode = true;

        // Масштаб: 1 единица сцены = 100 мм
        this.scaleForDisplay = 1 / 100;

        this.plates = [];
        this.debugObjects = {
            points: [],
            lines: [],
            axes: []
        };

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

    createDebugAxes(size = 0.5) {
        const axes = new THREE.Group();

        const createAxis = (start, end, color) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const material = new THREE.LineBasicMaterial({ color });
            return new THREE.Line(geometry, material);
        };

        axes.add(createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(size * 2, 0, 0),
            0xff0000
        ));

        axes.add(createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, size * 4, 0),
            0x00ff00
        ));

        axes.add(createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, size * 2),
            0x0000ff
        ));

        return axes;
    }

    createPlate(plateData) {
        // Получаем размеры из данных или используем значения по умолчанию
        const defaultDimensions = [5, 50, 30]; // thickness, height, width in mm
        const dimensions = (plateData.dimensions || defaultDimensions).map(d => d * this.scaleForDisplay);
        const [thickness, height, width] = dimensions;

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

        // Добавляем номер платы в текстуру и позиционируем его
        const label = this.createPlateLabel(plateData.plate_id + 1);
        label.position.set(0.1, height / 2 + 0.1, width / 2 + 0.1);
        plate.add(label);

        if (this.debugMode) {
            const axes = this.createDebugAxes();
            plate.add(axes);
        }

        plate.userData = {
            label,
            plateData
        };
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

    clearScene() {
        this.plates.forEach(plate => {
            this.scene.remove(plate);
            if (plate.geometry) plate.geometry.dispose();
            if (plate.material) plate.material.dispose();
            if (plate.userData.label && plate.userData.label.material) {
                plate.userData.label.material.dispose();
            }
        });
        this.plates = [];

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
        // Получаем данные из сервера и обрабатываем их
        if (!data || !data.version || !data.plates) {
            console.warn("Invalid data format:", data);
            return;
        }

        console.log("Raw data from server:", {
            plates: data.plates.map(plate => ({
                id: plate.plate_id,
                position: [...plate.position],
                orientation: [...plate.orientation],
                dimensions: plate.dimensions ? [...plate.dimensions] : null
            }))
        });

        // Очищаем предыдущие отладочные объекты и создание новых
        Object.values(this.debugObjects).forEach(objects => {
            objects.forEach(obj => this.scene.remove(obj));
            objects.length = 0;
        });

        // Создаем новые объекты и добавляем их к сцене
        while (this.plates.length < data.plates.length) {
            const plate = this.createPlate(data.plates[this.plates.length]);
            this.scene.add(plate);
            this.plates.push(plate);
        }

        // Обновляем все объекты
        data.plates.forEach((plateData, i) => {
            this.updateSinglePlate(plateData, i);
        });

        // Обновляем информационную панель
        this.updateInfoPanel(data);
    }

    updateSinglePlate(plateData, index) {
        const plate = this.plates[index];
        if (!plate) return;

        // Преобразуем координаты в единицы сцены и обеспечиваем положительные значения
        const scaledPosition = plateData.position.map(coord => Math.max(0, coord * this.scaleForDisplay));
        plate.position.set(...scaledPosition);

        // Создаем отладочные точки
        const pointMesh = this.createDebugPoint();
        pointMesh.position.copy(plate.position);
        this.scene.add(pointMesh);
        this.debugObjects.points.push(pointMesh);

        // Применяем углы поворота
        const euler = new THREE.Euler(...plateData.orientation, 'XYZ');
        plate.setRotationFromEuler(euler);
    }

    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        // Форматируем значения, обеспечивая положительные значения
        const formatCoord = num => Math.max(0, num).toFixed(1).padStart(8) + ' мм';
        const formatAngle = rad => (rad * 180 / Math.PI).toFixed(1).padStart(8) + '°';
        const formatDimension = num => num ? num.toFixed(1).padStart(8) + ' мм' : 'N/A';

        let html = `
            <div class="system-info">
                <div class="coordinates-info">
                    <div class="axis-info">
                        <span class="axis-label">X:</span> красный (поперечное)
                    </div>
                    <div class="axis-info">
                        <span class="axis-label">Y:</span> зеленый (высота)
                    </div>
                    <div class="axis-info">
                        <span class="axis-label">Z:</span> синий (продольное)
                    </div>
                </div>
                <div class="scale-info">
                    Размеры в мм (от 0 до 1000)
                </div>
            </div>
        `;

        if (data.plates && Array.isArray(data.plates)) {
            html += data.plates.map((plate, index) => `
                <div class="plate-info">
                    <div class="plate-info-title">Plate ${plate.plate_id + 1}</div>
                    <div class="plate-info-row">
                        <span class="plate-info-label">Position:</span>
                        <span class="plate-info-value">
                            X: ${formatCoord(plate.position[0])}<br>
                            Y: ${formatCoord(plate.position[1])}<br>
                            Z: ${formatCoord(plate.position[2])}
                        </span>
                    </div>
                    <div class="plate-info-row">
                        <span class="plate-info-label">Angles:</span>
                        <span class="plate-info-value">
                            Roll (X): ${formatAngle(plate.orientation[0])}<br>
                            Pitch (Y): ${formatAngle(plate.orientation[1])}<br>
                            Yaw (Z): ${formatAngle(plate.orientation[2])}
                        </span>
                    </div>
                    ${plate.dimensions ? `
                    <div class="plate-info-row">
                        <span class="plate-info-label">Dimensions:</span>
                        <span class="plate-info-value">
                            Length: ${formatDimension(plate.dimensions[0])}<br>
                            Width: ${formatDimension(plate.dimensions[1])}<br>
                            Height: ${formatDimension(plate.dimensions[2])}
                        </span>
                    </div>
                    ` : ''}
                </div>
            `).join('');
        }

        panel.innerHTML = html;
    }
}
