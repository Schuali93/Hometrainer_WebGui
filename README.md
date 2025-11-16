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

## 🏗️ Architecture

The project consists of two main components:

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

**Data Flow**:
```
Fitness Equipment (BLE) → Python Client → WebSocket → C++ Server → Web Browser
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
- Fitness Machine Service (FTMS) - Bluetooth GATT specification for fitness equipment
