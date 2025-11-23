# Hometrainer WebGui

A real-time web-based dashboard for monitoring indoor bike/hometrainer metrics. This project connects to fitness equipment via Bluetooth Low Energy (BLE), streams data through a WebSocket server, displays real-time performance metrics in an interactive web interface, and can broadcast data to cycling apps via a BLE Cycling Power Service.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Real-time BLE connectivity** - Connects to fitness equipment supporting the Fitness Machine Service (FTMS) protocol
- **Live metrics display** - Monitor speed, RPM, power, resistance, heartrate, distance, and calories
- **Interactive charts** - Visualize performance data over time with Chart.js
- **WebSocket communication** - Low-latency data streaming between device and web interface
- **Responsive UI** - Clean, modern dashboard with Material Design icons
- **Multi-client support** - Handle multiple connected devices simultaneously
- **Resistance control** - Adjust bike resistance remotely through the interface
- **Heart rate-based training** - Automatic resistance adjustment to keep heart rate below a configurable upper limit
- **BLE Power Meter broadcasting** - Optional Arduino/ESP32 component to broadcast data to cycling apps (Zwift, TrainerRoad, etc.) via BLE Cycling Power Service

## 🏗️ Architecture

The project consists of three main components:

### 1. Device Component (Python)
- **Location**: `device/`
- **Purpose**: BLE client that connects to the hometrainer and streams data
- **Key files**:
  - `main.py` - Main BLE client implementation
  - `websocket_client.py` - WebSocket client for server communication
  - `test.py` - Mock data generator for testing

### 2. WebServer Component (C++)
- **Location**: `webserver/`
- **Purpose**: HTTP/WebSocket server that serves the web interface and relays data
- **Key files**:
  - `main.cpp` - Server entry point
  - `webserver.cpp/h` - WebServer implementation using Mongoose
  - `html/` - Web frontend (HTML, CSS, JavaScript)
  - `mongoose.c/h` - Mongoose embedded web server library

### 3. BLE Cycling Power Transmitter (Arduino/ESP32) - Optional
- **Location**: `ble_csc/csc_transmitter/`
- **Purpose**: Acts as a BLE Cycling Power Service server to broadcast data to cycling apps
- **Key files**:
  - `csc_transmitter.ino` - Arduino sketch for ESP32
  - `secrets.h` - WiFi and WebSocket credentials (not in repo)
- **Use case**: Connect your cycling apps (Zwift, TrainerRoad, etc.) to receive real-time power and cadence data from your hometrainer

**Data Flow**:
```
Mode 1 - Web Dashboard (Read-only):
Fitness Equipment (BLE) → Python Client → WebSocket → C++ Server → Web Browser
   [Data: HR, Speed, RPM, Power, Resistance, Distance, Calories]

Mode 2 - Cycling Apps (via ESP32 BLE Bridge):
Fitness Equipment (BLE) → Python Client → WebSocket → C++ Server 
                                                         ↓
                                            ESP32 (WebSocket Client)
                                                         ↓
                                              Cycling App (BLE)

Mode 3 - HR-Based Training (Bidirectional Control):
                     ┌─── BLE Read (HR, Speed, RPM, etc.)
                     ↓
Fitness Equipment ← ─ ─ ─ Python Client ← ─ ─ WebSocket ← ─ ─ C++ Server ← ─ ─ Web Browser
                     │                                                          │ [User starts
      BLE Write      │                  WebSocket (resistance command) ────────┘  HR training]
   (Set Resistance)  │                                                  
                     └─────────────────────────────────────────────────
```

## 🔧 Prerequisites

### For Device Component (Python)
- Python 3.7+
- Bluetooth adapter with BLE support
- Required Python packages:
  - `bleak` - BLE communication
  - `websockets` - WebSocket client
  - `asyncio` - Asynchronous I/O

### For WebServer Component (C++)
- CMake 3.10+
- C++ compiler with C++11 support (GCC, Clang, MSVC)
- Make or Ninja build system

### For BLE Cycling Power Transmitter (Optional)
- ESP32 board (ESP32-C6 or similar)
- Arduino IDE or PlatformIO
- Required Arduino libraries:
  - `NimBLE-Arduino` - BLE server implementation
  - `WebSocketsClient` - WebSocket client for Arduino
  - WiFi (built-in for ESP32)

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Schuali93/Hometrainer_WebGui.git
cd Hometrainer_WebGui
```

### 2. Install Python Dependencies
```bash
cd device
pip install bleak websockets
```

### 3. Build the WebServer
```bash
cd ../webserver
chmod +x builder.sh
./builder.sh
```

When prompted, select:
- `configurebuild` - To configure and build in one step
- Or `configure` followed by `build` for separate steps

The built executable `MongooseServer` will be created in the `webserver/` directory.

### 4. Setup BLE Cycling Power Transmitter (Optional)

If you want to broadcast data to cycling apps:

1. Create a `secrets.h` file in `ble_csc/csc_transmitter/`:
```cpp
// secrets.h
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";
const char* ws_host = "192.168.0.88";  // WebSocket server IP
const int ws_port = 8000;
const char* ws_path = "/websocket";
```

2. Open `ble_csc/csc_transmitter/csc_transmitter.ino` in Arduino IDE

3. Install required libraries via Library Manager:
   - NimBLE-Arduino
   - WebSockets by Markus Sattler

4. Select your ESP32 board (e.g., ESP32-C6 Dev Module)

5. Upload the sketch to your ESP32

## ⚙️ Configuration

### Device Configuration
Edit `device/main.py` to configure:
```python
# Target device name (your bike's BLE name)
TARGET_DEVICE_NAME = "iConsole+0141"

# WebSocket server URI
websocket_uri = "ws://192.168.0.88:8000/websocket"
```

### WebServer Configuration
Edit `webserver/main.cpp` to configure:
```cpp
WebServer server("192.168.0.88", 8000, "./html");
```

Update `webserver/html/script.js` to match your server address:
```javascript
const ws = new WebSocket("ws://192.168.0.88:8000/websocket");
```

### BLE Transmitter Configuration (Optional)
Create `ble_csc/csc_transmitter/secrets.h` with your network settings:
```cpp
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";
const char* ws_host = "192.168.0.88";  // Must match WebServer IP
const int ws_port = 8000;
const char* ws_path = "/websocket";
```

**Important**: Ensure all IP addresses match your server's network configuration.

## 🚀 Usage

### 1. Start the WebServer
```bash
cd webserver
./MongooseServer
```

The server will start on the configured IP and port (default: http://192.168.0.88:8000)

### 2. Connect the Device
Make sure your fitness equipment is powered on and in pairing mode, then:
```bash
cd device
python main.py
```

The script will:
- Scan for BLE devices
- Connect to your configured hometrainer
- Start streaming data to the WebSocket server

### 3. Open the Web Interface
Navigate to `http://192.168.0.88:8000` in your web browser to view the dashboard.

### 4. (Optional) Use with Cycling Apps
If you've set up the BLE transmitter:

1. Power on your ESP32 device (it will auto-connect to WiFi and WebSocket server)
2. Open your cycling app (Zwift, TrainerRoad, etc.)
3. Search for BLE power meters
4. Connect to "Power Meter" (the ESP32 device)
5. Your app will now receive real-time power and cadence data from your hometrainer

### 5. Using Heart Rate-Based Training
The dashboard includes an automatic training mode that adjusts resistance based on your heart rate:

1. In the web interface, navigate to the **TRAINING** section
2. Set your desired upper heart rate limit (default: 140 bpm, range: 90-180 bpm)
3. Click **"Start HR based training"** to begin
4. The system will automatically:
   - Increase resistance when your heart rate is below the limit
   - Decrease resistance when your heart rate exceeds the limit
   - Use exponential intervals to smooth resistance changes
5. Click **"Stop HR based training"** to end the session and regain manual control

**How it works**: 
- The algorithm adjusts resistance at variable intervals (5-30 seconds)
- Adjustment frequency depends on how far your heart rate is from the upper limit:
  - **Far below the limit**: More frequent adjustments to increase intensity
  - **Close to or above the limit**: Less frequent adjustments to reduce resistance
- This creates a smoother, safer training experience

### Testing Without Hardware
Use the test script to simulate bike data:
```bash
cd device
python test.py
```

## 📁 Project Structure

```
Hometrainer_WebGui/
├── device/                      # Python BLE client
│   ├── main.py                  # Main BLE client
│   ├── websocket_client.py      # WebSocket client module
│   └── test.py                  # Mock data generator
├── webserver/                   # C++ WebSocket/HTTP server
│   ├── main.cpp                 # Server entry point
│   ├── webserver.cpp/h          # WebServer implementation
│   ├── mongoose.c/h             # Mongoose library
│   ├── CMakeLists.txt           # Build configuration
│   ├── builder.sh               # Build helper script
│   ├── html/                    # Web frontend
│   │   ├── index.html           # Dashboard UI
│   │   ├── script.js            # Client-side logic
│   │   └── styles.css           # Styling
│   └── util/                    # Utility modules
│       └── JsonParser.cpp/h     # JSON parsing utilities
├── ble_csc/                     # BLE Cycling Power Service (Optional)
│   └── csc_transmitter/         # Arduino/ESP32 transmitter
│       └── csc_transmitter.ino  # Main Arduino sketch
└── README.md                    # This file
```

## 🐛 Troubleshooting

### BLE Connection Issues
- Ensure your Bluetooth adapter is enabled and supports BLE
- Verify the device name matches exactly (case-sensitive)
- Check that the fitness equipment is in pairing mode
- On Linux, you may need to run with `sudo` for BLE access

### WebSocket Connection Failed
- Verify the IP address and port are correct in all configuration files
- Check that the WebServer is running before starting the Python client
- Ensure no firewall is blocking the WebSocket port
- Confirm all components use the same IP address

### Build Errors
- Ensure CMake version is 3.10 or higher: `cmake --version`
- Verify C++ compiler supports C++11
- Check that all dependencies are installed

### Web Interface Not Loading
- Verify the WebServer is running
- Check browser console for errors (F12)
- Ensure the server's `html/` directory contains all necessary files
- Try accessing from the same machine first (localhost)

### ESP32 BLE Transmitter Issues
- Verify WiFi credentials are correct in `secrets.h`
- Check Serial Monitor output for connection status
- Ensure WebSocket server IP matches in all configs
- Confirm ESP32 is on the same network as the WebServer
- Make sure NimBLE-Arduino and WebSockets libraries are installed
- Try power cycling the ESP32 if it won't connect

### Heart Rate-Based Training Issues
- Ensure your fitness equipment broadcasts heart rate data via BLE
- Verify heart rate values are being displayed in the dashboard before starting HR training
- If resistance doesn't change, check that the Python client has control of the fitness machine
- The resistance range is limited to 1-32; the system won't exceed these bounds
- Heart rate values of 0 are ignored by the training algorithm

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Mongoose](https://github.com/cesanta/mongoose) - Embedded web server library
- [Bleak](https://github.com/hbldh/bleak) - Python BLE library
- [Chart.js](https://www.chartjs.org/) - JavaScript charting library
- [NimBLE-Arduino](https://github.com/h2zero/NimBLE-Arduino) - BLE library for ESP32
- [WebSockets by Markus Sattler](https://github.com/Links2004/arduinoWebSockets) - WebSocket client for Arduino
- Fitness Machine Service (FTMS) - Bluetooth GATT specification for fitness equipment
- Cycling Power Service (CPS) - Bluetooth GATT specification for cycling power meters
