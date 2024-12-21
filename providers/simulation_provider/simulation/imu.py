import numpy as np
import time
from typing import Optional, Tuple
from src.models.data import IMUData

class IMUSimulator:
    def __init__(self, plate_id: int, update_rate_hz: float = 100.0):
        self.plate_id = plate_id
        self.update_interval = 1.0 / update_rate_hz
        self.last_update = time.time()
        
        # Текущее состояние
        self.position = np.array([0.0, plate_id * 100.0, 0.0])  # начальная позиция
        self.orientation = np.zeros(3)  # углы ориентации
        
        # Параметры движения
        self.base_frequency = 0.2  # частота колебаний
        self.phase = np.random.uniform(0, 2*np.pi)  # случайная фаза
        self.amplitude = np.array([15.0, 5.0, 10.0])  # амплитуды по осям (в градусах)
        
    def calculate_motion(self, t: float) -> Tuple[np.ndarray, np.ndarray]:
        """Рассчитать текущее движение"""
        # Основное синусоидальное движение для углов
        angles = np.array([
            self.amplitude[0] * np.sin(2*np.pi*self.base_frequency*t + self.phase),
            self.amplitude[1] * np.sin(2*np.pi*self.base_frequency*1.3*t + self.phase),
            self.amplitude[2] * np.sin(2*np.pi*self.base_frequency*0.7*t + self.phase)
        ])
        
        # Переводим углы в радианы
        angles_rad = np.radians(angles)
        
        # Вычисляем позицию как отклонение от базовой точки
        base_pos = np.array([0.0, self.plate_id * 100.0, 0.0])
        offset = np.array([
            10.0 * np.sin(2*np.pi*self.base_frequency*0.5*t + self.phase),
            5.0 * np.sin(2*np.pi*self.base_frequency*0.3*t),
            7.0 * np.sin(2*np.pi*self.base_frequency*0.7*t + self.phase)
        ])
        
        return base_pos + offset, angles_rad
        
    def update(self) -> Optional[IMUData]:
        now = time.time()
        dt = now - self.last_update
        
        if dt < self.update_interval:
            return None
            
        self.last_update = now
        
        # Получаем текущее положение и ориентацию
        self.position, self.orientation = self.calculate_motion(now)
        
        # Вычисляем производные для IMU данных
        velocity = np.array([
            np.cos(self.orientation[0]) * 0.1,
            np.sin(self.orientation[1]) * 0.1,
            np.sin(self.orientation[2]) * 0.1
        ])
        
        angular_velocity = np.array([
            np.cos(2*np.pi*self.base_frequency*now) * 0.1,
            np.sin(2*np.pi*self.base_frequency*now) * 0.1,
            np.sin(2*np.pi*self.base_frequency*now + np.pi/4) * 0.1
        ])
        
        return IMUData(
            plate_id=self.plate_id,
            position=tuple(self.position),
            orientation=tuple(self.orientation),
            accel_x=float(velocity[0]),
            accel_y=float(velocity[1]),
            accel_z=float(velocity[2]),
            gyro_x=float(angular_velocity[0]),
            gyro_y=float(angular_velocity[1]),
            gyro_z=float(angular_velocity[2]),
            timestamp=int(now * 1e6)
        )
