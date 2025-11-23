/**
 * @file script.js
 * @brief Handles WebSocket communication, UI updates, and charting for the indoor bike dashboard.
 */

const ws = new WebSocket("ws://192.168.0.32:8000/websocket");

/* Global variables */
let bikeChart;
const dataPoints = [], timelabels = [], resistancePoints = [], powerPoints = [], speedPoints = [], rpmPoints = [];

let hrTrainingActive = false; // State for HR training
let nextDataCalc = 0;
let intervalChart; // Declare intervalChart variable
let stepChart;
let stepPoints = [];

// Card configuration
const cardConfigs = [
    { id: "heartrate-card", icon: "favorite", iconId: "heart-icon", valueId: "heartrate-value", label: "Heartrate", unit: "bpm", class: "pulsating" },
    { id: "resistance-card", icon: "fitness_center", iconId: "resistance-icon", valueId: "resistance-value", label: "Resistance", unit: "" },
    { id: "power-card", icon: "bolt", iconId: "power-icon", valueId: "power-value", label: "Power", unit: "W" },
    { id: "speed-card", icon: "speed", iconId: "speed-icon", valueId: "speed-value", label: "Speed", unit: "km/h" },
    { id: "rpm-card", icon: "rotate_right", iconId: "rpm-icon", valueId: "rpm-value", label: "RPM", unit: "" },
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

    // Add clickable card for HR based training in its own grid
    const trainingContainer = document.getElementById("training-container");
    if (trainingContainer) {
        // HR Training Card
        const hrCard = document.createElement("div");
        hrCard.classList.add("card");
        hrCard.id = "hr-training-card";
        hrCard.style.cursor = "pointer";
        // State for toggling

        const icon = document.createElement("span");
        icon.classList.add("material-icons-outlined");
        icon.textContent = "play_arrow";
        icon.style.fontSize = "32px";
        icon.style.color = "#24ec60";

        const text = document.createElement("p");
        text.classList.add("uid");
        text.textContent = "Start HR based training";

        hrCard.appendChild(icon);
        hrCard.appendChild(text);
        // Set initial border color (green)
        hrCard.style.borderLeft = "7px solid #24ec60";
        trainingContainer.appendChild(hrCard);

        hrCard.onclick = () => handleHrCardClick(icon, text, hrCard, limitInput);

        // HR Upper Limit Card
        const hrLimitCard = document.createElement("div");
        hrLimitCard.classList.add("card");
        hrLimitCard.id = "hr-limit-card";
        hrLimitCard.style.display = "flex";
        hrLimitCard.style.flexDirection = "column";
        hrLimitCard.style.alignItems = "center";
        hrLimitCard.style.justifyContent = "center";

        const limitLabel = document.createElement("p");
        limitLabel.classList.add("uid");
        limitLabel.textContent = "Upper HR Limit";
        limitLabel.setAttribute("for", "hr-limit-input");
        limitLabel.style.marginBottom = "8px";

        const limitInput = document.createElement("input");
        limitInput.type = "number";
        limitInput.id = "hr-limit-input";
        limitInput.min = "90";
        limitInput.max = "180";
        limitInput.value = "140";
        limitInput.style.width = "70px";
        limitInput.style.textAlign = "center";
        limitInput.style.padding = "4px";
        limitInput.style.borderRadius = "4px";
        limitInput.style.border = "1px solid #d2d2d3";

        hrLimitCard.appendChild(limitLabel);
        hrLimitCard.appendChild(limitInput);
        trainingContainer.appendChild(hrLimitCard);
    }
}

function handleHrCardClick(icon, text, hrCard, limitInput) {
    hrTrainingActive = !hrTrainingActive;
    if (hrTrainingActive) {
        icon.textContent = "stop";
        icon.style.color = "#cc3c43";
        text.textContent = "Stop HR based training";
        hrCard.style.borderLeft = "7px solid #cc3c43";
        limitInput.disabled = true;
        limitInput.style.backgroundColor = "#f0f0f0";
        plotCalcNextDataInterval();
    } else {
        icon.textContent = "play_arrow";
        icon.style.color = "#24ec60";
        text.textContent = "Start HR based training";
        hrCard.style.borderLeft = "7px solid #24ec60";
        limitInput.disabled = false;
        limitInput.style.backgroundColor = "#fff";
    }
}

function calcNextDataInterval(heartrate, hr_min, limit, inverse = false) {
    const t_min = 5000;   // interval at hr_min
    const t_max = 30000;  // interval at limit
    t = 0.0;

    // Clamp heartrate to [hr_min, limit]
    const hr = Math.max(hr_min, Math.min(heartrate, limit));
    const norm = (hr - hr_min) / (limit - hr_min); // 0...1

    // Exponential interpolation
    if (inverse)
    {
        t = t_max * Math.pow(t_min / t_max, norm);
    }
    else {
        t = t_min * Math.pow(t_max / t_min, norm);
    }

    return Math.round(t);
}


async function startHrBasedTraining() {
    
    currentDatacalc = Date.now() // Get current timestamp

    if((currentDatacalc >= nextDataCalc) && hrTrainingActive)
    {
        // Save timestamp of current data calculation

        // Get heartrate and rpm from the DOM
        const heartrateText = document.getElementById("heartrate-value").textContent;
        const resisText = document.getElementById("resistance-value").textContent;
        const limitText = document.getElementById("hr-limit-input").value;

        // Extract the numeric value using a regular expression
        const heartrate = parseInt(heartrateText.match(/\d+/));
        resistance = parseInt(resisText.match(/\d+/));
        const limit = parseInt(limitText);

        console.log("HR based training running. Limit:", limit, "HR:", heartrate, "Resistance:", resistance);

        if ((heartrate <= limit) && (heartrate != 0))
        {
            if (resistance <= 32)
            {
                resistance++;
            }
            nextDataCalc = currentDatacalc + calcNextDataInterval(heartrate, 70, limit, false);
        }
        else if (heartrate != 0)
        {
            if (resistance >= 1)
            {
                resistance--;
            }

            nextDataCalc = currentDatacalc + calcNextDataInterval(heartrate, 70, limit, true);
        }

        // Send new resistance to device via WebSocket
        ws.send(JSON.stringify({
            msgtype: "indoor_bike_control",
            uid: "wepage_client_001",
            tuid: "iConsole+0141",
            action: "setresistance",
            resistance: resistance
        }));

    }
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
            updateHrPoint(d.heartrate);
            updateCardValue("resistance", d.resistance);
            updateCardValue("power", d.power);
            updateCardValue("speed", d.speed);
            updateCardValue("rpm", d.rpm);
            updateChart(d);

            startHrBasedTraining();

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

    if (timelabels.length > 60) {
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

function plotCalcNextDataInterval() {
    const hr_min = 70;
    const hrs = [];
    let intervals = [];
    let inverseIntervals = [];
    const limit = parseInt(document.getElementById("hr-limit-input").value);
    const canvas = document.getElementById('interval-plot');
    const currentHeartrate = parseInt(document.getElementById("heartrate-value").textContent.match(/\d+/));
    const yMin = 0; // or your actual min interval (in seconds)
    const yMax = 40; // or your actual max interval (in seconds)

    for (let hr = hr_min; hr <= limit; hr += 1) {
        hrs.push(hr);
        intervals.push(calcNextDataInterval(hr, hr_min, limit, false));
        inverseIntervals.push(calcNextDataInterval(hr, hr_min, limit, true));
    }

    intervals = intervals.map(i => i / 1000);        // Convert to seconds
    inverseIntervals = inverseIntervals.map(i => i / 1000);

    // Prepare current HR point dataset
    const hrPoint = {
        label: 'Current HR',
        data: [{ x: currentHeartrate, y: 1 }],
        borderColor: 'black',
        pointRadius: 8,
        pointStyle: 'triangle',
        type: 'scatter',
        showLine: false,
        order: 0
    };

    // Destroy previous chart if it exists
    if (intervalChart) {
        intervalChart.destroy();
    }

    intervalChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: hrs,
            datasets: [
                {
                    label: 'Update interval vs Heartrate',
                    data: intervals,
                    borderColor: 'rgba(255,99,132,1)',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5
                },
                {
                    label: 'Inverse interval vs Heartrate',
                    data: inverseIntervals,
                    borderColor: 'rgba(54,235,117,1)',
                    backgroundColor: 'rgba(54,235,117,0.2)',
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5
                },
                hrPoint // <-- Use the point instead of the vertical line
            ]
        },
        options: {
            responsive: false,
            scales: {
                x: { title: { display: true, text: 'Heartrate (bpm)' }, min: hr_min, max: limit },
                y: { title: { display: true, text: 'Interval (s)' }, min: yMin, max: yMax }
            }
        }
    });
}

// Initialize the step chart
function plotStepChart() {
    const label_min = 0;
    const label_max = 600;
    const seconds = [];
    
    for (let sec = label_min; sec <= label_max; sec += 1) {
        seconds.push(sec);
    }

    // Destroy previous chart if it exists
    if (stepChart) {
        stepChart.destroy();
    }

    const canvas = document.getElementById('step-plot');
    stepChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: seconds,
            datasets: [
                {
                    label: 'Step Function',
                    data: stepPoints,
                    borderColor: 'rgba(0,0,0,1)',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    fill: false,
                    borderWidth: 2,
                    stepped: true,
                    pointRadius: 4,
                    showLine: true,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: false,
            scales: {
                x: { title: { display: true, text: 'Seconds' } },
                y: { title: { display: true, text: 'Step Value' },
                    min: 1,
                    max: 32,}
            }
        }
    });

    // Add click handler for interactive step adding
    canvas.onclick = function(evt) {
        if (!stepChart) return;
        const rect = canvas.getBoundingClientRect();
        const xPixel = evt.clientX - rect.left;
        const yPixel = evt.clientY - rect.top;
        const xValue = stepChart.scales.x.getValueForPixel(xPixel);
        const yValue = stepChart.scales.y.getValueForPixel(yPixel);

        // Snap x to nearest integer (heartrate)
        const x = Math.round(xValue);
        // Snap y to nearest 0.5
        const y = Math.max(1, Math.min(32, Math.round(yValue)));

        // Add a new step point
        stepPoints.push({x, y});
        // Sort by x to keep the step function correct
        stepPoints.sort((a, b) => a.x - b.x);

        // Update chart
        stepChart.data.datasets[0].data = stepPoints;
        stepChart.update();
    };
}

function updateHrPoint(newHr) {
    if (!intervalChart) return;
    // Find the HR point dataset (by label or index)
    const hrDataset = intervalChart.data.datasets.find(ds => ds.label === 'Current HR');
    if (!hrDataset) return;
    // Update the data
    hrDataset.data = [{ x: newHr, y: 1 }];
    intervalChart.update('none'); // 'none' for no animation, or remove for default
}


// Initialize everything
getClients();
initCards();
initializeChart();
setInterval(getClients, 1000);
//plotStepChart();
plotCalcNextDataInterval();