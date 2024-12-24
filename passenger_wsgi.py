import os
import sys

# Добавляем пути к зависимостям
VENDOR_DIR = os.path.join(os.path.dirname(__file__), 'vendor')
PROJECT_DIR = os.path.dirname(__file__)
sys.path.insert(0, VENDOR_DIR)
sys.path.insert(0, PROJECT_DIR)

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/test")
def test():
    return {"status": "OK"}

# Создаем WSGI приложение
from fastapi.applications import FastAPI
from fastapi.responses import JSONResponse

def application(environ, start_response):
    path = environ.get('PATH_INFO', '').lstrip('/')
    
    if path == '' or path == '/':
        response = JSONResponse(content={"message": "Hello World"})
    elif path == 'test':
        response = JSONResponse(content={"status": "OK"})
    else:
        response = JSONResponse(content={"error": "Not Found"}, status_code=404)

    status = f"{response.status_code} {response.status_code}"
    response_headers = [('Content-type', 'application/json')]
    start_response(status, response_headers)
    
    return [response.body]
