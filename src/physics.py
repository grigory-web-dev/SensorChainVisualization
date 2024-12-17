# physics.py
import numpy as np
from typing import List, Tuple
from src.config import SimConfig
from src.models import Plate

def rotate_point(point: Tuple[float, float, float], 
                angles: Tuple[float, float, float]) -> Tuple[float, float, float]:
    """Поворот точки вокруг начала координат"""
    x, y, z = point
    rx, ry, rz = angles
    
    # Rotation matrices
    Rx = np.array([
        [1, 0, 0],
        [0, np.cos(rx), -np.sin(rx)],
        [0, np.sin(rx), np.cos(rx)]
    ])
    
    Ry = np.array([
        [np.cos(ry), 0, np.sin(ry)],
        [0, 1, 0],
        [-np.sin(ry), 0, np.cos(ry)]
    ])
    
    Rz = np.array([
        [np.cos(rz), -np.sin(rz), 0],
        [np.sin(rz), np.cos(rz), 0],
        [0, 0, 1]
    ])
    
    point = np.array([x, y, z])
    return tuple(Rz @ Ry @ Rx @ point)

def get_plate_corners(plate: Plate) -> List[Tuple[float, float, float]]:
    """Получение координат углов пластины"""
    w2 = plate.width / 2
    l2 = plate.length / 2
    
    # Base corners relative to center
    corners = [
        (-w2, 0, -l2),
        (w2, 0, -l2),
        (w2, 0, l2),
        (-w2, 0, l2)
    ]
    
    # Rotate corners
    rotated = [rotate_point(c, plate.angles) for c in corners]
    
    # Translate to plate position
    return [(x + plate.center[0], 
            y + plate.center[1], 
            z + plate.center[2]) for x, y, z in rotated]

def check_plate_collision(plate1: Plate, plate2: Plate) -> bool:
    """Проверка столкновения двух пластин"""
    # Get corners of both plates
    corners1 = get_plate_corners(plate1)
    corners2 = get_plate_corners(plate2)
    
    # Separating Axis Theorem (SAT) implementation
    # This is a simplified version - in real implementation 
    # we need to check all possible axes
    
    # Check if any point of plate2 is below plate1
    normal1 = np.array([0, 1, 0])  # Simplified - using up vector
    normal1 = rotate_point(normal1, plate1.angles)
    
    center_diff = np.array(plate2.center) - np.array(plate1.center)
    if abs(np.dot(center_diff, normal1)) < (plate1.width + plate2.width) * 0.5:
        return True
        
    return False

def check_table_collision(plate: Plate) -> bool:
    """Проверка столкновения пластины со столом"""
    corners = get_plate_corners(plate)
    return any(z < 0 for x, y, z in corners)

def is_valid_state(plates: List[Plate], config: SimConfig) -> bool:
    """Проверка валидности состояния системы"""
    # Check collisions with table
    if any(check_table_collision(plate) for plate in plates):
        return False
    
    # Check minimum angles
    for plate in plates:
        if any(abs(angle) < config.MIN_ANGLE for angle in plate.angles):
            return False
            
    # Check collisions between plates
    for i in range(len(plates)):
        for j in range(i + 1, len(plates)):
            if check_plate_collision(plates[i], plates[j]):
                return False
    
    return True
