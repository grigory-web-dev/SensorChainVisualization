import json
from pathlib import Path
import uvicorn

if __name__ == "__main__":
    # Загружаем конфигурацию
    config_path = Path("server/config.json")
    if not config_path.exists():
        print("Error: config.json not found")
        exit(1)

    with open(config_path) as f:
        config = json.load(f)

    # Запускаем сервер
    server_config = config["server"]
    uvicorn.run(
        "server.server:app",
        host=server_config["host"],
        port=server_config["port"],
        reload=server_config["reload"],


        
        log_level="info"
    )
