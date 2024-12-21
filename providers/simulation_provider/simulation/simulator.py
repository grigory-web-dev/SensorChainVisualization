import time
from datetime import datetime
import numpy as np
from typing import List
from common.models import SystemState, VisPlate, IMUData
from .physics import PhysicsSimulation
from server.logger import server_logger


class PlatesSimulation:
    def __init__(self):
        self.physics = PhysicsSimulation()
        self.time = 0.0
        self.frequency = 0.25  # Уменьшаем частоту колебаний для более плавного движения
        self.plate_base_height = 100.0  # Базовая высота в мм
        self.plate_height = 200.0       # Высота пластины в мм
        self.plate_spacing = 250.0      # Расстояние между пластинами по вертикали
        self.phase_shift = 2 * np.pi / 3  # Сдвиг фазы между пластинами
        self.amplitude = 50.0           # Амплитуда колебаний в мм
        
    def update(self, dt: float) -> SystemState:
        """
        Обновляет состояние симуляции
        """
        try:
            self.time += dt
            plates = []
            raw_data = []
            
            # Генерируем три пластины
            for i in range(3):
                # Фазовый сдвиг для каждой пластины
                phase = i * self.phase_shift
                # Высота увеличивается для каждой следующей пластины
                y = self.plate_base_height + i * self.plate_spacing  # Y теперь высота
                
                # Создаем колебательное движение с фазовым сдвигом
                x = self.amplitude * np.cos(self.time * self.frequency + phase)
                z = self.amplitude * np.sin(self.time * self.frequency + phase)  # Z для глубины
                
                # Углы наклона (в радианах)
                # Наклоны вперед-назад и влево-вправо
                roll = np.radians(5 * np.sin(self.time * self.frequency + phase))   # Наклон влево-вправо
                pitch = np.radians(5 * np.cos(self.time * self.frequency + phase))  # Наклон вперед-назад
                yaw = np.radians(10 * np.sin(self.time * self.frequency * 0.5))    # Поворот вокруг вертикальной оси
                
                # Создаем пластину с полными данными
                plate = VisPlate(
                    plate_id=i,
                    position=(x, y, z),  # x, y (высота), z (глубина)
                    orientation=(roll, pitch, yaw),
                    height=self.plate_height
                )
                plates.append(plate)
                
                # Вычисляем ускорения на основе движения
                accel_x = -x * self.frequency**2
                accel_y = 9.81  # Гравитация по Y
                accel_z = -z * self.frequency**2
                
                # Угловые скорости
                gyro_x = roll * self.frequency
                gyro_y = pitch * self.frequency
                gyro_z = yaw * self.frequency
                
                # Создаем IMU данные
                imu_data = IMUData(
                    plate_id=i,
                    position=plate.position,
                    orientation=plate.orientation,
                    accel_x=float(accel_x),
                    accel_y=float(accel_y),
                    accel_z=float(accel_z),
                    gyro_x=float(gyro_x),
                    gyro_y=float(gyro_y),
                    gyro_z=float(gyro_z),
                    timestamp=int(time.time() * 1e6)
                )
                raw_data.append(imu_data)
            
            return SystemState(
                timestamp=datetime.now(),
                plates=plates,
                plate_base_height=self.plate_base_height,
                raw_data=raw_data
            )
            
        except Exception as e:
            server_logger.error(f"Error in simulation update: {e}")
            return None
            
    def get_current_state(self) -> SystemState:
        """
        Получает текущее состояние симуляции
        """
        return self.update(1.0 / 100)  # 100 Hz обновление