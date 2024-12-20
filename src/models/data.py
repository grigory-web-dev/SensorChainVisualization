from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict
from datetime import datetime

@dataclass
class IMUData:
    """Raw IMU sensor data"""
    plate_id: int  # Добавляем id платы
    
    # Accelerometer data in m/s²
    accel_x: float
    accel_y: float
    accel_z: float
    
    # Gyroscope data in rad/s
    gyro_x: float
    gyro_y: float
    gyro_z: float
    
    # Microseconds since epoch
    timestamp: int
    
    def to_dict(self) -> Dict:
        return {
            "plate_id": self.plate_id,
            "accel": {
                "x": float(self.accel_x),
                "y": float(self.accel_y),
                "z": float(self.accel_z)
            },
            "gyro": {
                "x": float(self.gyro_x),
                "y": float(self.gyro_y),
                "z": float(self.gyro_z)
            },
            "timestamp": self.timestamp
        }

@dataclass
class PlateCalibration:
    """Calibration data for a single plate"""
    plate_id: int
    reference_position: Tuple[float, float, float]  # положение при калибровке
    reference_orientation: Tuple[float, float, float]  # ориентация при калибровке
    calibration_time: datetime

@dataclass
class PlateState:
    """Current state of a single plate"""
    plate_id: int
    imu_data: IMUData
    relative_position: Tuple[float, float, float]  # смещение от калибровочного положения
    relative_orientation: Tuple[float, float, float]  # смещение углов от калибровки
    last_update: datetime
    accumulated_error: float  # оценка накопленной ошибки

@dataclass
class VisPlate:
    """Visualization data for a plate"""
    plate_id: int
    height: float
    position: Tuple[float, float, float]  # абсолютная позиция в пространстве
    orientation: Tuple[float, float, float]  # абсолютная ориентация
    position_confidence: float  # 0-1, точность позиции
    needs_recalibration: bool
    
    def to_dict(self):
        return {
            "plate_id": self.plate_id,
            "position": [float(x) for x in self.position],
            "orientation": [float(x) for x in self.orientation],
            "height": float(self.height),
            "position_confidence": float(self.position_confidence),
            "needs_recalibration": self.needs_recalibration
        }

@dataclass
class SystemState:
    """Complete system state"""
    timestamp: datetime
    plates: List[VisPlate]
    calibration_age: float  # время с последней калибровки
    needs_recalibration: bool
    plate_base_height: float
    raw_data: Optional[List[IMUData]] = None

    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "plates": [plate.to_dict() for plate in self.plates],
            "calibration_age": self.calibration_age,
            "needs_recalibration": self.needs_recalibration,
            "plate_base_height": float(self.plate_base_height),
            "raw_data": [data.to_dict() for data in self.raw_data] if self.raw_data else None,
            "version": "1.1"
        }
