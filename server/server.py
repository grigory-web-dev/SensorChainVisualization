from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import logging
from src.config import ServerConfig
from src.simulation import PlatesSimulation
from src.logger import server_logger

app = FastAPI()
app.mount("/public", StaticFiles(directory="public"), name="public")

config = ServerConfig()
simulation = PlatesSimulation(config)

@app.get("/")
async def get_index():
    server_logger.info("Serving index page")
    return FileResponse("public/index.html")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = id(websocket)
    
    try:
        await websocket.accept()
        server_logger.info(f"New WebSocket connection: {client_id}")
        server_logger.info(f"Client {client_id} connected successfully")

        while True:
            try:
                # Get latest state including IMU data
                state = simulation.update()
                # Send to client
                await websocket.send_json(state.to_dict())
                # Wait according to update rate
                await asyncio.sleep(1.0 / config.UPDATE_RATE)
                
            except Exception as e:
                server_logger.error(f"WebSocket error for client {client_id}: {str(e)}")
                break

    except Exception as e:
        server_logger.error(f"Error handling WebSocket connection {client_id}: {str(e)}")
        
    finally:
        server_logger.info(f"WebSocket connection closed: {client_id}")
