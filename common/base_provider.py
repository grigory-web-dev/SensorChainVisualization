from abc import ABC, abstractmethod
from typing import Optional, Tuple
import asyncio
import json


class DataProviderBase(ABC):
    def __init__(self, manifest: dict):
        self.manifest = manifest
        self.data_rate = self._get_data_rate()
        self._running = False
        self.latest_data = None

    def _get_data_rate(self) -> float:
        """Получаем частоту обновления данных"""
        rate_config = self.manifest.get('data_rate', {})
        if rate_config.get('mode') == 'fixed':
            return rate_config.get('rate', 100)  # Hz
        return None  # Для режима source частота определяется источником

    @abstractmethod
    async def generate_data(self) -> Tuple[Tuple[float, float, float], 
                                         Tuple[float, float, float], 
                                         Optional[Tuple[float, float, float]]]:
        """
        Генерация данных в стандартном формате
        
        Returns:
            coordinates: tuple[float, float, float]  # (x, y, z)
            angles: tuple[float, float, float]       # (roll, pitch, yaw)
            magnetometer: tuple[float, float, float] # (mx, my, mz) - опционально
        """
        pass

    @abstractmethod
    async def _wait_for_next_data(self):
        """Ожидание следующего пакета данных"""
        pass

    async def start(self):
        """Запуск провайдера"""
        self._running = True
        try:
            while self._running:
                if self.data_rate:
                    # Фиксированная частота
                    self.latest_data = await self.generate_data()
                    await asyncio.sleep(1.0 / self.data_rate)
                else:
                    # Частота определяется источником
                    self.latest_data = await self.generate_data()
                    await self._wait_for_next_data()
        except Exception as e:
            self._running = False
            raise

    async def stop(self):
        """Остановка провайдера"""
        self._running = False