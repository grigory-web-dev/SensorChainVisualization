from .base_provider import DataProviderBase
import math
import time

class SimulationProvider(DataProviderBase):
    async def generate_data(self):
        t = time.time()
        data = {
            "baseHeight": 100.0,
            "plates": []
        }
        for i in range(self.config['sensors']['count']):
            plate = self.config['sensors']['plates'][i]
            # Генерируем синусоидальные движения для демонстрации
            data["plates"].append({
                "position": [
                    10 * math.sin(t + i),
                    i * plate['length'],
                    10 * math.cos(t + i)
                ],
                "angles": [
                    15 * math.sin(t + i),
                    15 * math.cos(t + i),
                    5 * math.sin(2*t + i)
                ],
                "dimensions": {
                    "length": plate['length'],
                    "width": plate['width'],
                    "thickness": plate['thickness']
                }
            })
        return data
