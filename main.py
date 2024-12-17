from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import numpy as np
import asyncio
import logging
from logging.handlers import RotatingFileHandler
import json
from datetime import datetime
from fastapi.websockets import WebSocketDisconnect

import os

# Создаем директорию для логов, если её нет
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# Настройка логирования сервера

def setup_logger(name, log_file, max_size=100*1024, backup_count=1):
    """Настройка логгера с ротацией файлов"""
    log_path = os.path.join(log_dir, log_file)
    
    # Добавляем блокировку при работе с файлом
    handler = RotatingFileHandler(
        log_path,
        maxBytes=max_size,
        backupCount=backup_count,
        encoding='utf-8',
        delay=True  # Открываем файл только при первой записи
    )
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Проверяем, не добавлен ли уже такой handler
    if not logger.handlers:
        logger.addHandler(handler)
    
    return logger

# Создаем логгеры
server_logger = setup_logger('server', 'server.log')
data_logger = setup_logger('data', 'data.log')

# Отключаем логи доступа uvicorn
logging.getLogger("uvicorn.access").disabled = True

# Конфигурация симуляции
class SimConfig:
    NUM_PLATES = 5          # Количество пластин
    PLATE_LENGTH = 1.0      # Длина пластины (метры)
    MIN_ANGLE = np.pi/6     # Минимальный угол от стола (30 градусов)
    MAX_ANGLE = np.pi/2     # Максимальный угол от стола (90 градусов)
    UPDATE_RATE = 0.1       # Частота обновления (секунды)
    ANGLE_STEP = np.pi/36   # Шаг изменения угла (5 градусов)
    DAMPING = 0.95          # Коэффициент затухания
    MIN_DISTANCE = 0.1      # Минимальное расстояние между пластинами
    TABLE_Y = 0.0           # Y-координата поверхности стола

class PlatesSimulation:
    def __init__(self, config: SimConfig):
        self.config = config
        # Теперь храним абсолютные углы для каждой пластины
        self.angles = np.array([self.config.MIN_ANGLE] * config.NUM_PLATES)
        self.velocities = np.zeros(config.NUM_PLATES)
        self.positions = self.calculate_positions(self.angles)
        server_logger.info("Simulation initialized with %d plates", config.NUM_PLATES)
        
    def calculate_positions(self, angles):
        """Вычисление позиций пластин на основе абсолютных углов"""
        positions = [(0.0, 0.0)]  # Начальная точка
        
        # Вычисляем все позиции соединений пластин
        for i in range(self.config.NUM_PLATES):
            prev_x, prev_y = positions[-1]
            # Используем абсолютный угол каждой пластины
            new_x = prev_x + self.config.PLATE_LENGTH * np.cos(angles[i])
            new_y = prev_y + self.config.PLATE_LENGTH * np.sin(angles[i])
            positions.append((new_x, new_y))
            
        return positions  # Возвращаем все позиции, включая начальную и конечную
    
    def is_valid_state(self, positions, angles):
        """Проверка валидности состояния системы"""
        # Проверка минимального угла от стола
        if any(angle < self.config.MIN_ANGLE for angle in angles):
            return False
            
        # Проверка максимального угла от стола
        if any(angle > self.config.MAX_ANGLE for angle in angles):
            return False
            
        # Проверка на пересечение с полом
        if any(y < self.config.TABLE_Y for x, y in positions):
            return False
            
        # Проверка на пересечение пластин
        for i in range(len(positions) - 1):
            for j in range(i + 2, len(positions)):
                dx = positions[j][0] - positions[i][0]
                dy = positions[j][1] - positions[i][1]
                distance = np.sqrt(dx*dx + dy*dy)
                if distance < self.config.MIN_DISTANCE:
                    return False
        
        return True

    def update(self):
        """Обновление состояния пластин с учетом физических ограничений"""
        try:
            max_attempts = 10  # Максимальное количество попыток найти валидное состояние
            
            for _ in range(max_attempts):
                # Копируем текущее состояние
                new_angles = self.angles.copy()
                
                # Обновляем скорости и углы для каждой пластины
                for i in range(self.config.NUM_PLATES):
                    acceleration = np.random.uniform(-self.config.ANGLE_STEP, self.config.ANGLE_STEP)
                    self.velocities[i] = self.velocities[i] * self.config.DAMPING + acceleration
                    new_angles[i] = np.clip(
                        new_angles[i] + self.velocities[i],
                        self.config.MIN_ANGLE,
                        self.config.MAX_ANGLE
                    )
                
                # Вычисляем новые позиции
                new_positions = self.calculate_positions(new_angles)
                
                # Проверяем валидность нового состояния
                if self.is_valid_state(new_positions, new_angles):
                    self.angles = new_angles
                    self.positions = new_positions
                    break
                else:
                    # Если состояние невалидное, уменьшаем скорости
                    self.velocities *= 0.5
            
        except Exception as e:
            server_logger.error("Error in simulation update: %s", str(e))
            raise

    def get_state(self):
        """Получение текущего состояния системы"""
        state = {
            "timestamp": datetime.now().isoformat(),
            "positions": self.positions,
            "angles": self.angles.tolist()
        }
        try:
            data_logger.info(json.dumps(state))
        except Exception as e:
            server_logger.error(f"Failed to log data: {e}")
        return state

# Создаем FastAPI приложение
app = FastAPI()
app.mount("/public", StaticFiles(directory="public"), name="public")

# Создаем симуляцию
simulation = PlatesSimulation(SimConfig)

@app.get("/")
async def root():
    server_logger.info("Serving index page")
    return FileResponse("public/index.html")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = id(websocket)
    server_logger.info("New WebSocket connection: %d", client_id)
    
    await websocket.accept()
    server_logger.info("Client %d connected successfully", client_id)
    
    try:
        while True:
            simulation.update()
            state = simulation.get_state()
            await websocket.send_json(state)
            await asyncio.sleep(SimConfig.UPDATE_RATE)
    except WebSocketDisconnect:
        server_logger.info("Client %d disconnected normally", client_id)
    except (asyncio.CancelledError, RuntimeError) as e:
        server_logger.error("WebSocket error for client %d: %s", client_id, str(e))
    finally:
        server_logger.info("WebSocket connection closed: %d", client_id)

if __name__ == "__main__":
    server_logger.info("Starting server")
    import uvicorn
    uvicorn.run(
        "main:app",  # измените на строку
        host="127.0.0.1",  # localhost
        port=8000,
        reload=True  # автоматическая перезагрузка при изменении файлов
    )
