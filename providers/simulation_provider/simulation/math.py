# src/utils/math.py
import numpy as np
from typing import Tuple

def create_rotation_matrix(roll: float, pitch: float, yaw: float) -> np.ndarray:
    """Create 3D rotation matrix from Euler angles"""
    c1, s1 = np.cos(roll), np.sin(roll)
    c2, s2 = np.cos(pitch), np.sin(pitch)
    c3, s3 = np.cos(yaw), np.sin(yaw)
    
    return np.array([
        [c2*c3, -c2*s3, s2],
        [c1*s3 + c3*s1*s2, c1*c3 - s1*s2*s3, -c2*s1],
        [s1*s3 - c1*c3*s2, c3*s1 + c1*s2*s3, c1*c2]
    ])

def apply_rotation(point: np.ndarray, rotation_matrix: np.ndarray) -> np.ndarray:
    """Apply rotation matrix to a point"""
    return rotation_matrix @ point

def calculate_end_point(
    start_point: Tuple[float, float, float],
    height: float,
    rotation_matrix: np.ndarray
) -> Tuple[float, float, float]:
    """Calculate end point given start point, height and rotation"""
    direction = apply_rotation(np.array([0, height, 0]), rotation_matrix)
    end_point = np.array(start_point) + direction
    return tuple(float(x) for x in end_point)
