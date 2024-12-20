// public/js/plates.js
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

export class PlatesManager {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.scene = scene3D.scene;
        this.worldCenter = scene3D.worldCenter;
        this.plates = [];
        this.debug = true;
        this.scaleForDisplay = 0.01; // Масштабный коэффициент для перевода мм в метры

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
    }

    createPlate(plateData) {
        if (this.debug) console.log('Creating plate with data:', plateData);

        // Преобразуем размеры из мм в метры
        const length = plateData.length * this.scaleForDisplay;
        const width = plateData.width * this.scaleForDisplay;
        const height = length * 0.1; // Толщина 10% от длины

        if (this.debug) console.log('Scaled dimensions:', { length, width, height });

        const geometry = new THREE.BoxGeometry(length, height, width);
        const material = new THREE.MeshStandardMaterial({
            color: 0x44ff44,
            metalness: 0.5,
            roughness: 0.2,
            side: THREE.DoubleSide
        });

        const plate = new THREE.Mesh(geometry, material);
        plate.castShadow = true;
        plate.receiveShadow = true;

        // Создаем метку
        const label = this.createPlateLabel(plateData.index + 1);
        label.position.set(0, height + 0.02, 0); // Располагаем метку над платой
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
        sprite.scale.set(0.4, 0.4, 0.4);
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

            // Преобразуем координаты из мм в метры
            const newPosition = {
                x: plateData.center[0] * this.scaleForDisplay,
                y: plateData.center[1] * this.scaleForDisplay,
                z: plateData.center[2] * this.scaleForDisplay
            };

            if (this.debug) {
                console.log(`Updating plate ${i}:`, {
                    rawCenter: plateData.center,
                    scaledPosition: newPosition,
                    angles: plateData.angles
                });
            }

            // Обновляем позицию и поворот
            plate.position.set(newPosition.x, newPosition.y, newPosition.z);
            plate.rotation.set(...plateData.angles);
        });

        this.updateInfoPanel(data);
    }

    updateInfoPanel(data) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="plate-dimensions">
                Base size: ${(data.plate_base_length).toFixed(1)}x${(data.plate_width).toFixed(1)} mm
            </div>
            ${data.plates.map((plate) => `
                <div class="plate-info">
                    Plate ${plate.index + 1}:<br>
                    Position: (${plate.center.map(v => v.toFixed(1)).join(', ')}) mm<br>
                    Angles: (${plate.angles.map(v => (v * 180 / Math.PI).toFixed(1)).join(', ')})°<br>
                    Length: ${plate.length.toFixed(1)} mm
                </div>
            `).join('')}
        `;
    }
}
