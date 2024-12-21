# src/logger.py
import logging

# Настройка логгера для сервера
server_logger = logging.getLogger('server')
server_logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
server_logger.addHandler(handler)

# Настройка логгера для данных
data_logger = logging.getLogger('data')
data_logger.setLevel(logging.INFO)
data_handler = logging.FileHandler('data.log')
data_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
data_logger.addHandler(data_handler)
