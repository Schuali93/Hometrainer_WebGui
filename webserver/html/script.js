/**
 * @file script.js
 * @brief Handles WebSocket communication, UI updates, and charting for the indoor bike dashboard.
 */

const ws = new WebSocket("ws://192.168.0.88:8000/websocket");

/* Global variables */
let bikeChart;
const dataPoints = [], timelabels = [], resistancePoints = [], powerPoints = [], speedPoints = [], rpmPoints = [];

// Card configuration
const cardConfigs = [
    { id: "heartrate-card", icon: "favorite", iconId: "heart-icon", valueId: "heartrate-value", label: "Heartrate", unit: "bpm", class: "pulsating" },
    { id: "resistance-card", icon: "fitness_center", iconId: "resistance-icon", valueId: "resistance-value", label: "Resistance", unit: "" },
    { id: "power-card", icon: "bolt", iconId: "power-icon", valueId: "power-value", label: "Power", unit: "W" },
    { id: "speed-card", icon: "speed", iconId: "speed-icon", valueId: "speed-value", label: "Speed", unit: "km/h" },
    { id: "rpm-card", icon: "rotate_right", iconId: "rpm-icon", valueId: "rpm-value", label: "RPM", unit: "" }
];

// Initialize all cards
function initCards() {
    const clientsContainer = document.getElementById("clients-container");
    cardConfigs.forEach(cfg => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.id = cfg.id;

        const icon = document.createElement("span");
        icon.classList.add("material-icons-outlined");
        icon.textContent = cfg.icon;
        icon.id = cfg.iconId;

        const valueText = document.createElement("p");
        valueText.classList.add("uid");
        valueText.id = cfg.valueId;
        valueText.textContent = `${cfg.label}: 0${cfg.unit ? " " + cfg.unit : ""}`;

        card.appendChild(icon);
        card.appendChild(valueText);
        clientsContainer.appendChild(card);
    });
}

// Update card values
function updateCardValue(type, value) {
    const cfg = cardConfigs.find(c => c.label.toLowerCase() === type);
    if (!cfg) return;
    const valueText = document.getElementById(cfg.valueId);
    if (valueText) valueText.textContent = `${cfg.label}: ${value}${cfg.unit ? " " + cfg.unit : ""}`;
    // Special effect for heartrate
    if (type === "heartrate") {
        const heartIcon = document.getElementById(cfg.iconId);
        if (heartIcon) {
            if (value > 0) heartIcon.classList.add(cfg.class);
            else heartIcon.classList.remove(cfg.class);
        }
    }
}

/**
 * @brief Initializes the chart for displaying bike metrics.
 */
function initializeChart() {
    const ctx = document.getElementById('bike-Chart').getContext('2d');
    bikeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelabels,
            datasets: [
                { label: 'Heart Rate (bpm)', data: dataPoints, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)', fill: true, borderWidth: 2, tension: 0.5 },
                { label: 'Resistance', data: resistancePoints, borderColor: 'rgba(54,235,117,1)', backgroundColor: 'rgba(54,235,117,0.2)', fill: true, borderWidth: 2, tension: 0.5 },
                { label: 'Power', data: powerPoints, borderColor: 'rgba(54,66,235,1)', backgroundColor: 'rgba(54,66,235,0.2)', fill: true, borderWidth: 2, tension: 0.5 },
                { label: 'Speed', data: speedPoints, borderColor: 'rgba(255,205,86,1)', backgroundColor: 'rgba(255,205,86,0.2)', fill: true, borderWidth: 2, tension: 0.5 },
                { label: 'RPM', data: rpmPoints, borderColor: 'rgba(153,102,255,1)', backgroundColor: 'rgba(153,102,255,0.2)', fill: true, borderWidth: 2, tension: 0.5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Time (s)' } },
                y: { beginAtZero: true, min: 0, max: 200, title: { display: true, text: 'Values' } }
            },
            plugins: {
                zoom: {
                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                    pan: { enabled: true, mode: 'x', threshold: 10 }
                }
            }
        }
    });
}

/**
 * @brief Handles incoming WebSocket messages.
 */
ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.msgtype === "identification") {
            ws.send(JSON.stringify({
                msgtype: "identification",
                action: "response",
                type: "webpage_client",
                uid: "wepage_client_001"
            }));
        } else if (data.msgtype === "notification") {
            console.log("Command received:", data.command);
        } else if (data.msgtype === "indoor_bike_data") {
            const d = data.data || {};
            updateCardValue("heartrate", d.heartrate);
            updateCardValue("resistance", d.resistance);
            updateCardValue("power", d.power);
            updateCardValue("speed", d.speed);
            updateCardValue("rpm", d.rpm);
            updateChart(d);
        }
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
};

/**
 * @brief Updates the chart with the latest bike data.
 */
function updateChart(data) {
    if (!bikeChart) return;
    const { heartrate, resistance, power, speed, rpm } = data;
    const timestamp = new Date().toLocaleTimeString();
    timelabels.push(timestamp);
    dataPoints.push(heartrate);
    resistancePoints.push(resistance);
    powerPoints.push(power);
    speedPoints.push(speed);
    rpmPoints.push(rpm);

    if (timelabels.length > 200) {
        timelabels.shift();
        dataPoints.shift();
        resistancePoints.shift();
        powerPoints.shift();
        speedPoints.shift();
        rpmPoints.shift();
    }
    bikeChart.update('none');
}

/**
 * @brief Fetches the list of connected clients from the server.
 */
async function getClients() {
    try {
        const response = await fetch("/api/clients/get", { method: "GET" });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const lanSymbol = document.getElementById("lan-symbol");
        const sensorSymbol = document.getElementById("sensor-symbol");

        data.clients.forEach(client => {
            const position = client.uid.indexOf(':');
            if (position !== -1) client.uid = client.uid.slice(position + 1);
        });

        lanSymbol.style.color = data.clients.some(c => c.uid === "iConsole+0141") ? "#4caf50" : "#9799ab";
        sensorSymbol.style.color = data.clients.some(c => c.uid === "esp32c6_power") ? "#4caf50" : "#9799ab";
    } catch (error) {
        console.error("Failed to fetch clients list:", error);
        document.getElementById("lan-symbol").style.color = "#9799ab";
    }
}

// Initialize everything
getClients();
initCards();
initializeChart();
setInterval(getClients, 1000);