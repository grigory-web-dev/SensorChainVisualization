# models.py
from dataclasses import dataclass
from typing import List, Tuple
from datetime import datetime

@dataclass
class Plate:
    center: Tuple[float, float, float]  # x, y, z coordinates
    angles: Tuple[float, float, float]  # rotation around x, y, z axes
    width: float
    length: float

@dataclass
class SystemState:
    timestamp: datetime
    plates: List[Plate]
    plate_length: float    # в миллиметрах
    plate_width: float     # в миллиметрах

    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "plates": [
                {
                    "center": plate.center,  # в миллиметрах
                    "angles": plate.angles,   # в градусах
                } for plate in self.plates
            ],
            "plate_length": self.plate_length,
            "plate_width": self.plate_width
        }
