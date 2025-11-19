# Hometrainer WebGui

A real-time web-based dashboard for monitoring indoor bike/hometrainer metrics. This project connects to fitness equipment via Bluetooth Low Energy (BLE), streams data through a WebSocket server, and displays real-time performance metrics in an interactive web interface.

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
- [License](#license)

## ✨ Features

- **Real-time BLE connectivity** - Connects to fitness equipment supporting the Fitness Machine Service (FTMS) protocol
- **Live metrics display** - Monitor speed, RPM, power, resistance, heartrate, distance, and calories
- **Interactive charts** - Visualize performance data over time with Chart.js
- **WebSocket communication** - Low-latency data streaming between device and web interface
- **Responsive UI** - Clean, modern dashboard with Material Design icons
- **Multi-client support** - Handle multiple connected devices simultaneously
- **Resistance control** - Adjust bike resistance remotely through the interface
- **BLE Power Meter Emulation** - ESP32-based virtual power meter broadcasts data to cycling apps and devices

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

### 3. BLE CSC Component (Arduino/ESP32) [Optional]
- **Location**: `ble_csc/csc_transmitter/`
- **Purpose**: Virtual BLE Cycling Power Service transmitter for third-party cycling apps
- **Key files**:
  - `csc_transmitter.ino` - ESP32 BLE power meter emulator
- **Features**: Receives power/cadence data via WebSocket and broadcasts it as a BLE Cycling Power Service, allowing cycling apps (Zwift, TrainerRoad, etc.) to connect to your hometrainer setup

**Data Flow**:
```
Fitness Equipment (BLE) → Python Client → WebSocket → C++ Server → Web Browser
                                              ↓
                                    ESP32 BLE Transmitter → Cycling Apps (BLE)
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

### For BLE CSC Component (Optional)
- ESP32 development board (ESP32, ESP32-C3, ESP32-C6, or similar)
- Arduino IDE or PlatformIO
- Required Arduino libraries:
  - `NimBLE-Arduino` - BLE stack for ESP32
  - `WebSocketsClient` - WebSocket client library
  - `WiFi` - ESP32 WiFi (built-in)

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

### 4. Setup BLE CSC Component (Optional)
This component allows third-party cycling apps to connect to your hometrainer via BLE.

1. Install Arduino IDE and required libraries:
   - Install [Arduino IDE](https://www.arduino.cc/en/software)
   - In Arduino IDE, add ESP32 board support via Board Manager
   - Install libraries via Library Manager:
     - `NimBLE-Arduino` by h2zero
     - `WebSockets` by Markus Sattler

2. Configure the ESP32:
   - Open `ble_csc/csc_transmitter/csc_transmitter.ino` in Arduino IDE
   - Update WiFi credentials:
     ```cpp
     const char* ssid = "Your_WiFi_SSID";
     const char* password = "Your_WiFi_Password";
     ```
   - Update WebSocket server address (must match your WebServer):
     ```cpp
     const char* ws_host = "192.168.0.88";
     const uint16_t ws_port = 8000;
     ```

3. Upload to ESP32:
   - Connect your ESP32 board via USB
   - Select the correct board and port in Arduino IDE
   - Click "Upload"

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

### Testing Without Hardware
Use the test script to simulate bike data:
```bash
cd device
python test.py
```

### Using with Cycling Apps (Optional)
If you've set up the BLE CSC component:

1. Power on your ESP32 device - it will connect to WiFi and the WebSocket server
2. The ESP32 will advertise as "Power Meter" via BLE
3. Open your cycling app (Zwift, TrainerRoad, Wahoo, etc.)
4. Search for sensors and connect to "Power Meter"
5. The app will receive real-time power and cadence data from your hometrainer

**Supported by**: Any cycling app that supports the Bluetooth Cycling Power Service (most modern cycling apps)

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
├── ble_csc/                     # BLE Cycling Power transmitter (optional)
│   └── csc_transmitter/
│       └── csc_transmitter.ino  # ESP32 BLE power meter emulator
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

### BLE CSC Issues (ESP32)
- Ensure the ESP32 is powered on and connected to WiFi
- Verify the WebSocket server address and port match your configuration
- Check the Arduino IDE Serial Monitor for connection status
- If cycling apps can't find "Power Meter", ensure BLE is enabled on your device
- Some apps require the sensor to be actively transmitting data - ensure the Python client is running and sending data
- Try resetting the ESP32 if it becomes unresponsive

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Mongoose](https://github.com/cesanta/mongoose) - Embedded web server library
- [Bleak](https://github.com/hbldh/bleak) - Python BLE library
- [Chart.js](https://www.chartjs.org/) - JavaScript charting library
- Fitness Machine Service (FTMS) - Bluetooth GATT specification for fitness equipment
