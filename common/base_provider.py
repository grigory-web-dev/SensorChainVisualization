from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Callable
import asyncio


class DataProviderBase(ABC):
    def __init__(self, manifest: dict):
        self.manifest = manifest
        self.data_rate = self._get_data_rate()
        self._running = False
        self.latest_data = None
        self._send_callback: Optional[Callable[[Any], None]] = None

    def _get_data_rate(self) -> float:
        """Получаем частоту обновления данных"""
        rate_config = self.manifest.get('data_rate', {})
        if rate_config.get('mode') == 'fixed':
            return rate_config.get('rate', 100)  # Hz
        return None  # Для режима source частота определяется источником

    @abstractmethod
    async def generate_data(self) -> Optional[Dict[str, Any]]:
        """
        Генерация данных в стандартном формате
        """
        pass

    async def start(self, send_callback: Callable[[Any], None]) -> None:
        """
        Запуск провайдера
        
        Args:
            send_callback: Асинхронная функция для отправки данных клиенту
        """
        self._send_callback = send_callback
        self._running = True
        
        try:
            while self._running:
                # Генерируем новые данные
                data = await self.generate_data()
                # Если есть данные - отправляем
                if data:
                    await self._send_callback(data)
                # Ждем следующий цикл согласно частоте
                if self.data_rate:
                    await asyncio.sleep(1.0 / self.data_rate)
        except Exception as e:
            self._running = False
            raise

    async def stop(self) -> None:
        """Остановка провайдера"""
        self._running = False
        self._send_callback = None
