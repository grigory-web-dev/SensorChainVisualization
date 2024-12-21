import asyncio
from typing import Optional, Dict, Any
from common.base_provider import DataProviderBase
from common.models import SystemState, IMUData
from .simulation.simulator import PlatesSimulation


class SimulationProvider(DataProviderBase):
    def __init__(self, manifest: dict):
        super().__init__(manifest)
        # Инициализируем симулятор
        self.simulator = PlatesSimulation()
        self.latest_state: Optional[SystemState] = None

    async def generate_data(self) -> Optional[Dict[str, Any]]:
        """
        Генерация данных через симулятор
        
        Returns:
            Dict с данными в формате:
            {
                "version": "1.0",
                "baseHeight": float,
                "plates": [
                    {
                        "plate_id": int,
                        "position": [x, y, z],
                        "orientation": [roll, pitch, yaw],
                        "height": float
                    },
                    ...
                ]
            }
        """
        # Получаем новое состояние симуляции
        state = self.simulator.get_current_state()
        if not state or not state.plates:
            return None
            
        return {
            "version": "1.0",
            "baseHeight": state.plate_base_height,
            "plates": [
                {
                    "plate_id": plate.plate_id,
                    "position": plate.position,
                    "orientation": plate.orientation,
                    "height": plate.height
                } for plate in state.plates
            ]
        }

    async def _wait_for_next_data(self):
        """
        Для симуляции используем фиксированный интервал
        """
        await asyncio.sleep(1.0 / self.data_rate)
        
    def get_current_state(self) -> Optional[SystemState]:
        """
        Получает текущее состояние системы
        """
        return self.latest_state