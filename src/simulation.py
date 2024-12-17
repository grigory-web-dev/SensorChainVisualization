# simulation.py
import numpy as np
from datetime import datetime
from src.config import SimConfig
from src.models import SystemState, Plate
from src.physics import is_valid_state
from src.logger import server_logger, data_logger
import json

class PlatesSimulation:
    def __init__(self, config: SimConfig):
        self.config = config
        initial_centers = [
            (375, 178, 190),  # пример начальных центров в мм
            (420, 200, 185),
            (380, 190, 195),
            (400, 185, 188),
            (390, 195, 192)
        ]
        
        # Рассчитываем среднее расстояние между центрами
        total_distance = 0
        count = 0
        for i in range(len(initial_centers) - 1):
            for j in range(i + 1, len(initial_centers)):
                x1, y1, z1 = initial_centers[i]
                x2, y2, z2 = initial_centers[j]
                distance = np.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2)
                total_distance += distance
                count += 1
        
        # Устанавливаем размеры пластин
        self.plate_length = total_distance / count  # среднее расстояние
        self.plate_width = self.plate_length / 1.5  # ширина в 1.5 раза меньше
        
        server_logger.info(f"Calculated plate dimensions: {self.plate_length:.1f}x{self.plate_width:.1f} mm")

    def update(self):
        """Update plate positions and orientations"""
        try:
            max_attempts = 10
            
            for _ in range(max_attempts):
                new_plates = []
                
                for i, plate in enumerate(self.plates):
                    # Update angular velocities with random accelerations
                    for j in range(3):
                        acceleration = np.random.uniform(-self.config.ANGLE_STEP, 
                                                      self.config.ANGLE_STEP)
                        self.velocities[i][j] = (self.velocities[i][j] * self.config.DAMPING + 
                                               acceleration)
                    
                    # Calculate new angles
                    new_angles = [
                        np.clip(a + v, self.config.MIN_ANGLE, self.config.MAX_ANGLE)
                        for a, v in zip(plate.angles, self.velocities[i])
                    ]
                    
                    # Create new plate state
                    new_plate = Plate(
                        center=plate.center,
                        angles=tuple(new_angles),
                        width=plate.width,
                        length=plate.length
                    )
                    new_plates.append(new_plate)
                
                # Check if new state is valid
                if is_valid_state(new_plates, self.config):
                    self.plates = new_plates
                    break
                else:
                    # Reduce velocities if state is invalid
                    for velocities in self.velocities:
                        for j in range(3):
                            velocities[j] *= 0.5
            
        except Exception as e:
            server_logger.error("Error in simulation update: %s", str(e))
            raise

    def get_state(self) -> SystemState:
        """Get current system state"""
        state = SystemState(
            timestamp=datetime.now(),
            plates=self.plates
        )
        try:
            data_logger.info(json.dumps(state.to_dict()))
        except Exception as e:
            server_logger.error(f"Failed to log data: {e}")
        return state
