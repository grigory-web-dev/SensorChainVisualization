# src/models.py
from dataclasses import dataclass
from typing import List, Tuple
from datetime import datetime

@dataclass
class SimPlate:
    """Plate model for physical simulation"""
    height: float
    rotation_angle: float  # horizontal rotation
    vertical_angle: float  # vertical tilt from vertical line
    start_point: Tuple[float, float, float]
    end_point: Tuple[float, float, float]
    index: int

@dataclass
class VisPlate:
    """Plate model for visualization"""
    height: float
    start_point: Tuple[float, float, float]
    end_point: Tuple[float, float, float]
    angles: Tuple[float, float, float]
    index: int

    def to_dict(self):
        return {
            "start_point": [float(x) for x in self.start_point],
            "end_point": [float(x) for x in self.end_point],
            "angles": [float(x) for x in self.angles],
            "height": float(self.height),
            "index": self.index
        }

@dataclass
class SystemState:
    timestamp: datetime
    plates: List[VisPlate]
    plate_base_height: float

    def to_dict(self):
        if not isinstance(self.timestamp, datetime):
            raise TypeError(f"Incorrect timestamp type: {type(self.timestamp)}. Expected datetime.")
        return {
            "timestamp": self.timestamp.isoformat(),
            "plates": [plate.to_dict() for plate in self.plates],
            "plate_base_height": float(self.plate_base_height),
            "version": "1.0"
        }
