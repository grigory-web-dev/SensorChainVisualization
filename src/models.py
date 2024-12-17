from dataclasses import dataclass
from typing import List, Tuple
from datetime import datetime

@dataclass
class SystemState:
    timestamp: datetime
    positions: List[Tuple[float, float]]
    angles: List[float]

    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "positions": self.positions,
            "angles": self.angles
        }
