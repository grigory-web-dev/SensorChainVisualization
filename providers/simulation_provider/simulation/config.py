class SimulationConfig:
    """Конфигурация физической симуляции"""
    # Ограничения на угол отклонения от вертикали
    MIN_VERTICAL_ANGLE = -45
    MAX_VERTICAL_ANGLE = 45
    
    # Физические константы
    GRAVITY = 9.81  # м/с²
    TIME_STEP = 0.01  # Шаг симуляции в секундах
    
    # Параметры столкновений
    MIN_DISTANCE = 0.1  # Минимальное расстояние между пластинами