#include <Arduino.h>
#include <NimBLEDevice.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include "../config/secrets.h"

WebSocketsClient webSocket;

// BLE server and characteristic pointers
static NimBLEServer* pServer;
static NimBLECharacteristic* powerMeasChar = nullptr;

// Standard Cycling Power Service and Measurement UUIDs
static const uint16_t CYCLING_POWER_SERVICE_UUID = 0x1818;
static const uint16_t CYCLING_POWER_MEAS_UUID    = 0x2A63;
static int16_t power = 0;

// Cadence integration variables
static float latestRpm = 0.0f;
static uint16_t cumulativeCrankRevs = 0;
static float crankRevFraction = 0.0f;
static uint16_t lastCrankEventTime = 0; // in 1/1024s

// Timing variables
unsigned long lastNotify = 0;
unsigned long lastCrankUpdate = 0;

// Server callbacks (optional, for connection info)
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        Serial.printf("Client connected: %s\n", connInfo.getAddress().toString().c_str());
        pServer->updateConnParams(connInfo.getConnHandle(), 24, 48, 0, 180);
    }
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        Serial.println("Client disconnected - restarting advertising");
        NimBLEDevice::startAdvertising();
    }
} serverCallbacks;

// Characteristic callbacks (optional, for debug)
class PowerCharCallbacks : public NimBLECharacteristicCallbacks {
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override {
        Serial.printf("Client %u subscribed to power notifications\n", connInfo.getConnHandle());
    }
    void onStatus(NimBLECharacteristic* pCharacteristic, int code) override {
        Serial.printf("Notification return code: %d\n", code);
    }
} powerCharCallbacks;


void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("Disconnected");
            break;
        case WStype_CONNECTED:
            Serial.println("Connected");
            // Optionally send a hello message
            webSocket.sendTXT("{\"msgtype\": \"identification\", \"action\": \"response\", \"type\": \"sensor\", \"uid\": \"esp32c6_power\" }");
            break;
        case WStype_TEXT:
        {
            Serial.printf("Received: %s\n", payload);
            // Expecting payload as "power,rpm" (e.g., "210,85")
            float p = 0.0f;
            float r = 0.0f;
            if (sscanf((const char*)payload, "%f,%f", &p, &r) == 2) {
                power = (int16_t)p;
                latestRpm = r;
            } else {
                power = atoi((const char*)payload);
                // If only power is sent, keep last RPM
            }
        }
            break;
        default:
            break;
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("Starting Cycling Power BLE Server");

    // WiFi setup
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // WebSocket client setup
    webSocket.begin(ws_host, ws_port, ws_path);
    webSocket.onEvent(webSocketEvent);

    NimBLEDevice::init("Power Meter");
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(&serverCallbacks);

    // Create Cycling Power Service
    NimBLEService* powerService = pServer->createService(NimBLEUUID(CYCLING_POWER_SERVICE_UUID));

    // Create Cycling Power Measurement Characteristic (Notify)
    powerMeasChar = powerService->createCharacteristic(
        NimBLEUUID(CYCLING_POWER_MEAS_UUID),
        NIMBLE_PROPERTY::NOTIFY
    );
    powerMeasChar->setCallbacks(&powerCharCallbacks);

    // Add CCCD descriptor for notifications
    powerMeasChar->createDescriptor("2902");

    // Add Cycling Power Feature characteristic (required, read-only)
    NimBLECharacteristic* powerFeatureChar = powerService->createCharacteristic(
        NimBLEUUID((uint16_t)0x2A65),
        NIMBLE_PROPERTY::READ
    );
    uint32_t feature = 0x00000000; // No optional features supported
    powerFeatureChar->setValue((uint8_t*)&feature, 4);

    // Add Sensor Location characteristic (optional, read-only)
    NimBLECharacteristic* sensorLocChar = powerService->createCharacteristic(
        NimBLEUUID((uint16_t)0x2A5D),
        NIMBLE_PROPERTY::READ
    );
    uint8_t sensorLoc = 0x00; // "Other" location
    sensorLocChar->setValue(&sensorLoc, 1);

    powerService->start();

    // Advertise the Cycling Power Service
    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->setName("Power Meter");
    pAdvertising->addServiceUUID(powerService->getUUID());
    pAdvertising->enableScanResponse(true);
    pAdvertising->start();

    Serial.println("Advertising Started");

    // Device Information Service
    NimBLEService* devInfoService = pServer->createService("180A"); // Device Information Service

    NimBLECharacteristic* manufacturerChar = devInfoService->createCharacteristic("2A29", NIMBLE_PROPERTY::READ);
    manufacturerChar->setValue("DIY");

    NimBLECharacteristic* modelChar = devInfoService->createCharacteristic("2A24", NIMBLE_PROPERTY::READ);
    modelChar->setValue("ESP32 Power");

    devInfoService->start();
}

void loop() {
    webSocket.loop();

    static bool wasConnected = false;
    bool isConnected = (pServer->getConnectedCount() > 0);

    if (isConnected) {
        unsigned long now = millis();
        float dt = (now - lastCrankUpdate) / 1000.0f;
        lastCrankUpdate = now;
        float revs = (latestRpm / 60.0f) * dt;
        crankRevFraction += revs;
        uint16_t wholeRevs = (uint16_t)crankRevFraction;

        if (wholeRevs > 0) {
            cumulativeCrankRevs += wholeRevs;
            crankRevFraction -= wholeRevs;
            lastCrankEventTime = (uint16_t)(((uint64_t)now * 1024ULL / 1000ULL) & 0xFFFF);
        }

        // --- Send notification at fixed interval (e.g., every 250 ms) ---
        static unsigned long lastNotify = 0;
        if (now - lastNotify >= 250) {
            lastNotify = now;

            int16_t instPower = power;
            uint16_t powerFlags = 0x0020;
            uint8_t payload[8];
            payload[0] = (uint8_t)(powerFlags & 0xFF);
            payload[1] = (uint8_t)((powerFlags >> 8) & 0xFF);
            payload[2] = (uint8_t)(instPower & 0xFF);
            payload[3] = (uint8_t)((instPower >> 8) & 0xFF);
            payload[4] = (uint8_t)(cumulativeCrankRevs & 0xFF);
            payload[5] = (uint8_t)((cumulativeCrankRevs >> 8) & 0xFF);
            payload[6] = (uint8_t)(lastCrankEventTime & 0xFF);
            payload[7] = (uint8_t)((lastCrankEventTime >> 8) & 0xFF);

            powerMeasChar->setValue(payload, sizeof(payload));
            powerMeasChar->notify();

            Serial.print("Power notify: ");
            Serial.print(instPower);
            Serial.print(" W, Cadence: ");
            Serial.print(latestRpm);
            Serial.print(" rpm, Cumulative Crank: ");
            Serial.print(cumulativeCrankRevs);
            Serial.print(", Fraction: ");
            Serial.println(crankRevFraction, 4);
        }
    }
}