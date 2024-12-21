import os
import sys
import json
from typing import Dict, Optional, Type
from pathlib import Path
from common.base_provider import DataProviderBase
import importlib
from server.logger import server_logger


class ProviderManager:
    def __init__(self, providers_path: str = "providers"):
        self.providers_path = Path(providers_path)
        self.providers: Dict[str, dict] = {}  # name -> manifest
        self.provider_classes: Dict[str, Type[DataProviderBase]] = {}  # name -> class
        
        # Добавляем корневую директорию в sys.path
        root_dir = str(self.providers_path.parent)
        if root_dir not in sys.path:
            sys.path.insert(0, root_dir)
            
        self._scan_providers()

    def _scan_providers(self):
        """Сканирует директорию провайдеров и загружает их манифесты"""
        for provider_dir in self.providers_path.iterdir():
            if not provider_dir.is_dir():
                continue

            manifest_path = provider_dir / "manifest.json"
            if not manifest_path.exists():
                continue

            try:
                # Загружаем манифест
                with open(manifest_path) as f:
                    manifest = json.load(f)
                
                provider_name = manifest.get("name")
                if not provider_name:
                    continue

                # Формируем путь импорта модуля
                module_name = f"providers.{provider_dir.name}.provider"
                
                try:
                    # Импортируем модуль
                    module = importlib.import_module(module_name)
                    
                    # Ищем класс провайдера в модуле
                    for item_name in dir(module):
                        item = getattr(module, item_name)
                        if (isinstance(item, type) and 
                            issubclass(item, DataProviderBase) and 
                            item != DataProviderBase):
                            self.providers[provider_name] = manifest
                            self.provider_classes[provider_name] = item
                            server_logger.info(f"Loaded provider: {provider_name}")
                            break

                except ImportError as e:
                    server_logger.error(f"Error importing module {module_name}: {e}")

            except Exception as e:
                server_logger.error(f"Error loading provider from {provider_dir}: {e}")

    def get_provider(self, name: str) -> Optional[Type[DataProviderBase]]:
        """Получает класс провайдера по имени"""
        return self.provider_classes.get(name)

    def get_manifest(self, name: str) -> Optional[dict]:
        """Получает манифест провайдера по имени"""
        return self.providers.get(name)

    def create_provider(self, name: str) -> Optional[DataProviderBase]:
        """Создает экземпляр провайдера по имени"""
        provider_class = self.get_provider(name)
        manifest = self.get_manifest(name)
        
        if provider_class and manifest:
            try:
                return provider_class(manifest)
            except Exception as e:
                server_logger.error(f"Error creating provider {name}: {e}")
                return None
        return None

    def list_providers(self) -> Dict[str, dict]:
        """Возвращает словарь доступных провайдеров и их манифестов"""
        return self.providers.copy()


# Глобальный экземпляр менеджера провайдеров
_provider_manager: Optional[ProviderManager] = None


def get_provider_manager() -> ProviderManager:
    """Получает глобальный экземпляр менеджера провайдеров"""
    global _provider_manager
    if _provider_manager is None:
        _provider_manager = ProviderManager()
    return _provider_manager