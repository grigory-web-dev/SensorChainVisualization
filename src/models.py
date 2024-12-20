# src/models.py
from dataclasses import dataclass
from typing import List, Tuple
from datetime import datetime

@dataclass
class Plate:
    center: Tuple[float, float, float]  # x, y, z coordinates
    angles: Tuple[float, float, float]  # rotation around x, y, z axes
    width: float
    length: float
    index: int

    def to_dict(self):
        return {
            "center": [float(x) for x in self.center],
            "angles": [float(x) for x in self.angles],
            "width": float(self.width),
            "length": float(self.length),
            "index": self.index
        }

@dataclass
class SystemState:
    timestamp: datetime
    plates: List[Plate]
    plate_base_length: float    
    plate_width: float

    

    def to_dict(self):
        if not isinstance(self.timestamp, datetime):
            raise TypeError(f"Некорректный тип timestamp: {type(self.timestamp)}. Ожидается datetime. datetime: {datetime}")
        return {
            "timestamp": self.timestamp.isoformat(),
            "plates": [plate.to_dict() for plate in self.plates],
            "plate_base_length": float(self.plate_base_length),
            "plate_width": float(self.plate_width),
            "version": "1.0"
        }
