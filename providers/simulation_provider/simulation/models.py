from dataclasses import dataclass
from typing import Tuple

@dataclass
class SimPlate:
    """Модель пластины для симуляции"""
    start_point: Tuple[float, float, float]  # Начальная точка
    end_point: Tuple[float, float, float]    # Конечная точка
    mass: float                              # Масса пластины
    vertical_angle: float                    # Угол относительно вертикали