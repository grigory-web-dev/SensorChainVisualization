from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
from server.provider_factory import ProviderFactory
from server.logger import server_logger

app = FastAPI()
app.mount("/public", StaticFiles(directory="public"), name="public")

provider = None

@app.on_event("startup")
async def startup_event():
    global provider
    provider = await ProviderFactory.create_from_config()
    if provider:
        # Запускаем провайдер в фоновом режиме
        asyncio.create_task(provider.start())

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
        
        while True:
            try:
                if provider:
                    data = await provider.generate_data()
                    if data:  # Проверяем, что данные существуют
                        server_logger.debug(f"Sending data: {data}")  # Добавляем логирование
                        await websocket.send_json(data)
                await asyncio.sleep(1.0 / 100)  # 100 Hz
            except Exception as e:
                server_logger.error(f"WebSocket error for client {client_id}: {str(e)}")
                break

    except Exception as e:
        server_logger.error(f"Error handling WebSocket connection {client_id}: {str(e)}")
        
    finally:
        server_logger.info(f"WebSocket connection closed: {client_id}")