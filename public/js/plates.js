// public/js/plates.js
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.scene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.plates = [];
        this.debugObjects = {
            points: [],
            lines: []
        };
        this.debug = true;
        this.scaleForDisplay = 0.01;  // конвертация мм в метры

        console.log('World center:', this.worldCenter);

        this.outlineEffect = new OutlineEffect(this.scene3D.renderer, {
            defaultThickness: 0.002,
            defaultColor: new THREE.Color(0xff0000),
            defaultAlpha: 0.8,
            defaultKeepAlive: true,
            blur: true,
            blurSize: 2,
            edgeStrength: 2.0
        });

        this.clearScene();
        this.initPlates();

        this.scene3D.render = () => {
            this.scene3D.renderer.render(this.scene, this.scene3D.camera);
            this.outlineEffect.render(this.scene, this.scene3D.camera);
        };
    }

    clearScene() {
        if (this.debug) console.log('Clearing scene');

        this.plates.forEach(plate => {
            this.scene.remove(plate);
            if (plate.geometry) plate.geometry.dispose();
            if (plate.material) plate.material.dispose();
            if (plate.userData.label) {
                this.scene.remove(plate.userData.label);
                if (plate.userData.label.material) plate.userData.label.material.dispose();
            }
        });
        this.plates = [];

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

    createDebugPoint(color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(0.03);
        const material = new THREE.MeshBasicMaterial({ color: color });
        return new THREE.Mesh(geometry, material);
    }

    createDebugLine(start, end, color = 0xffff00) {
        const points = [
            new THREE.Vector3(...start),
            new THREE.Vector3(...end)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: color });
        return new THREE.Line(geometry, material);
    }

    createPlate(plateData) {
        if (this.debug) console.log('Creating plate with data:', plateData);

        // Преобразуем размеры из мм в метры
        //const height = plateData.height * this.scaleForDisplay;
        const height = plateData.height * this.scaleForDisplay * 0.9;
        const width = height * 0.6;
        const thickness = height * 0.1;

        // Создаем геометрию платы
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

        // Разворачиваем плату на 90 градусов вокруг оси X чтобы она стояла вертикально
        plate.rotation.x = Math.PI / 2;
        // Поворачиваем плату по Z чтобы она встала вертикально
        plate.rotation.z = Math.PI / 2;
        // Поворачиваем по Y чтобы развернуть её в правильном направлении
        plate.rotation.y = -Math.PI / 2;

        // Создаем метку
        const label = this.createPlateLabel(plateData.index + 1);
        //label.position.set(0, height / 2 + 0.05, 0);
        label.position.set(0, 0, - width * 0.7);  // перемещаем вперед на половину ширины + отступ
        plate.add(label);

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
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.3, 0.3, 0.3);
        return sprite;
    }

    initPlates() {
        if (this.debug) console.log('Plates will be initialized with first data from server');
    }

    updatePlates(data) {
        if (this.debug) {
            console.log('Received update data:', JSON.stringify(data, null, 2));
        }

        if (data.version !== "1.0") {
            console.warn("Unsupported protocol version:", data.version);
            return;
        }

        // Очищаем отладочные объекты
        this.debugObjects.points.forEach(point => this.scene.remove(point));
        this.debugObjects.lines.forEach(line => this.scene.remove(line));
        this.debugObjects.points = [];
        this.debugObjects.lines = [];

        // Создаем новые платы, если их ещё нет
        while (this.plates.length < data.plates.length) {
            const plate = this.createPlate(data.plates[this.plates.length]);
            this.scene.add(plate);
            this.plates.push(plate);
        }

        // Обновляем каждую плату
        data.plates.forEach((plateData, i) => {
            const plate = this.plates[i];
            if (!plate) return;

            // Преобразуем точки из мм в метры
            const start = Array.isArray(plateData.start_point)
                ? plateData.start_point.map(x => x * this.scaleForDisplay)
                : [0, 0, 0];
            const end = Array.isArray(plateData.end_point)
                ? plateData.end_point.map(x => x * this.scaleForDisplay)
                : [0, 0, 0];

            // Создаем отладочные точки
            const startPointMesh = this.createDebugPoint(0xff0000);
            startPointMesh.position.set(...start);
            this.scene.add(startPointMesh);
            this.debugObjects.points.push(startPointMesh);

            const endPointMesh = this.createDebugPoint(0x00ff00);
            endPointMesh.position.set(...end);
            this.scene.add(endPointMesh);
            this.debugObjects.points.push(endPointMesh);

            // Создаем линию между точками
            const line = this.createDebugLine(start, end);
            this.scene.add(line);
            this.debugObjects.lines.push(line);

            // Вычисляем центр платы
            const center = {
                x: (start[0] + end[0]) / 2,
                y: (start[1] + end[1]) / 2,
                z: (start[2] + end[2]) / 2
            };

            if (this.debug) {
                console.log(`Plate ${i}:`, {
                    start,
                    end,
                    center,
                    angles: plateData.angles
                });
            }

            // Обновляем позицию
            plate.position.set(center.x, center.y, center.z);

            // Применяем углы поворота от базовой вертикальной ориентации
            plate.rotation.set(
                plateData.angles[0], // вертикальная ориентация
                plateData.angles[1] + Math.PI / 2,
                plateData.angles[2]
            );
            /*
                        // ДОЛЖНО БЫТЬ:
                        plate.rotation.set(
                            plateData.angles[0],
                            -Math.PI / 2,  // базовый поворот по Y
                            Math.PI / 2    // базовый поворот по Z
                        );
            */
        });

        this.updateInfoPanel(data);
    }

    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="plate-dimensions">
                Base height: ${(data.plate_base_height).toFixed(1)} mm
            </div>
            ${data.plates.map((plate) => `
                <div class="plate-info">
                    Plate ${plate.index + 1}:<br>
                    Start: (${plate.start_point.map(v => v.toFixed(1)).join(', ')}) mm<br>
                    End: (${plate.end_point.map(v => v.toFixed(1)).join(', ')}) mm<br>
                    Angles: (${plate.angles.map(v => (v * 180 / Math.PI).toFixed(1)).join(', ')})°<br>
                    Height: ${plate.height.toFixed(1)} mm
                </div>
            `).join('')}
        `;
    }
}
