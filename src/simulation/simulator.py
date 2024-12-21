from datetime import datetime
import numpy as np
from typing import List
from src.models.data import SystemState, VisPlate, IMUData
from src.simulation.imu import IMUSimulator
from src.config import ServerConfig
from src.logger import server_logger

class PlatesSimulation:
    def __init__(self, config: ServerConfig):
        self.config = config
        
        # Создаем независимые симуляторы для каждой платы
        self.imu_simulators = [
            IMUSimulator(i) for i in range(config.NUM_PLATES)
        ]
        server_logger.info(f"Created {len(self.imu_simulators)} IMU simulators")
        
    def update(self) -> SystemState:
        """Обновить состояние всей системы"""
        try:
            # Собираем данные со всех IMU
            raw_data = []
            current_plates = []
            
            for simulator in self.imu_simulators:
                imu_data = simulator.update()
                if imu_data is None:
                    continue
                    
                raw_data.append(imu_data)
                
                # Создаем данные для визуализации
                plate = VisPlate(
                    plate_id=imu_data.plate_id,
                    height=self.config.BASE_LENGTH,
                    position=imu_data.position,
                    orientation=imu_data.orientation
                )
                current_plates.append(plate)
            
            return SystemState(
                timestamp=datetime.now(),
                plates=current_plates,
                plate_base_height=float(self.config.BASE_LENGTH),
                raw_data=raw_data
            )
                
        except Exception as e:
            server_logger.error(f"Error in simulation update: {str(e)}")
            raise
