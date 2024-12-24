import time
from typing import Optional, Tuple
import numpy as np

class IMUSimulator:
    def __init__(self, plate_id: int):
        self.plate_id = plate_id
        self.last_update = time.time()
        self.last_position: Optional[Tuple[float, float, float]] = None
        self.last_angles: Optional[Tuple[float, float, float]] = None
        
    def calculate_imu_data(self, position: Tuple[float, float, float], 
                          angles: Tuple[float, float, float]) -> dict:
        current_time = time.time()
        dt = current_time - self.last_update
        
        if self.last_position and dt > 0:
            dx = [(curr - prev) for curr, prev in zip(position, self.last_position)]
            accel = [2 * d / (dt * dt) for d in dx]
        else:
            accel = [0.0, 0.0, 9.81]
        if self.last_angles and dt > 0:
            dang = [(curr - prev) for curr, prev in zip(angles, self.last_angles)]
            gyro = [d / dt for d in dang]
        else:
            gyro = [0.0, 0.0, 0.0]
            
        yaw = angles[2]
        mag_x = np.cos(yaw)
        mag_y = np.sin(yaw)
        mag_z = 0.0
        
        self.last_position = position
        self.last_angles = angles
        self.last_update = current_time
        
        return {
            "plate_id": self.plate_id,
            "accel_x": float(accel[0]),
            "accel_y": float(accel[1]),
            "accel_z": float(accel[2]),
            "gyro_x": float(gyro[0]),
            "gyro_y": float(gyro[1]),
            "gyro_z": float(gyro[2]),
            "mag_x": float(mag_x),
            "mag_y": float(mag_y),
            "mag_z": float(mag_z),
            "timestamp": int(current_time * 1e6)
        }
