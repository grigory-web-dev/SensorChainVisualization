const svg = d3.select("#simulation");
const width = +svg.attr("width");
const height = +svg.attr("height");
const statusDiv = document.getElementById("status");
const SCALE = 100; // Масштаб для перевода метров в пиксели

// Добавляем поверхность "стола"
const groundY = height - 100;
svg.append("line")
    .attr("class", "ground")
    .attr("x1", 0)
    .attr("y1", groundY)
    .attr("x2", width)
    .attr("y2", groundY);

// Создаём группу для пластин
const platesGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${groundY})`);

function updatePlates(data) {
    // Обновляем статус соединения
    statusDiv.textContent = "Статус: подключено";

    // Обновляем пластины
    const plates = platesGroup.selectAll("line.plate")
        .data(data.positions.slice(0, -1));  // Берём все точки кроме последней

    // Удаляем лишние пластины
    plates.exit().remove();

    // Обновляем существующие пластины
    plates
        .attr("x1", d => d[0] * SCALE)
        .attr("y1", d => -d[1] * SCALE)  // Инвертируем Y для SVG координат
        .attr("x2", (d, i) => data.positions[i + 1][0] * SCALE)
        .attr("y2", (d, i) => -data.positions[i + 1][1] * SCALE);

    // Добавляем новые пластины
    plates.enter()
        .append("line")
        .attr("class", "plate")
        .attr("x1", d => d[0] * SCALE)
        .attr("y1", d => -d[1] * SCALE)
        .attr("x2", (d, i) => data.positions[i + 1][0] * SCALE)
        .attr("y2", (d, i) => -data.positions[i + 1][1] * SCALE);
}

// Подключаемся к WebSocket
const ws = new WebSocket(`ws://${window.location.host}/ws`);

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    updatePlates(data);
};

ws.onclose = function () {
    statusDiv.textContent = "Статус: отключено";
};

ws.onerror = function () {
    statusDiv.textContent = "Статус: ошибка подключения";
};
