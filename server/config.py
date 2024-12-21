from dataclasses import dataclass

@dataclass
class ServerConfig:
    # Server settings
    HOST: str = "localhost"
    PORT: int = 8000
    RELOAD: bool = True

    # Debug options
    SAVE_RAW_DATA: bool = True

    # Visualization parameters
    NUM_PLATES: int = 5
    BASE_LENGTH: float = 100.0  # mm

    # IMU simulation parameters
    UPDATE_RATE: float = 10.0  # Hz
    UPDATE_INTERVAL: float = 1.0 / UPDATE_RATE

    # IMU noise parameters
    ACCEL_NOISE: float = 0.1  # m/s²
    GYRO_NOISE: float = 0.01  # rad/s

