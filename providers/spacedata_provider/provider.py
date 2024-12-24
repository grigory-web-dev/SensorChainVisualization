from typing import Optional, Dict, Any
from common.base_provider import DataProviderBase
from .simulation.simulator import PlatesSimulation

class SpaceDataProvider(DataProviderBase):
    def __init__(self, manifest: dict):
        super().__init__(manifest)
        self.simulator = PlatesSimulation()

    async def generate_data(self) -> Optional[Dict[str, Any]]:
        """
        Генерация данных через симулятор
        """
        # Получаем новое состояние симуляции
        state = self.simulator.update(1.0/100)
        if not state or not state["plates"]:
            return None
            
        return {
            "version": "1.0",
            "plates": [
                {
                    "plate_id": plate["plate_id"],
                    "position": plate["coordinates"],
                    "orientation": plate["angles"],
                    "dimensions": plate["dimensions"]
                } for plate in state["plates"]
            ]
        }
