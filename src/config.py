import numpy as np

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

class ServerConfig:
    HOST = "127.0.0.1"
    PORT = 8000
    RELOAD = True
