# src/simulation.py
import numpy as np
from datetime import datetime
from src.models import SimPlate, VisPlate, SystemState
from src.physics import is_valid_state
from src.config import SimConfig
from src.logger import server_logger

class PlatesSimulation:
    def __init__(self, config: SimConfig):
        self.config = config
        self.sim_plates = []  # для физических расчетов
        self.vis_plates = []  # для визуализации
        self.initialize_plates()

    def initialize_plates(self):
        """Инициализация цепочки плат"""
        self.sim_plates = []
        self.vis_plates = []
        height = float(self.config.BASE_LENGTH)  # высота в мм
        
        # Первая плата начинается в начале координат
        for i in range(self.config.NUM_PLATES):
            if i == 0:
                # Первая плата
                start_point = (0.0, 0.0, 0.0)
                rotation_angle = 0.0
                vertical_angle = 0.0  # изначально вертикально
            else:
                # Последующие платы начинаются от конца предыдущей
                start_point = self.sim_plates[i-1].end_point
                rotation_angle = self.sim_plates[i-1].rotation_angle
                vertical_angle = 0.0  # изначально вертикально

            # Вычисляем end_point как смещение вверх на height
            end_point = (
                start_point[0],
                start_point[1] + height,
                start_point[2]
            )

            angles = (0.0, 0.0, 0.0)  # начальные углы

            # Создаем плату для симуляции
            sim_plate = SimPlate(
                height=height,
                rotation_angle=rotation_angle,
                vertical_angle=vertical_angle,
                start_point=start_point,
                end_point=end_point,
                index=i
            )
            self.sim_plates.append(sim_plate)

            # Создаем плату для визуализации
            vis_plate = VisPlate(
                height=height,
                start_point=start_point,
                end_point=end_point,
                angles=angles,
                index=i
            )
            self.vis_plates.append(vis_plate)

            server_logger.debug(f"Initialized plate {i}:")
            server_logger.debug(f"  start: {start_point}")
            server_logger.debug(f"  end: {end_point}")
            server_logger.debug(f"  angles: {angles}")

    def update(self):
        """Обновление состояния всей цепочки"""
        for i in range(len(self.sim_plates)):
            if i == 0:
                # Первая плата только наклоняется вперед/назад
                vertical_angle = np.random.uniform(-15, 15)  # отклонение от вертикали
                current_plate = self.sim_plates[i]
                
                # Вычисляем новую конечную точку
                angle_rad = np.radians(vertical_angle)
                end_point = (
                    current_plate.start_point[0],
                    current_plate.start_point[1] + current_plate.height * np.cos(angle_rad),
                    current_plate.start_point[2] + current_plate.height * np.sin(angle_rad)
                )
                
                # Обновляем данные
                current_plate.end_point = end_point
                current_plate.vertical_angle = vertical_angle
                
                # Обновляем визуализацию
                self.vis_plates[i].end_point = end_point
                self.vis_plates[i].angles = (np.radians(vertical_angle), 0.0, 0.0)
                
            else:
                # Остальные платы крепятся к концу предыдущей
                prev_plate = self.sim_plates[i-1]
                current_plate = self.sim_plates[i]
                
                # Наследуем точку крепления от предыдущей платы
                current_plate.start_point = prev_plate.end_point
                
                # Случайный наклон
                vertical_angle = np.random.uniform(-15, 15)
                angle_rad = np.radians(vertical_angle)
                
                # Вычисляем новую конечную точку
                end_point = (
                    current_plate.start_point[0],
                    current_plate.start_point[1] + current_plate.height * np.cos(angle_rad),
                    current_plate.start_point[2] + current_plate.height * np.sin(angle_rad)
                )
                
                # Обновляем данные
                current_plate.end_point = end_point
                current_plate.vertical_angle = vertical_angle
                
                # Обновляем визуализацию
                self.vis_plates[i].start_point = current_plate.start_point
                self.vis_plates[i].end_point = end_point
                self.vis_plates[i].angles = (np.radians(vertical_angle), 0.0, 0.0)

            server_logger.debug(f"Updated plate {i}:")
            server_logger.debug(f"  start: {self.vis_plates[i].start_point}")
            server_logger.debug(f"  end: {self.vis_plates[i].end_point}")
            server_logger.debug(f"  angles: {self.vis_plates[i].angles}")

    def get_state(self) -> SystemState:
        """Возвращает текущее состояние для визуализации"""
        server_logger.debug("Sending state:")
        server_logger.debug(f"Number of plates: {len(self.vis_plates)}")
        
        for i, plate in enumerate(self.vis_plates):
            server_logger.debug(f"Plate {i}: start={plate.start_point}, end={plate.end_point}")
            
        return SystemState(
            timestamp=datetime.now(),
            plates=self.vis_plates,
            plate_base_height=float(self.config.BASE_LENGTH)
        )
