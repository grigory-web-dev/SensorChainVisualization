import numpy as np
import time
from typing import Optional, Tuple
from src.models.data import IMUData

class IMUSimulator:
    def __init__(self, plate_id: int, update_rate_hz: float = 100.0):
        self.plate_id = plate_id
        self.update_interval = 1.0 / update_rate_hz
        self.last_update = time.time()
        
        # Состояние
        self.angles = np.zeros(3)  # текущие углы
        self.angular_velocity = np.zeros(3)  # угловая скорость
        self.acceleration = np.zeros(3)  # текущее ускорение
        
        # Параметры движения
        self.base_frequency = 0.2  # частота основных колебаний
        self.phase = np.random.uniform(0, 2*np.pi)  # случайная фаза для каждой платы
        
        # Физические параметры
        self.mass = 1.0
        self.damping = 0.98
        self.max_angle = np.radians(30)
        
        # Параметры шума
        self.accel_noise = 0.1
        self.gyro_noise = 0.01
        
    def get_random_motion(self, t: float) -> Tuple[np.ndarray, np.ndarray]:
        """Генерирует случайное движение для тестирования"""
        # Основное синусоидальное движение
        base_motion = np.array([
            np.sin(2*np.pi*self.base_frequency*t + self.phase),
            np.cos(2*np.pi*self.base_frequency*t + self.phase),
            np.sin(2*np.pi*self.base_frequency*t + self.phase + np.pi/4)
        ])
        
        # Добавляем случайные возмущения
        noise = np.random.normal(0, 0.1, 3)
        
        return base_motion * 0.2, noise
        
    def update(self) -> Optional[IMUData]:
        now = time.time()
        dt = now - self.last_update
        
        if dt < self.update_interval:
            return None
            
        self.last_update = now
        
        # Генерируем движение
        motion, noise = self.get_random_motion(now)
        
        # Обновляем состояние
        self.acceleration = motion + noise
        self.angular_velocity = self.angular_velocity * self.damping + self.acceleration * dt
        self.angles += self.angular_velocity * dt
        
        # Ограничиваем углы
        np.clip(self.angles, -self.max_angle, self.max_angle, out=self.angles)
        
        # Добавляем шум к измерениям
        accel_with_noise = self.acceleration + np.random.normal(0, self.accel_noise, 3)
        gyro_with_noise = self.angular_velocity + np.random.normal(0, self.gyro_noise, 3)
        
        return IMUData(
            plate_id=self.plate_id,  # Добавляем id платы
            accel_x=float(accel_with_noise[0]),
            accel_y=float(accel_with_noise[1]),
            accel_z=float(accel_with_noise[2]),
            gyro_x=float(gyro_with_noise[0]),
            gyro_y=float(gyro_with_noise[1]),
            gyro_z=float(gyro_with_noise[2]),
            timestamp=int(now * 1e6)
        )
