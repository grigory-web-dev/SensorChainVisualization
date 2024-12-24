from datetime import datetime
import numpy as np
from typing import List
from server.logger import server_logger

class PlatesSimulation:
    def __init__(self):
        # Данные для симуляции
        self.time = 0.0
        self.frequency = 1  # Увеличиваем частоту колебаний для более быстрого движения
        self.plate_spacing = 50.0      # Увеличиваем расстояние между пластинами
        self.phase_shift = 2 * np.pi / 3  # Сдвиг фазы между пластинами
        self.amplitude = 50.0          # Увеличиваем амплитуду колебаний
        self.above_table = 20.0         # Поднимаем пластины выше над столом

        # Данные пластины
        self.plate_thickness = 10.0     # толщина пластины в мм
        self.plate_height = 200.0       # Высота пластины в мм
        self.plate_width = 100.0        # Ширина пластины в мм
        
    def update(self, dt: float):
        """  Обновляет состояние симуляции на заданный промежуток времени. """
        try:
            self.time += dt
            plates = []
        
            # Генерируем три пластины
            for i in range(3):
                # Фазовый сдвиг для каждой пластины
                phase = i * self.phase_shift

                # Базовая высота увеличивается для каждой следующей пластины
                base_y = (self.above_table + self.plate_height/2) + i * (self.plate_height + self.plate_spacing)

                # Добавляем вертикальное колебание
                vertical_oscillation = 30.0 * np.sin(self.time * self.frequency * 0.7 + phase)
                y = base_y + vertical_oscillation

                # Создаем колебательное движение по X и Z с фазовым сдвигом
                x = self.amplitude * np.cos(self.time * self.frequency + phase)
                z = self.amplitude * np.sin(self.time * self.frequency + phase)

                # Делаем более заметные углы наклона
                roll = np.radians(15 * np.sin(self.time * self.frequency + phase))
                pitch = np.radians(15 * np.cos(self.time * self.frequency + phase))
                yaw = np.radians(30 * np.sin(self.time * self.frequency * 0.5))

                position = (float(x), float(y), float(z))
                angles = (float(roll), float(pitch), float(yaw))

                plate ={
                    "plate_id": i,
                    "coordinates": position,
                    "angles": angles,
                    "dimensions":(
                        float(self.plate_thickness),
                        float(self.plate_height),
                        float(self.plate_width)
                    )
                }

                plates.append(plate)

            return {
                "timestamp": datetime.now(),
                "plates": plates
            }

        except Exception as e:
            server_logger.error(f"Error in simulation update: {e}")
            return None
