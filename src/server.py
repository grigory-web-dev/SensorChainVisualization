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
                await websocket.send_json(state.to_dict())
                await asyncio.sleep(SimConfig.UPDATE_RATE)
        except Exception as e:
            server_logger.error("WebSocket error for client %d: %s", client_id, str(e))
        finally:
            server_logger.info("WebSocket connection closed: %d", client_id)
    
    return app

app = create_app()
