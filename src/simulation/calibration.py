from datetime import datetime
import numpy as np
from typing import List, Optional
from src.models.data import IMUData, PlateCalibration
from src.logger import server_logger

class PlateCalibrator:
    def __init__(self, plate_id: int):
        self.plate_id = plate_id
        self.calibration_data: Optional[PlateCalibration] = None
        self.samples_needed = 50  # количество сэмплов для калибровки
        self.current_samples: List[IMUData] = []
        self.calibration_timeout = 30.0  # секунды до необходимости рекалибровки
        
    def add_sample(self, imu_data: IMUData) -> bool:
        """Добавить данные IMU в калибровочные сэмплы"""
        self.current_samples.append(imu_data)
        return len(self.current_samples) >= self.samples_needed
        
    def compute_calibration(self) -> PlateCalibration:
        """Вычислить калибровочные данные из собранных сэмплов"""
        if len(self.current_samples) < self.samples_needed:
            raise ValueError("Not enough samples for calibration")
            
        # Усредняем показания акселерометра для определения вертикали
        mean_accel = np.mean([[s.accel_x, s.accel_y, s.accel_z] 
                             for s in self.current_samples], axis=0)
        
        # Нормализуем вектор гравитации
        gravity = mean_accel / np.linalg.norm(mean_accel)
        
        # Вычисляем начальную ориентацию
        pitch = np.arctan2(gravity[0], np.sqrt(gravity[1]**2 + gravity[2]**2))
        roll = np.arctan2(gravity[1], gravity[2])
        yaw = 0.0  # принимаем начальный yaw за 0
        
        self.calibration_data = PlateCalibration(
            plate_id=self.plate_id,
            reference_position=(0.0, 0.0, 0.0),  # начальная позиция
            reference_orientation=(roll, pitch, yaw),
            calibration_time=datetime.now()
        )
        
        self.current_samples.clear()
        return self.calibration_data
    
    def needs_recalibration(self) -> bool:
        """Проверить необходимость рекалибровки"""
        if not self.calibration_data:
            return True
            
        age = (datetime.now() - self.calibration_data.calibration_time).total_seconds()
        return age > self.calibration_timeout

class SystemCalibrator:
    def __init__(self, num_plates: int):
        self.plate_calibrators = [PlateCalibrator(i) for i in range(num_plates)]
        self.is_calibrating = False
        
    def start_calibration(self):
        """Начать процесс калибровки"""
        server_logger.info("Starting calibration of all plates")
        self.is_calibrating = True
        for cal in self.plate_calibrators:
            cal.current_samples.clear()
            
    def process_imu_data(self, plate_id: int, imu_data: IMUData) -> bool:
        """Обработать новые данные IMU во время калибровки"""
        if not self.is_calibrating:
            return False
            
        calibrator = self.plate_calibrators[plate_id]
        return calibrator.add_sample(imu_data)
        
    def finish_calibration(self) -> List[PlateCalibration]:
        """Завершить калибровку и получить данные"""
        if not self.is_calibrating:
            raise ValueError("Calibration not started")
            
        calibrations = [
            calibrator.compute_calibration()
            for calibrator in self.plate_calibrators
        ]
        
        self.is_calibrating = False
        server_logger.info("Calibration completed for all plates")
        return calibrations
