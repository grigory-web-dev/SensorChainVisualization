# src/simulation.py
import numpy as np
from datetime import datetime
from src.models import Plate, SystemState
from src.physics import is_valid_state, rotate_point
from src.config import SimConfig
from src.logger import server_logger

class PlatesSimulation:
    def __init__(self, config: SimConfig):
        self.config = config
        self.plates = []
        self.velocities = []
        self.initialize_plates()

    def get_plate_ends(self, plate):
        """Вычисляет координаты концов платы"""
        angle = plate.angles[0]
        half_length = plate.length / 2
        
        # Ближний конец (точка крепления к предыдущей плате)
        near_end = (
            plate.center[0],
            plate.center[1] - np.sin(angle) * half_length,
            plate.center[2] - np.cos(angle) * half_length
        )
        
        # Дальний конец (точка крепления следующей платы)
        far_end = (
            plate.center[0],
            plate.center[1] + np.sin(angle) * half_length,
            plate.center[2] + np.cos(angle) * half_length
        )
        
        return near_end, far_end

    def get_plate_center_from_hinge(self, hinge_point, angle, length):
        """Вычисляет центр платы по точке крепления"""
        half_length = length / 2
        return (
            0.0,  # x всегда 0
            hinge_point[1] + np.sin(angle) * half_length,  # y
            hinge_point[2] + np.cos(angle) * half_length   # z
        )

    def initialize_plates(self):
        self.plates = []
        self.velocities = []
        plate_length = self.config.BASE_LENGTH
        plate_width = self.config.BASE_LENGTH * self.config.WIDTH_RATIO

        # Первая плата - её точка крепления в (0,0,0)
        first_center = self.get_plate_center_from_hinge(
            (0.0, 0.0, 0.0),
            self.config.MIN_ANGLE,
            plate_length
        )
        
        first_plate = Plate(
            center=first_center,
            angles=(self.config.MIN_ANGLE, 0.0, 0.0),
            width=plate_width,
            length=plate_length,
            index=0
        )
        self.plates.append(first_plate)
        self.velocities.append(np.zeros(3))

        # Добавляем остальные платы
        for i in range(1, self.config.NUM_PLATES):
            prev_plate = self.plates[i-1]
            _, prev_far_end = self.get_plate_ends(prev_plate)
            
            # Центр новой платы относительно точки крепления
            new_center = self.get_plate_center_from_hinge(
                prev_far_end,  # Крепим к дальнему концу предыдущей
                self.config.MIN_ANGLE,
                plate_length
            )

            new_plate = Plate(
                center=new_center,
                angles=(self.config.MIN_ANGLE, 0.0, 0.0),
                width=plate_width,
                length=plate_length,
                index=i
            )
            self.plates.append(new_plate)
            self.velocities.append(np.zeros(3))

    def update_plate_positions(self):
        """Обновляет позиции всех плат, сохраняя точки крепления"""
        # Первая плата вращается вокруг (0,0,0)
        self.plates[0].center = self.get_plate_center_from_hinge(
            (0.0, 0.0, 0.0),
            self.plates[0].angles[0],
            self.plates[0].length
        )
        
        # Обновляем остальные платы
        for i in range(1, len(self.plates)):
            prev_plate = self.plates[i-1]
            curr_plate = self.plates[i]
            
            # Получаем точку крепления (дальний конец предыдущей платы)
            _, hinge_point = self.get_plate_ends(prev_plate)
            
            # Обновляем центр текущей платы
            curr_plate.center = self.get_plate_center_from_hinge(
                hinge_point,
                curr_plate.angles[0],
                curr_plate.length
            )

    def update(self):
        # Обновляем углы всех плат
        for i in range(len(self.plates)):
            acceleration = np.zeros(3)
            acceleration[0] = np.random.uniform(-self.config.ANGLE_STEP, self.config.ANGLE_STEP)
            
            self.velocities[i][0] *= self.config.DAMPING
            self.velocities[i][0] += acceleration[0]
            
            new_angle = np.clip(
                self.plates[i].angles[0] + self.velocities[i][0],
                self.config.MIN_ANGLE,
                self.config.MAX_ANGLE
            )
            
            self.plates[i].angles = (new_angle, 0.0, 0.0)

        # Обновляем позиции с учетом новых углов
        self.update_plate_positions()

        # Проверяем валидность
        if not is_valid_state(self.plates, self.config):
            server_logger.warning("Invalid state detected, reducing velocities")
            self.velocities = [v * 0.5 for v in self.velocities]
            self.update_plate_positions()

    def get_state(self) -> SystemState:
        return SystemState(
            timestamp=datetime.now(),
            plates=self.plates,
            plate_base_length=self.config.BASE_LENGTH,
            plate_width=self.config.BASE_LENGTH * self.config.WIDTH_RATIO
        )
        