# src/config.py
from dataclasses import dataclass

@dataclass
class SimConfig:
    # Физические ограничения
    MIN_ANGLE: float = 0.087  # ~5 градусов
    MAX_ANGLE: float = 1.57   # ~90 градусов
    ANGLE_STEP: float = 0.02  # Максимальное изменение угла за шаг
    DAMPING: float = 0.95     # Коэффициент затухания
    
    # Геометрические параметры
    BASE_LENGTH: float = 200.0  # мм
    WIDTH_RATIO: float = 0.6    # Отношение ширины к длине
    THICKNESS_RATIO: float = 0.1 # Отношение толщины к длине
    
    # Параметры симуляции
    UPDATE_RATE: float = 1/60  # 60 FPS
    NUM_PLATES: int = 5        # Количество пластин

@dataclass
class ServerConfig:
    HOST: str = "localhost"
    PORT: int = 8000
    RELOAD: bool = True
