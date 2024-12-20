# main.py
from src.config import ServerConfig

if __name__ == "__main__":
    import uvicorn
    config = ServerConfig()
    uvicorn.run(
        "src.server:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD,
    )
