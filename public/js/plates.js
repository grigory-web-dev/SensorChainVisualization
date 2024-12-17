import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.scene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.plates = [];

        // Создаем эффект контура
        this.outlineEffect = new OutlineEffect(this.scene3D.renderer, {
            defaultThickness: 0.002,         // Немного уменьшим толщину
            defaultColor: new THREE.Color(0xff0000),  // Тёмно-серый цвет
            defaultAlpha: 0.8,               // Немного прозрачности
            defaultKeepAlive: true,
            blur: true,                      // Включаем размытие
            blurSize: 2,                     // Размер размытия
            edgeStrength: 2.0                // Сила эффекта
        });

        // console.log('Before initPlates');
        this.initPlates();
        // console.log('After initPlates, plates array:', this.plates);

        // Заменяем стандартный рендеринг на рендеринг с контуром
        this.scene3D.render = () => {
            this.outlineEffect.render(this.scene, this.scene3D.camera);
        };

    }
    initPlates() {
        for (let i = 0; i < 5; i++) {
            const plateGeometry = new THREE.BoxGeometry(2, 0.05, 1);

            // Создаем две разные текстуры для верхней и нижней грани
            const topCanvas = document.createElement('canvas');
            const bottomCanvas = document.createElement('canvas');
            [topCanvas, bottomCanvas].forEach(canvas => {
                canvas.width = 256;
                canvas.height = 128;
                const context = canvas.getContext('2d');

                // Очищаем канвас
                context.fillStyle = '#44ff44';
                context.fillRect(0, 0, canvas.width, canvas.height);

                // Сохраняем состояние контекста
                context.save();

                // Настраиваем текст
                context.fillStyle = 'black';
                context.font = 'bold 64px Arial';
                context.textAlign = 'center';
                context.textBaseline = 'middle';

                // Для верхней грани поворачиваем влево, для нижней - вправо
                if (canvas === topCanvas) {
                    context.translate(canvas.width / 2, canvas.height / 2);
                    context.rotate(-Math.PI / 2);
                    context.fillText((i + 1).toString(), 0, 0);
                } else {
                    context.translate(canvas.width / 2, canvas.height / 2);
                    context.rotate(-Math.PI / 2);
                    context.fillText((i + 1).toString(), 0, 0);
                }

                context.restore();
            });

            const topTexture = new THREE.CanvasTexture(topCanvas);
            const bottomTexture = new THREE.CanvasTexture(bottomCanvas);

            // Создаем материалы
            const materials = [
                // right
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444 }),
                // left
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444 }),
                // top
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444, map: topTexture }),
                // bottom
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444, map: bottomTexture }),
                // front
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444 }),
                // back
                new THREE.MeshPhongMaterial({ color: 0x44ff44, shininess: 50, specular: 0x444444 })
            ];

            const plate = new THREE.Mesh(plateGeometry, materials);
            plate.castShadow = true;
            plate.receiveShadow = true;

            // Добавляем контуры
            const edges = new THREE.EdgesGeometry(plateGeometry);
            const edgesMaterial = new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 1
            });
            const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
            plate.add(edgesMesh);

            plate.position.set(
                this.worldCenter.x,
                this.worldCenter.y + (i + 1) * 0.5,
                this.worldCenter.z
            );

            this.scene.add(plate);
            this.plates.push(plate);
        }
    }

    createPlateLabel(number) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.5, 0.5, 1);
        return label;
    }

    updatePlates(data) {
        data.plates.forEach((plateData, i) => {
            const plate = this.plates[i];
            // Добавляем смещение worldCenter к позициям из данных
            plate.position.set(
                plateData.center[0] + this.worldCenter.x,
                plateData.center[1] + this.worldCenter.y,
                plateData.center[2] + this.worldCenter.z
            );
            plate.rotation.set(...plateData.angles);
        });
        this.updateInfoPanel(data);
    }

    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        panel.innerHTML = `
            <div class="plate-dimensions">
                Plate size: ${(data.plate_length / 10).toFixed(1)}x${(data.plate_width / 10).toFixed(1)} cm
            </div>
            ${data.plates.map((plate, i) => `
                <div class="plate-info">
                    Plate ${i + 1}:<br>
                    Position: (${plate.center.map(v => (v).toFixed(1)).join(', ')}) mm<br>
                    Angles: (${plate.angles.map(v => (v * 180 / Math.PI).toFixed(1)).join(', ')})°
                </div>
            `).join('')}
        `;
    }
}
