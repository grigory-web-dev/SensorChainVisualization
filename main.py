from src.config import ServerConfig

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.server:app",  # Теперь ссылаемся на созданное приложение
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        reload=ServerConfig.RELOAD,
    )
