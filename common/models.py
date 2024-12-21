from dataclasses import dataclass
from typing import List, Tuple, Optional
from datetime import datetime

@dataclass
class IMUData:
    """Raw IMU sensor data"""
    plate_id: int
    position: Tuple[float, float, float]  # текущая позиция в пространстве
    orientation: Tuple[float, float, float]  # текущие углы ориентации
    
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
    
    def to_dict(self):
        return {
            "plate_id": self.plate_id,
            "position": [float(x) for x in self.position],
            "orientation": [float(x) for x in self.orientation],
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
class VisPlate:
    """Visualization data for a plate"""
    plate_id: int
    height: float
    position: Tuple[float, float, float]
    orientation: Tuple[float, float, float]
    
    def to_dict(self):
        return {
            "plate_id": self.plate_id,
            "position": [float(x) for x in self.position],
            "orientation": [float(x) for x in self.orientation],
            "height": float(self.height)
        }

@dataclass
class SystemState:
    """Complete system state"""
    timestamp: datetime
    plates: List[VisPlate]
    plate_base_height: float
    raw_data: Optional[List[IMUData]] = None

    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "plates": [plate.to_dict() for plate in self.plates],
            "plate_base_height": float(self.plate_base_height),
            "raw_data": [data.to_dict() for data in self.raw_data] if self.raw_data else None,
            "version": "1.0"
        }