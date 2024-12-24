''' server scrip for the websocket server '''
from typing import Set, Dict, Any
from datetime import datetime
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.provider_factory import ProviderFactory
from server.logger import server_logger

active_connections: Set[WebSocket] = set()
connection_stats: Dict[str, Dict] = {}

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    '''WebSocket endpoint for handling client connections'''
    await websocket.accept()
    client_id = str(id(websocket))
    active_connections.add(websocket)

    connection_stats[client_id] = {
        'connected_at': datetime.now(),
        'messages_sent': 0,
        'last_error': None
    }

    server_logger.info(f"New WebSocket connection: {client_id}")

    # Создаем отдельный экземпляр провайдера для каждого соединения
    provider = await ProviderFactory.create_from_config()
    if not provider:
        server_logger.error(f"Failed to create provider for client {client_id}")
        await cleanup_connection(websocket)
        return

    async def send_data(data: Any):
        """Callback функция для отправки данных через websocket"""
        try:
            await websocket.send_json(data)
            connection_stats[client_id]['messages_sent'] += 1
        except Exception as e:
            server_logger.error(f"Error sending data to client {client_id}: {str(e)}", exc_info=True)  # добавляем exc_info=True
            raise

    try:
        # Запускаем провайдер с функцией отправки данных
        await provider.start(send_data)
        # Ждем пока соединение не закроется
        while True:
            try:
                # Просто проверяем что соединение живо
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                break
    except Exception as e:
        server_logger.error(f"Error in WebSocket connection {client_id}: {str(e)}", exc_info=True)
    finally:
        await provider.stop()
        await cleanup_connection(websocket)


app.mount("/css", StaticFiles(directory="public/css"), name="css")
app.mount("/js", StaticFiles(directory="public/js"), name="js")

@app.get("/")
async def get_index():
    '''Отдача главной страницы'''
    file_path = "public/index.html"
    server_logger.info(f"Serving index page from {os.path.abspath(file_path)}")
    if not os.path.exists(file_path):
        server_logger.error(f"File not found: {file_path}")
        return {"error": "Index file not found"}
    return FileResponse(file_path)

async def cleanup_connection(websocket: WebSocket):
    '''Очистка при отключении клиента'''
    if websocket in active_connections:
        active_connections.remove(websocket)
        client_id = str(id(websocket))
        if client_id in connection_stats:
            stats = connection_stats[client_id]
            duration = (datetime.now() - stats['connected_at']).total_seconds()
            server_logger.info(
                f"Client {client_id} disconnected. "
                f"Connection duration: {duration:.2f}s, "
                f"Messages sent: {stats['messages_sent']}"
            )
            del connection_stats[client_id]

@app.get("/status")
async def get_status():
    '''    Получение статуса сервера и соединений     '''
    return {
        "active_connections": len(active_connections),
        "provider_status": "running" if active_connections else "stopped",
        "connection_stats": connection_stats
    }
