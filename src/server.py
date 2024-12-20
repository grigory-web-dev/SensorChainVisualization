# src/server.py
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.config import SimConfig
from src.simulation import PlatesSimulation
from src.logger import server_logger
import asyncio

def create_app():
    app = FastAPI()
    
    # Монтируем статические файлы
    app.mount("/public", StaticFiles(directory="public"), name="public")
    
    # Создаем симуляцию
    config = SimConfig()
    simulation = PlatesSimulation(config)
    
    @app.get("/")
    async def root():
        server_logger.info("Serving index page")
        return FileResponse("public/index.html")

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        client_id = id(websocket)
        server_logger.info(f"New WebSocket connection: {client_id}")
        
        await websocket.accept()
        server_logger.info(f"Client {client_id} connected successfully")
        
        try:
            while True:
                simulation.update()
                state = simulation.get_state()
                await websocket.send_json(state.to_dict())
                await asyncio.sleep(config.UPDATE_RATE)
        except Exception as e:
            server_logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        finally:
            server_logger.info(f"WebSocket connection closed: {client_id}")
    
    return app

app = create_app()
