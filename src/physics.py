import numpy as np
from typing import List, Tuple
from src.config import SimConfig

def calculate_positions(angles: List[float], config: SimConfig) -> List[Tuple[float, float]]:
    """Вычисление позиций пластин на основе абсолютных углов"""
    positions = [(0.0, 0.0)]
    
    for angle in angles:
        prev_x, prev_y = positions[-1]
        new_x = prev_x + config.PLATE_LENGTH * np.cos(angle)
        new_y = prev_y + config.PLATE_LENGTH * np.sin(angle)
        positions.append((new_x, new_y))
        
    return positions

def is_valid_state(positions: List[Tuple[float, float]], angles: List[float], config: SimConfig) -> bool:
    """Проверка валидности состояния системы"""
    # Проверка минимального угла от стола
    if any(angle < config.MIN_ANGLE for angle in angles):
        return False
        
    # Проверка максимального угла от стола
    if any(angle > config.MAX_ANGLE for angle in angles):
        return False
        
    # Проверка на пересечение с полом
    if any(y < config.TABLE_Y for x, y in positions):
        return False
        
    # Проверка на пересечение пластин
    for i in range(len(positions) - 1):
        for j in range(i + 2, len(positions)):
            dx = positions[j][0] - positions[i][0]
            dy = positions[j][1] - positions[i][1]
            distance = np.sqrt(dx*dx + dy*dy)
            if distance < config.MIN_DISTANCE:
                return False
    
    return True
