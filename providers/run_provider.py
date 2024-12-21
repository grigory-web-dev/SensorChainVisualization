import asyncio
import json
from pathlib import Path
from typing import Optional
from common.base_provider import DataProviderBase
from common.provider_manager import get_provider_manager
from server.logger import server_logger


async def create_and_start_provider(provider_name: str) -> Optional[DataProviderBase]:
    """
    Создает и запускает провайдер с указанным именем
    
    Args:
        provider_name: Имя провайдера из конфигурации

    Returns:
        Запущенный провайдер или None в случае ошибки
    """
    try:
        # Получаем менеджер провайдеров
        manager = get_provider_manager()
        
        # Создаем провайдер
        provider = manager.create_provider(provider_name)
        if not provider:
            server_logger.error(f"Failed to create provider: {provider_name}")
            return None

        # Запускаем провайдер
        server_logger.info(f"Starting provider: {provider_name}")
        provider_task = asyncio.create_task(provider.start())
        
        return provider

    except Exception as e:
        server_logger.error(f"Error starting provider {provider_name}: {e}")
        return None


async def main(provider_name: Optional[str] = None) -> Optional[DataProviderBase]:
    """
    Главная функция для создания и запуска провайдера
    
    Args:
        provider_name: Имя провайдера (если None, берется из конфигурации)

    Returns:
        Запущенный провайдер или None в случае ошибки
    """
    try:
        # Загружаем конфигурацию
        config_path = Path("server/config.json")
        if not config_path.exists():
            server_logger.error("Config file not found")
            return None

        with open(config_path) as f:
            config = json.load(f)

        # Если имя провайдера не указано, берем из конфигурации
        if provider_name is None:
            provider_name = config["provider"]["default"]

        return await create_and_start_provider(provider_name)

    except Exception as e:
        server_logger.error(f"Error in run_provider: {e}")
        return None


if __name__ == "__main__":
    # Если скрипт запущен напрямую, запускаем провайдер
    asyncio.run(main())