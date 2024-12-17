import os
import logging
from logging.handlers import RotatingFileHandler

# Создаем директорию для логов, если её нет
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

def setup_logger(name, log_file, max_size=100*1024, backup_count=1):
    """Настройка логгера с ротацией файлов"""
    log_path = os.path.join(log_dir, log_file)
    
    handler = RotatingFileHandler(
        log_path,
        maxBytes=max_size,
        backupCount=backup_count,
        encoding='utf-8',
        delay=True
    )
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        logger.addHandler(handler)
    
    return logger

# Создаем логгеры
server_logger = setup_logger('server', 'server.log')
data_logger = setup_logger('data', 'data.log')

# Отключаем логи доступа uvicorn
logging.getLogger("uvicorn.access").disabled = True
