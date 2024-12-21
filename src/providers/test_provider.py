from .base_provider import DataProviderBase
import json

class TestProvider(DataProviderBase):
    def __init__(self, config_path='src/config.json', test_data_path='src/test_data.json'):
        super().__init__(config_path)
        with open(test_data_path, 'r') as f:
            self.test_data = json.load(f)
        self.current_iteration = 0

    async def generate_data(self):
        data = self.test_data['iterations'][self.current_iteration]
        # Добавляем размеры из конфига
        for i, plate in enumerate(data['plates']):
            plate['dimensions'] = self.config['sensors']['plates'][i]
        
        self.current_iteration = (self.current_iteration + 1) % len(self.test_data['iterations'])
        return data
