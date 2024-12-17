import numpy as np
from datetime import datetime
from src.config import SimConfig
from src.models import SystemState
from src.physics import calculate_positions, is_valid_state
from src.logger import server_logger, data_logger
import json

class PlatesSimulation:
    def __init__(self, config: SimConfig):
        self.config = config
        self.angles = np.array([config.MIN_ANGLE] * config.NUM_PLATES)
        self.velocities = np.zeros(config.NUM_PLATES)
        self.positions = calculate_positions(self.angles, config)
        server_logger.info("Simulation initialized with %d plates", config.NUM_PLATES)

    def update(self):
        """Обновление состояния пластин с учетом физических ограничений"""
        try:
            max_attempts = 10
            
            for _ in range(max_attempts):
                new_angles = self.angles.copy()
                
                for i in range(self.config.NUM_PLATES):
                    acceleration = np.random.uniform(-self.config.ANGLE_STEP, self.config.ANGLE_STEP)
                    self.velocities[i] = self.velocities[i] * self.config.DAMPING + acceleration
                    new_angles[i] = np.clip(
                        new_angles[i] + self.velocities[i],
                        self.config.MIN_ANGLE,
                        self.config.MAX_ANGLE
                    )
                
                new_positions = calculate_positions(new_angles, self.config)
                
                if is_valid_state(new_positions, new_angles, self.config):
                    self.angles = new_angles
                    self.positions = new_positions
                    break
                else:
                    self.velocities *= 0.5
            
        except Exception as e:
            server_logger.error("Error in simulation update: %s", str(e))
            raise

    def get_state(self) -> SystemState:
        """Получение текущего состояния системы"""
        state = SystemState(
            timestamp=datetime.now(),
            positions=self.positions,
            angles=self.angles.tolist()
        )
        try:
            data_logger.info(json.dumps(state.to_dict()))
        except Exception as e:
            server_logger.error(f"Failed to log data: {e}")
        return state
