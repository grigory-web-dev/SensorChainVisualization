# Sensor Chain Visualization

## Обзор проекта
Визуализация положения пластин с датчиками ускорения и угла в трехмерном пространстве. Проект включает физическое моделирование движения пластин на сервере и интерактивную визуализацию в браузере.

### Основные компоненты
- **Физическая модель**: расчет движения пластин
- **Серверная часть**: обработка данных и передача на клиент через WebSocket
- **3D-визуализация**: отображение движения пластин с интерактивным управлением

### Текущая функциональность
- **Сервер:**
  - Расчет физики движения пластин
  - Обработка WebSocket соединений
  - Синхронизация данных с клиентом
- **Визуализация:**
  - Three.js рендеринг
  - Система координат в виде куба с положительными значениями
  - Орбитальное управление камерой
  - Интерактивное позиционирование визуализации
  - Отображение пластин с размерами и углами

---

## Руководство пользователя

### Системные требования
- Современный веб-браузер с поддержкой WebGL и WebSocket
- Подключение к интернету (для загрузки Three.js)
- Сервер с Python 3.10+ (для серверной части)

### Управление интерфейсом

#### Камера
- Вращение: левая кнопка мыши
- Приближение/отдаление: колесико мыши
- Перемещение: правая кнопка мыши

#### Позиционирование визуализации
- SHIFT + левая кнопка мыши: перемещение в горизонтальной плоскости
- SHIFT + правая кнопка мыши: вертикальное перемещение
- CTRL + левая кнопка мыши: вращение визуализации

---

## Руководство разработчика

### Структура проекта
```
SensorSnake_Meta/
├── main.py                # Точка входа
├── requirements.txt       # Зависимости Python
├── src/                   # Серверная часть
│   ├── config.py          # Конфигурации
│   ├── logger.py          # Логирование
│   ├── models/            # Модели данных
│   ├── physics.py         # Физическая обработка
│   ├── simulation/        # Симуляция движения
│   ├── server.py          # Веб-сервер
│   └── utils/             # Утилиты
├── public/                # Клиентская часть
│   ├── index.html         # HTML страница
│   ├── css/               # Стили
│   └── js/                # Скрипты
│       ├── main.js        # Основная логика
│       ├── plates.js      # Управление пластинами
│       └── scene.js       # Three.js сцена
└── logs/                  # Логи выполнения
```

### Зависимости

#### Python пакеты
- fastapi==0.115.6 - веб-фреймворк
- uvicorn==0.34.0 - ASGI сервер
- numpy==2.2.0 - вычисления
- websockets==14.1 - WebSocket соединения
- pydantic==2.10.3 - валидация данных

#### JavaScript библиотеки
- Three.js (0.158.0) - 3D графика
- OrbitControls - управление камерой
- OutlineEffect - визуальные эффекты

### Установка

#### Локальная разработка

##### Windows
```batch
:: install.bat
@echo off
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
mkdir logs
echo Installation complete
```

##### Linux/Mac
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p logs
```

#### Установка локальных зависимостей:

   ```bash
   # Создаем директорию для зависимостей если её нет
   mkdir -p vendor

   # Устанавливаем зависимости локально
   python -m pip install --target=./vendor -r requirements.txt
   ```

#### Запуск для разработки
1. Активируйте виртуальное окружение
2. Запустите сервер:
   ```bash
   python main.py
   ```
3. Откройте http://localhost:8000

#### Установка на Passenger WSGI

1. Создание структуры:
   ```
   project_root/
   ├── vendor/          # Зависимости
   ├── logs/            # Логи
   ├── public/          # Статика
   └── src/             # Код
   ```

2. Установка зависимостей:
   ```bash
   python3 -m pip install --target=/path/to/project/vendor -r requirements.txt
   ```

3. Создание passenger_wsgi.py:
   ```python
   import sys, os
   VENDOR_DIR = os.path.join(os.path.dirname(__file__), 'vendor')
   PROJECT_DIR = os.path.dirname(__file__)
   sys.path.insert(0, VENDOR_DIR)
   sys.path.insert(0, PROJECT_DIR)
   from src.server import app as application
   ```

4. Настройка прав:
   ```bash
   chmod 755 passenger_wsgi.py
   chmod -R 755 vendor
   chmod -R 777 logs
   ```

### Конфигурация
1. config.py - настройки сервера и симуляции
2. logger.py - настройки логирования
3. passenger_wsgi.py - настройки развертывания

### Разработка

#### Архитектура

Серверная часть:
- FastAPI веб-сервер
- WebSocket коммуникация
- Физическое моделирование
- Система логирования

Клиентская часть:
- Three.js визуализация
- WebSocket клиент
- Модульная структура

#### Ключевые компоненты

1. server.py:
   - HTTP и WebSocket обработка
   - Статические файлы
   - Состояние сервера

2. simulation/:
   - Физическая модель
   - IMU данные
   - Обновление состояния

3. public/js/:
   - 3D рендеринг
   - Управление камерой
   - Обработка данных

### Отладка

#### Логирование
- data.log - данные датчиков
- console - системные события
- WebSocket отладка: `wscat -c ws://localhost:8000/ws`

#### Мониторинг
- Chrome DevTools (клиент)
- Python профилирование (сервер)

### Решение проблем

#### Статические файлы
- Проверить пути в index.html
- Проверить права доступа
- Проверить конфигурацию сервера

#### WebSocket
- Проверить порты и firewall
- Проверить настройки Passenger
- Проверить конфигурацию сервера

#### Зависимости
- Проверить версии пакетов
- Проверить пути в passenger_wsgi.py
- Проверить права доступа

### Дополнительная информация

#### Документация
- [Three.js](https://threejs.org/docs/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket)

#### Контакты
- Email: grigorywebdev@gmail.com
- GitHub: [\[ссылка на репозиторий\]](https://github.com/grigory-web-dev/SensorChainVisualization)
