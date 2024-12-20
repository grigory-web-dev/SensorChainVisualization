from dataclasses import dataclass

@dataclass
class ServerConfig:
    # Server settings
    HOST: str = "localhost"
    PORT: int = 8000
    RELOAD: bool = True
    
    # IMU simulation parameters
    UPDATE_RATE: float = 100.0  # Hz
    UPDATE_INTERVAL: float = 1.0 / UPDATE_RATE
    
    # Visualization parameters
    NUM_PLATES: int = 5
    BASE_LENGTH: float = 100.0  # mm
    
    # Calibration settings
    RECALIBRATION_TIMEOUT: float = 30.0  # seconds until recalibration needed
    CALIBRATION_SAMPLES: int = 50  # number of samples needed for calibration
    MIN_CONFIDENCE: float = 0.2  # minimum confidence in position
    CONFIDENCE_DECAY: float = 0.01  # how fast confidence decreases per second
    
    # IMU noise parameters
    ACCEL_NOISE: float = 0.1  # m/s²
    GYRO_NOISE: float = 0.01  # rad/s
    
    # Debug options
    SAVE_RAW_DATA: bool = True
