import json
from pathlib import Path
from typing import Optional
from common.base_provider import DataProviderBase
from common.provider_manager import get_provider_manager
from server.logger import server_logger


class ProviderFactory:
    """
    Фабрика для создания и инициализации провайдеров данных
    """
    @staticmethod
    async def create_provider(provider_name: str) -> Optional[DataProviderBase]:
        """
        Создает и инициализирует провайдер указанного типа
        
        Args:
            provider_name: Имя провайдера из конфигурации

        Returns:
            Инициализированный провайдер или None в случае ошибки
        """
        try:
            # Получаем менеджер провайдеров
            manager = get_provider_manager()
            
            # Создаем провайдер
            provider = manager.create_provider(provider_name)
            if not provider:
                server_logger.error(f"Failed to create provider: {provider_name}")
                return None

            server_logger.info(f"Created provider: {provider_name}")
            return provider

        except Exception as e:
            server_logger.error(f"Error creating provider {provider_name}: {e}")
            return None

    @staticmethod
    async def create_from_config() -> Optional[DataProviderBase]:
        """
        Создает провайдер на основе конфигурации сервера
        
        Returns:
            Инициализированный провайдер или None в случае ошибки
        """
        try:
            # Загружаем конфигурацию
            config_path = Path("server/config.json")
            if not config_path.exists():
                server_logger.error("Config file not found")
                return None

            with open(config_path) as f:
                config = json.load(f)

            provider_name = config["provider"]["default"]
            return await ProviderFactory.create_provider(provider_name)

        except Exception as e:
            server_logger.error(f"Error creating provider from config: {e}")
            return None