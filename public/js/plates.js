import * as THREE from 'three';

export class PlatesManager {
    constructor(scene3D) {  // Изменяем параметр на scene3D
        this.scene3D = scene3D;  // Сохраняем ссылку на весь объект Scene3D
        this.scene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;  // Получаем центр координат
        this.plates = [];
        this.initPlates();
    }

    initPlates() {
        for (let i = 0; i < 5; i++) {
            const plateGeometry = new THREE.BoxGeometry(2, 0.05, 1);
            const plateMaterial = new THREE.MeshStandardMaterial({
                color: 0x44ff44,
                metalness: 0.5,
                roughness: 0.5
            });
            const plate = new THREE.Mesh(plateGeometry, plateMaterial);
            plate.castShadow = true;
            plate.receiveShadow = true;

            // Устанавливаем начальную позицию относительно центра координат
            plate.position.set(
                this.worldCenter.x,
                this.worldCenter.y + (i + 1) * 0.5,  // Располагаем пластины друг над другом
                this.worldCenter.z
            );

            // Add plate number
            const label = this.createPlateLabel(i + 1);
            plate.add(label);

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
