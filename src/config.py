# src/config.py
from dataclasses import dataclass

@dataclass
class SimConfig:
    # Физические ограничения
    MAX_VERTICAL_ANGLE: float = 30.0  # максимальный угол отклонения от вертикали
    MIN_VERTICAL_ANGLE: float = -30.0  # минимальный угол отклонения от вертикали
    
    # Геометрические параметры
    BASE_LENGTH: float = 200.0  # высота платы в мм
    WIDTH_RATIO: float = 0.6    # для визуализации: отношение ширины к высоте
    THICKNESS_RATIO: float = 0.1 # для визуализации: отношение толщины к высоте
    
    # Параметры симуляции
    UPDATE_RATE: float = 1/1  # 60 FPS
    NUM_PLATES: int = 4        # Количество пластин

@dataclass
class ServerConfig:
    HOST: str = "localhost"
    PORT: int = 8000
    RELOAD: bool = True
