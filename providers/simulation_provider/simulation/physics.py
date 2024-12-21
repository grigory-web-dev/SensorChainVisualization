import json
from pathlib import Path
import numpy as np
from typing import List, Dict
from .models import SimPlate


class PhysicsSimulation:
    def __init__(self):
        # Загружаем конфигурацию
        config_path = Path(__file__).parent / "config.json"
        with open(config_path) as f:
            self.config = json.load(f)
        
        self.physics_config = self.config["physics"]
        
    def distance_between_points(self, point1, point2):
        """Вычисляет расстояние между двумя точками"""
        return np.sqrt(sum((p1 - p2) ** 2 for p1, p2 in zip(point1, point2)))

    def check_plate_collisions(self, plates: List[SimPlate]) -> bool:
        """Проверяет столкновения между платами"""
        min_distance = self.physics_config["collisions"]["min_distance"]
        
        for i in range(len(plates)):
            for j in range(i + 1, len(plates)):
                if self.distance_between_line_segments(
                    plates[i].start_point, 
                    plates[i].end_point,
                    plates[j].start_point, 
                    plates[j].end_point
                ) < min_distance:
                    return True
        return False

    def check_floor_collision(self, plate: SimPlate) -> bool:
        """Проверяет столкновение платы с полом"""
        return min(plate.start_point[1], plate.end_point[1]) < 0

    def is_valid_state(self, plates: List[SimPlate]) -> bool:
        """Проверяет валидность состояния всей системы"""
        # Проверяем столкновения с полом
        if any(self.check_floor_collision(plate) for plate in plates):
            return False
        
        # Проверяем углы наклона
        min_angle = self.physics_config["angles"]["min_vertical_angle"]
        max_angle = self.physics_config["angles"]["max_vertical_angle"]
        
        for plate in plates:
            if not (90 + min_angle <= plate.vertical_angle <= 90 + max_angle):
                return False
                
        return True
        
    def distance_between_line_segments(self, start1, end1, start2, end2):
        """Вычисляет минимальное расстояние между двумя отрезками"""
        def dot_product(v1, v2):
            return sum(a * b for a, b in zip(v1, v2))

        def subtract_points(p1, p2):
            return tuple(a - b for a, b in zip(p1, p2))

        def add_points(p1, p2):
            return tuple(a + b for a, b in zip(p1, p2))

        def multiply_point(p, scalar):
            return tuple(a * scalar for a in p)

        # Векторы направления
        d1 = subtract_points(end1, start1)
        d2 = subtract_points(end2, start2)
        r = subtract_points(start1, start2)

        a = dot_product(d1, d1)
        e = dot_product(d2, d2)
        f = dot_product(d2, r)

        if a <= 1e-8 and e <= 1e-8:  # Оба отрезка являются точками
            return self.distance_between_points(start1, start2)

        if a <= 1e-8:  # Первый отрезок является точкой
            s = np.clip(f / e, 0.0, 1.0)
            return self.distance_between_points(
                start1, 
                add_points(start2, multiply_point(d2, s))
            )

        c = dot_product(d1, r)
        if e <= 1e-8:  # Второй отрезок является точкой
            t = np.clip(-c / a, 0.0, 1.0)
            return self.distance_between_points(
                add_points(start1, multiply_point(d1, t)),
                start2
            )

        b = dot_product(d1, d2)
        denom = a * e - b * b
        if denom != 0:
            s = np.clip((b * c - a * f) / denom, 0.0, 1.0)
        else:
            s = 0.0

        t = (b * s + c) / a
        if t < 0:
            t = 0
            s = np.clip(-f / e, 0.0, 1.0)
        elif t > 1:
            t = 1
            s = np.clip((b - f) / e, 0.0, 1.0)

        point1 = add_points(start1, multiply_point(d1, t))
        point2 = add_points(start2, multiply_point(d2, s))

        return self.distance_between_points(point1, point2)