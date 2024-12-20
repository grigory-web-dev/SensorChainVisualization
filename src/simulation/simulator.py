from datetime import datetime
import numpy as np
from typing import List, Dict, Optional
from src.models.data import (
    SystemState, VisPlate, IMUData, 
    PlateState, PlateCalibration
)
from src.simulation.imu import IMUSimulator
from src.simulation.calibration import SystemCalibrator
from src.config import ServerConfig
from src.logger import server_logger

class PlatesSimulation:
    def __init__(self, config: ServerConfig):
        self.config = config
        
        # Создаем независимые симуляторы для каждой платы
        self.imu_simulators = [
            IMUSimulator(i) for i in range(config.NUM_PLATES)
        ]
        self.calibrator = SystemCalibrator(config.NUM_PLATES)
        
        # Состояние системы
        self.plate_states: Dict[int, PlateState] = {}
        self.calibration_data: Dict[int, PlateCalibration] = {}
        self.last_recalibration = datetime.now()
        
        # Инициализация
        self.start_calibration()
        
    def start_calibration(self):
        """Начать калибровку системы"""
        server_logger.info("Starting system calibration")
        self.calibrator.start_calibration()
        
    def update_calibration(self, imu_data_list: List[IMUData]) -> bool:
        """Обновить калибровку новыми данными"""
        if not self.calibrator.is_calibrating:
            return False
            
        all_ready = True
        for imu_data in imu_data_list:
            plate_ready = self.calibrator.process_imu_data(
                imu_data.plate_id, 
                imu_data
            )
            all_ready = all_ready and plate_ready
            
        if all_ready:
            self.calibration_data = {
                cal.plate_id: cal 
                for cal in self.calibrator.finish_calibration()
            }
            self.last_recalibration = datetime.now()
            server_logger.info("Calibration completed")
            
        return all_ready
        
    def needs_recalibration(self) -> bool:
        """Проверить необходимость рекалибровки"""
        if not self.calibration_data:
            return True
            
        time_since_cal = (datetime.now() - self.last_recalibration).total_seconds()
        return time_since_cal > self.config.RECALIBRATION_TIMEOUT
        
    def calculate_plate_position(self, imu_data: IMUData) -> VisPlate:
        """Вычислить текущее положение платы"""
        plate_id = imu_data.plate_id
        
        # Если есть калибровка, используем её
        if plate_id in self.calibration_data:
            calibration = self.calibration_data[plate_id]
            last_state = self.plate_states.get(plate_id)
            
            if last_state:
                dt = (imu_data.timestamp - last_state.imu_data.timestamp) / 1e6
            else:
                dt = self.config.UPDATE_INTERVAL
                
            # Интегрируем угловые скорости
            angular_velocity = np.array([
                imu_data.gyro_x,
                imu_data.gyro_y,
                imu_data.gyro_z
            ])
            delta_orientation = angular_velocity * dt
            
            # Интегрируем ускорения
            acceleration = np.array([
                imu_data.accel_x,
                imu_data.accel_y,
                imu_data.accel_z
            ])
            
            if last_state:
                last_accel = np.array([
                    last_state.imu_data.accel_x,
                    last_state.imu_data.accel_y,
                    last_state.imu_data.accel_z
                ])
                avg_accel = (acceleration + last_accel) / 2
            else:
                avg_accel = acceleration
                
            delta_position = avg_accel * dt * dt / 2
            
            # Вычисляем новое положение
            if last_state:
                new_orientation = tuple(o + d for o, d in zip(
                    last_state.relative_orientation, 
                    delta_orientation
                ))
                new_position = tuple(p + d for p, d in zip(
                    last_state.relative_position,
                    delta_position
                ))
                accumulated_error = last_state.accumulated_error + dt
            else:
                new_orientation = tuple(delta_orientation)
                new_position = tuple(delta_position)
                accumulated_error = dt
                
            # Сохраняем состояние
            self.plate_states[plate_id] = PlateState(
                plate_id=plate_id,
                imu_data=imu_data,
                relative_position=new_position,
                relative_orientation=new_orientation,
                last_update=datetime.fromtimestamp(imu_data.timestamp / 1e6),
                accumulated_error=accumulated_error
            )
            
            # Вычисляем абсолютные координаты
            abs_position = tuple(r + c for r, c in zip(
                calibration.reference_position,
                new_position
            ))
            abs_orientation = tuple(r + c for r, c in zip(
                calibration.reference_orientation,
                new_orientation
            ))
            
            # Оцениваем достоверность
            confidence = max(0.2, 1.0 - (accumulated_error / self.config.RECALIBRATION_TIMEOUT))
            
            return VisPlate(
                plate_id=plate_id,
                height=self.config.BASE_LENGTH,
                position=abs_position,
                orientation=abs_orientation,
                position_confidence=confidence,
                needs_recalibration=confidence < 0.5
            )
        else:
            # Пока нет калибровки, возвращаем базовое состояние
            return VisPlate(
                plate_id=plate_id,
                height=self.config.BASE_LENGTH,
                position=(0.0, plate_id * self.config.BASE_LENGTH, 0.0),  # располагаем платы вертикально
                orientation=(0.0, 0.0, 0.0),
                position_confidence=0.0,
                needs_recalibration=True
            )
        
    def update(self) -> SystemState:
        """Обновить состояние всей системы"""
        try:
            # Собираем данные со всех IMU
            raw_data = []
            current_plates = []
            
            for simulator in self.imu_simulators:
                imu_data = simulator.update()
                if imu_data is None:
                    continue
                    
                raw_data.append(imu_data)
                
                # Если система еще калибруется
                if self.calibrator.is_calibrating:
                    self.update_calibration(raw_data)
                    # Во время калибровки возвращаем базовое состояние плат
                    current_plates.append(self.calculate_plate_position(imu_data))
                else:
                    # После калибровки вычисляем реальное положение
                    plate = self.calculate_plate_position(imu_data)
                    current_plates.append(plate)
            
            return SystemState(
                timestamp=datetime.now(),
                plates=current_plates,
                calibration_age=(datetime.now() - self.last_recalibration).total_seconds(),
                needs_recalibration=self.needs_recalibration(),
                plate_base_height=float(self.config.BASE_LENGTH),
                raw_data=raw_data
            )
                
        except Exception as e:
            server_logger.error(f"Error in simulation update: {str(e)}")
            raise
