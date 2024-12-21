import time
from typing import Optional, Tuple
from common.models import IMUData


class IMUSimulator:
    def __init__(self):
        self.last_update = time.time()
        
    def calculate_imu_data(self, position: Tuple[float, float, float], 
                          angles: Tuple[float, float, float]) -> IMUData:
        """
        Рассчитывает IMU данные на основе текущего положения и углов
        """
        current_time = time.time()
        dt = current_time - self.last_update
        self.last_update = current_time
        
        # В простой симуляции просто возвращаем текущие значения
        return IMUData(
            coordinates=position,
            angles=angles,
            timestamp=current_time
        )