import json
import logging
from typing import List, Dict, Any
from pathlib import Path

from ..base.provider import DataProviderBase
from ..base.models import SystemState, VisPlate, IMUData

logger = logging.getLogger(__name__)

class TestProvider(DataProviderBase):
    """
    Тестовый провайдер данных, использующий предопределенные данные из JSON файла
    для тестирования визуализации.
    """
    def __init__(self, config_path: str = 'providers/test_provider/config.json', 
                 test_data_path: str = 'providers/test_provider/test_data.json'):
        super().__init__(config_path)
        
        # Загрузка тестовых данных
        test_data_path = Path(test_data_path)
        if not test_data_path.exists():
            raise FileNotFoundError(f"Файл с тестовыми данными не найден: {test_data_path}")
        
        try:
            with open(test_data_path, 'r') as f:
                self.test_data = json.load(f)
            logger.info(f"Загружены тестовые данные из {test_data_path}")
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка при чтении тестовых данных: {e}")
            raise
            
        self.current_iteration = 0
        self.total_iterations = len(self.test_data['iterations'])
        
        # Проверка структуры данных
        self._validate_test_data()
        
        logger.info(f"TestProvider инициализирован. Всего итераций: {self.total_iterations}")

    def _validate_test_data(self) -> None:
        """Проверка корректности структуры тестовых данных"""
        if not isinstance(self.test_data, dict) or 'iterations' not in self.test_data:
            raise ValueError("Некорректная структура тестовых данных")
            
        if not self.test_data['iterations']:
            raise ValueError("Тестовые данные не содержат итераций")
            
        # Проверка первой итерации для валидации структуры
        first_iteration = self.test_data['iterations'][0]
        required_fields = {'baseHeight', 'plates'}
        if not all(field in first_iteration for field in required_fields):
            raise ValueError(f"В данных отсутствуют обязательные поля: {required_fields}")

    def _create_imu_data(self, plate_data: Dict[str, Any]) -> IMUData:
        """Создание объекта IMUData из данных пластины"""
        return IMUData(
            acceleration=[0.0, 0.0, 0.0],  # В тестовых данных нет ускорений
            angles=plate_data['angles']
        )

    def _create_plate(self, plate_data: Dict[str, Any], plate_config: Dict[str, Any], 
                     index: int) -> VisPlate:
        """Создание объекта VisPlate из данных пластины и конфигурации"""
        return VisPlate(
            id=index,
            position=plate_data['position'],
            dimensions=plate_config,
            imu_data=self._create_imu_data(plate_data)
        )

    async def generate_data(self) -> Dict[str, Any]:
        """
        Генерация данных для текущей итерации.
        Возвращает данные в формате, ожидаемом визуализацией.
        """
        try:
            current_data = self.test_data['iterations'][self.current_iteration]
            
            # Создаем список пластин с данными
            plates = [
                self._create_plate(plate_data, self.config['plates'][i], i)
                for i, plate_data in enumerate(current_data['plates'])
            ]
            
            # Создаем объект состояния системы
            state = SystemState(
                base_height=current_data['baseHeight'],
                plates=plates
            )
            
            # Подготавливаем данные для отправки
            result = state.to_dict()
            
            # Обновляем счетчик итераций
            self.current_iteration = (self.current_iteration + 1) % self.total_iterations
            
            logger.debug(f"Сгенерированы данные для итерации {self.current_iteration}")
            return result
            
        except Exception as e:
            logger.error(f"Ошибка при генерации данных: {e}")
            raise

