/**
 * @file script.js
 * @brief Handles WebSocket communication, UI updates, and charting for the indoor bike dashboard.
 */


/**
 * @brief Establishes a WebSocket connection to the server.
 */
const ws = new WebSocket("ws://192.168.0.88:8000/websocket");

/* Global variables */
let bikeChart; // Declare the chart globally so it can be updated later
var dataPoints = [];
var timelabels = [];
var resistancePoints = []; // Add resistancePoints array
var powerPoints = []; // Add powerPoints array
var speedPoints = []; // Add speedPoints array
var rpmPoints = []; // Add rpmPoints array


/**
 * @brief Initializes the heartrate card UI element.
 */
function initHeartrateCard() {
    const clientsContainer = document.getElementById("clients-container");

    heartrateCard = document.createElement("div");
    heartrateCard.classList.add("card");
    heartrateCard.id = "heartrate-card";

    const lanSymbol = document.createElement("span");
    lanSymbol.classList.add("material-icons-outlined");
    lanSymbol.textContent = "favorite"; // Heart icon
    lanSymbol.id = "heart-icon"; // Add an ID for the heart icon

    const heartrateText = document.createElement("p");
    heartrateText.classList.add("uid");
    heartrateText.id = "heartrate-value";
    heartrateText.textContent = `Heartrate: 0 bpm`;

    heartrateCard.appendChild(lanSymbol);
    heartrateCard.appendChild(heartrateText);

    clientsContainer.appendChild(heartrateCard);
}

/**
 * @brief Initializes the resistance card UI element.
 */
function initResistanceCard() {
    const clientsContainer = document.getElementById("clients-container");

    resistanceCard = document.createElement("div");
    resistanceCard.classList.add("card");
    resistanceCard.id = "resistance-card";

    const resistanceIcon = document.createElement("span");
    resistanceIcon.classList.add("material-icons-outlined");
    resistanceIcon.textContent = "fitness_center"; // Icon for resistance
    resistanceIcon.id = "resistance-icon"; // Add an ID for the resistance icon

    const resistanceText = document.createElement("p");
    resistanceText.classList.add("uid");
    resistanceText.id = "resistance-value";
    resistanceText.textContent = `Resistance: 0`;

    resistanceCard.appendChild(resistanceIcon);
    resistanceCard.appendChild(resistanceText);

    clientsContainer.appendChild(resistanceCard);
}

/**
 * @brief Initializes the power card UI element.
 */
function initPowerCard() {
    const clientsContainer = document.getElementById("clients-container");

    powerCard = document.createElement("div");
    powerCard.classList.add("card");
    powerCard.id = "power-card";

    const powerIcon = document.createElement("span");
    powerIcon.classList.add("material-icons-outlined");
    powerIcon.textContent = "bolt"; // Icon for power
    powerIcon.id = "power-icon"; // Add an ID for the power icon

    const powerText = document.createElement("p");
    powerText.classList.add("uid");
    powerText.id = "power-value"; // Correct ID for the power value
    powerText.textContent = `Power: 0 W`;

    powerCard.appendChild(powerIcon);
    powerCard.appendChild(powerText);

    clientsContainer.appendChild(powerCard);
}

/**
 * @brief Initializes the speed card UI element.
 */
function initSpeedCard() {
    const clientsContainer = document.getElementById("clients-container");

    speedCard = document.createElement("div");
    speedCard.classList.add("card");
    speedCard.id = "speed-card";

    const speedIcon = document.createElement("span");
    speedIcon.classList.add("material-icons-outlined");
    speedIcon.textContent = "speed"; // Icon for speed
    speedIcon.id = "speed-icon"; // Add an ID for the speed icon

    const speedText = document.createElement("p");
    speedText.classList.add("uid");
    speedText.id = "speed-value"; // Correct ID for the speed value
    speedText.textContent = `Speed: 0 km/h`;

    speedCard.appendChild(speedIcon);
    speedCard.appendChild(speedText);

    clientsContainer.appendChild(speedCard);
}

/**
 * @brief Initializes the RPM card UI element.
 */
function initRpmCard() {
    const clientsContainer = document.getElementById("clients-container");

    rpmCard = document.createElement("div");
    rpmCard.classList.add("card");
    rpmCard.id = "rpm-card";

    const rpmIcon = document.createElement("span");
    rpmIcon.classList.add("material-icons-outlined");
    rpmIcon.textContent = "rotate_right"; // Icon for RPM
    rpmIcon.id = "rpm-icon"; // Add an ID for the RPM icon

    const rpmText = document.createElement("p");
    rpmText.classList.add("uid");
    rpmText.id = "rpm-value"; // Correct ID for the RPM value
    rpmText.textContent = `RPM: 0`;

    rpmCard.appendChild(rpmIcon);
    rpmCard.appendChild(rpmText);

    clientsContainer.appendChild(rpmCard);
}

/**
 * @brief Initializes the chart for displaying bike metrics.
 */
function initializeChart() {
    const ctx = document.getElementById('bike-Chart').getContext('2d');

    bikeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelabels, // X-axis labels (e.g., time or data points)
            datasets: [
                {
                    label: 'Heart Rate (bpm)',
                    data: dataPoints, // Y-axis data for heart rate
                    borderColor: 'rgba(255, 99, 132, 1)', // Line color for heart rate
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Fill color under the line
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5 // Smooth the line
                },
                {
                    label: 'Resistance',
                    data: resistancePoints, // Y-axis data for resistance
                    borderColor: 'rgba(54, 235, 117, 1)', // Line color for resistance
                    backgroundColor: 'rgba(54, 235, 117, 0.2)', // Fill color under the line
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5 // Smooth the line
                },
                {
                    label: 'Power',
                    data: powerPoints, // Y-axis data for resistance
                    borderColor: 'rgba(54, 66, 235, 1)', // Line color for resistance
                    backgroundColor: 'rgba(54, 66, 235, 0.2)', // Fill color under the line
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5 // Smooth the line
                },
                {
                    label: 'Speed',
                    data: speedPoints, // Y-axis data for speed
                    borderColor: 'rgba(255, 205, 86, 1)', // Line color for speed
                    backgroundColor: 'rgba(255, 205, 86, 0.2)', // Fill color under the line
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5 // Smooth the line
                },
                {
                    label: 'RPM',
                    data: rpmPoints, // Y-axis data for RPM
                    borderColor: 'rgba(153, 102, 255, 1)', // Line color for RPM
                    backgroundColor: 'rgba(153, 102, 255, 0.2)', // Fill color under the line
                    fill: true,
                    borderWidth: 2,
                    tension: 0.5 // Smooth the line
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (s)' // X-axis label
                    }
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 200, // Adjust based on expected heart rate and resistance range
                    title: {
                        display: true,
                        text: 'Values' // Y-axis label
                    }
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true // Enable zooming with the mouse wheel
                        },
                        pinch: {
                            enabled: true // Enable zooming with pinch gestures
                        },
                        mode: 'x' // Allow zooming on the X-axis only
                    },
                    pan: {
                        enabled: true, // Enable panning
                        mode: 'x', // Allow panning on the X-axis only
                        threshold: 10 // Minimal pan distance required before it starts
                    }
                }
            },
        }
    });
}

/**
 * @brief Handles incoming WebSocket messages.
 */
ws.onmessage = (event) => {
    try {
        // Parse the JSON string received from the server
        const data = JSON.parse(event.data);

        // Log the received data to the console
        console.log("Received JSON:", data);

        if (data.msgtype === "identification") {
            const response = {
                msgtype: "identification",
                action: "response",
                type: "webpage_client",
                uid: "wepage_client_001"
            };

            // Send the response as a JSON string
            ws.send(JSON.stringify(response));
            console.log("Sent response:", response);
        }
        else if (data.msgtype === "notification") {
            console.log("Command received:", data.command);
        }
        else if (data.msgtype === "indoor_bike_data") {
            console.log("Indoor bike data received:", data);

            // Update or create the heartrate card
            const heartrate = data.data?.heartrate;
            updateHeartrateCard(heartrate);

            // Update or create the resistance card
            const resistance = data.data?.resistance;
            updateResistanceCard(resistance);

            // Update or create the power card
            const power = data.data?.power;
            updatePowerCard(power);

            // Update or create the speed card
            const speed = data.data?.speed;
            updateSpeedCard(speed);

            // Update or create the RPM card
            const rpm = data.data?.rpm;
            updateRpmCard(rpm);

            updateChart(data.data);
        }

    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }
};

/**
 * @brief Updates the heartrate card UI element.
 */
function updateHeartrateCard(heartrate) {
    const clientsContainer = document.getElementById("clients-container");

    // Check if the heartrate card already exists
    let heartrateCard = document.getElementById("heartrate-card");

    // Update the heartrate value if the card already exists
    const heartrateText = document.getElementById("heartrate-value");
    heartrateText.textContent = `Heartrate: ${heartrate} bpm`;

    // Add or remove the pulsating effect based on the heartrate value
    const heartIcon = document.getElementById("heart-icon");
    if (heartrate > 0) {
        heartIcon.classList.add("pulsating");
    } else {
        heartIcon.classList.remove("pulsating");
    }
}

/**
 * @brief Updates the resistance card UI element.
 */
function updateResistanceCard(resistance) {
    const clientsContainer = document.getElementById("clients-container");

    // Check if the resistance card already exists
    let resistanceCard = document.getElementById("resistance-card");

    // Update the resistance value if the card already exists
    const resistanceText = document.getElementById("resistance-value");
    resistanceText.textContent = `Resistance: ${resistance}`;
    
}

/**
 * @brief Updates the power card UI element.
 */
function updatePowerCard(power) {
    const clientsContainer = document.getElementById("clients-container");

    // Check if the power card already exists
    let powerCard = document.getElementById("power-card");

    // Update the power value if the card already exists
    const powerText = document.getElementById("power-value");
    powerText.textContent = `Power: ${power} W`;
}

/**
 * @brief Updates the speed card UI element.
 */
function updateSpeedCard(speed) {
    const clientsContainer = document.getElementById("clients-container");

    // Check if the speed card already exists
    let speedCard = document.getElementById("speed-card");

    // Update the speed value if the card already exists
    const speedText = document.getElementById("speed-value");
    speedText.textContent = `Speed: ${speed} km/h`;
    
}

/**
 * @brief Updates the RPM card UI element.
 */
function updateRpmCard(rpm) {
    const clientsContainer = document.getElementById("clients-container");

    // Check if the RPM card already exists
    let rpmCard = document.getElementById("rpm-card");

    // Update the RPM value if the card already exists
    const rpmText = document.getElementById("rpm-value");
    rpmText.textContent = `RPM: ${rpm}`;

}

/**
 * @brief Updates the chart with the latest bike data.
 */
function updateChart(data) {
    console.log("Updating chart with data:", data);

    if (!bikeChart) {
        console.error("Chart is not initialized.");
        return;
    }

    const heartrate = data.heartrate; // Extract the heart rate from the data
    const resistance = data.resistance; // Extract the resistance from the data
    const power = data.power; // Extract the power from the data
    const speed = data.speed; // Extract the speed from the data
    const rpm = data.rpm; // Extract the RPM from the data
    const timestamp = new Date().toLocaleTimeString(); // Use the current time as the X-axis label

    timelabels.push(timestamp);
    dataPoints.push(heartrate);
    powerPoints.push(power); // Add power data
    resistancePoints.push(resistance); // Add resistance data
    speedPoints.push(speed); // Add speed data
    rpmPoints.push(rpm); // Add RPM data

    if (timelabels.length > 200) {
        timelabels.shift();
        dataPoints.shift();
        resistancePoints.shift();
        powerPoints.shift();
        speedPoints.shift(); // Remove the oldest speed data
        rpmPoints.shift(); // Remove the oldest RPM data
    }

    bikeChart.update('none'); // Update the chart without animation
}

/**
 * @brief Fetches the list of connected clients from the server.
 */
async function getClients() {
    try {
        // Make a GET request to the REST endpoint
        const response = await fetch("/api/clients/get", { method: "GET" });

        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Log the received data to the console
        console.log("Clients list received:", data);

        // Get the LAN symbol element
        const lanSymbol = document.getElementById("lan-symbol");

        data.clients.forEach(client => {
            const position = client.uid.indexOf(':');
            if (position !== -1) {
                client.uid = client.uid.slice(position + 1);
            }
        });

        // Check if "MockIndoorBike" is in the clients list
        const isConnected = data.clients.some(client => client.uid === "iConsole+0141");

        if (isConnected) {
            // Turn the LAN symbol green
            lanSymbol.style.color = "#4caf50"; // Green color
        } else {
            // Keep the LAN symbol grey
            lanSymbol.style.color = "#9799ab"; // Grey color
        }
    } catch (error) {
        console.error("Failed to fetch clients list:", error);

        // If there's an error, ensure the LAN symbol remains grey
        const lanSymbol = document.getElementById("lan-symbol");
        lanSymbol.style.color = "#9799ab"; // Grey color
    }
}

getClients();
initHeartrateCard();
initResistanceCard();
initPowerCard();
initRpmCard();
initSpeedCard();
initializeChart();

setInterval(getClients, 1000);