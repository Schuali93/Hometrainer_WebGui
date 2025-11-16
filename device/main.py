import asyncio
import websockets
from bleak import BleakScanner, BleakClient
import websocket_client

# iConsole+0141 BLE GATT Services and Characteristics
# Service: 0000fff0-0000-1000-8000-00805f9b34fb
#   Characteristic: 0000fff1-0000-1000-8000-00805f9b34fb (Properties: ['notify'])
#   Characteristic: 0000fff2-0000-1000-8000-00805f9b34fb (Properties: ['write', 'write-without-response'])
# Service: 00001000-0000-4d58-9070-612150a3410f <- Custom Service
#   Characteristic: 00001001-0000-4d58-9070-612150a3410f (Properties: ['write', 'write-without-response'])
# Service: 00001826-0000-1000-8000-00805f9b34fb <-- Fitness Machine Service
#   Characteristic: 00002acc-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Fitness Machine Feature
#   Characteristic: 00002ace-0000-1000-8000-00805f9b34fb (Properties: ['notify']) <-- Cross Trainer Data
#   Characteristic: 00002ad2-0000-1000-8000-00805f9b34fb (Properties: ['notify']) <-- Indoor Bike Data
#   Characteristic: 00002ad3-0000-1000-8000-00805f9b34fb (Properties: ['read', 'notify']) <-- Training Status
#   Characteristic: 00002ad4-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Supported Speed Range
#   Characteristic: 00002ad5-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Supported Inclination Range
#   Characteristic: 00002ad6-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Supported Resistance Level Range
#   Characteristic: 00002ad8-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Supported Power Range
#   Characteristic: 00002ad7-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Supported Heart Rate Range
#   Characteristic: 00002ad9-0000-1000-8000-00805f9b34fb (Properties: ['write', 'indicate']) <-- Fitness Machine Control Point
#   Characteristic: 00002ada-0000-1000-8000-00805f9b34fb (Properties: ['notify']) <-- Fitness Machine Status
# Service: 0000180a-0000-1000-8000-00805f9b34fb <- Device Information Service
#   Characteristic: 00002a29-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Manufacturer Name String
#   Characteristic: 00002a24-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Model Number String
#   Characteristic: 00002a27-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Hardware Revision String
#   Characteristic: 00002a26-0000-1000-8000-00805f9b34fb (Properties: ['read']) <-- Firmware Revision String
# Service: 02f00000-0000-0000-0000-00000000fe00 <- Custom Service
#   Characteristic: 02f00000-0000-0000-0000-00000000ff03 (Properties: ['read'])
#   Characteristic: 02f00000-0000-0000-0000-00000000ff02 (Properties: ['read', 'notify'])
#   Characteristic: 02f00000-0000-0000-0000-00000000ff00 (Properties: ['read'])
#   Characteristic: 02f00000-0000-0000-0000-00000000ff01 (Properties: ['write', 'write-without-response'])

# The name of the device to connect to
TARGET_DEVICE_NAME = "iConsole+0141"

# 1. Write characteristic UUID
UNKNOWN_WRITE_UUID = "00001001-0000-4d58-9070-612150a3410f"
UNKNOWN_WRITE_UUID_VAL = bytearray([0x01, 0x20, 0xBE, 0x6D])

# Notification characteristic UUID
NOTIFY_CHARACTERISTIC_UUID_0 = "0000fff1-0000-1000-8000-00805f9b34fb"
NOTIFY_CHARACTERISTIC_UUID_1 = "00002ace-0000-1000-8000-00805f9b34fb"
NOTIFY_INDOOR_BIKE_DATA = "00002ad2-0000-1000-8000-00805f9b34fb"
NOTIFY_CHARACTERISTIC_UUID_3 = "00002ad3-0000-1000-8000-00805f9b34fb"
NOTIFY_FITNESS_MACHINE_STATUS = "00002ada-0000-1000-8000-00805f9b34fb"
NOTIFY_CHARACTERISTIC_UUID_5 = "02f00000-0000-0000-0000-00000000ff02"

READ_FITNESS_MACHINE_FEATURE = "00002acc-0000-1000-8000-00805f9b34fb"
# Fiteness Machine Control Point Characteristic UUID
FMCP_UUID = "00002ad9-0000-1000-8000-00805f9b34fb"
FMCP_SUCCESS = "0x800001"

# CUSTOM
WRITE_0 = "00001001-0000-4d58-9070-612150a3410f"

bikeUid = "iConsole+0141"

def clamp_level(level):
    return max(1, min(32, int(round(level))))

async def set_resistance(client, level):
    level = clamp_level(level)
    value = level * 10
    cmd = bytearray([0x04, value & 0xFF, (value >> 8) & 0xFF])
    await client.write_gatt_char(FMCP_UUID, cmd, response=True)


async def indication_handler(sender, data):
    print(f"Indication received from {sender}: {data.hex()}")

async def notification_handler(sender, data):
    ret = parse_indoor_bike_data(data.hex())
    await websocket_client.websocket_setdata(ret)

def reverse_bits_in_hex(hex_value):
    # Ensure the input is a 64-bit hexadecimal string
    if len(hex_value) != 16:
        raise ValueError("Input must be a 64-bit hexadecimal string (16 characters).")
    
    # Split the 64-bit hex value into two 32-bit segments
    first_32 = hex_value[:8]
    second_32 = hex_value[8:]
    
    # Helper function to reverse bits in a 32-bit segment
    def reverse_bits(hex_segment):
        # Convert hex to binary (32 bits)
        binary = bin(int(hex_segment, 16))[2:].zfill(32)
        # Reverse the binary string
        reversed_binary = binary[::-1]
        # Return the reversed binary string, zero-filled to 32 bits
        return reversed_binary.zfill(32)

    # Reverse bits in both segments
    reversed_first_32 = reverse_bits(first_32)
    reversed_second_32 = reverse_bits(second_32)
    
    return reversed_first_32, reversed_second_32

def parse_indoor_bike_data(data):
    global bikeUid
    byteData = bytearray.fromhex(data)
    print(f"Raw indoor bike data: {data}")
    speed = (byteData[2] | (byteData[3] << 8)) / 100.0
    rpm = byteData[6] / 2.0
    distance = byteData[10] / 1000.0
    resistance = byteData[13]
    power = byteData[15]
    calories = byteData[19]
    heartrate = byteData[24]

    json_data = {
        "msgtype": "indoor_bike_data",
        "uid": bikeUid,
        "data" : {
            "speed": speed,
            "rpm": rpm,
            "distance": distance,
            "resistance": resistance,
            "power": power,
            "calories": calories,
            "heartrate": heartrate
        }
    }

    return json_data

async def main():
    # Start WebSocket connection
    websocket_uri = "ws://192.168.0.88:8000/websocket"
    asyncio.create_task(websocket_client.websocket_start(websocket_uri, bikeUid))
    await asyncio.sleep(1)  # Wait for WebSocket to connect

    # Discover devices
    target_device = None
    while not target_device:
        print("Scanning for devices...")
        devices = await BleakScanner.discover()

        for device in devices:
            print(f"Found device: {device.name} ({device.address})")
            if device.name == TARGET_DEVICE_NAME:
                target_device = device
                break

        if not target_device:
            print(f"Device '{TARGET_DEVICE_NAME}' not found. Retrying...\n")
            await asyncio.sleep(5)  # Wait before scanning again


    print(f"Found target device: {target_device.name} ({target_device.address})")

    # Connect to the device
    async with BleakClient(target_device.address) as client:
        print(f"Connected to {TARGET_DEVICE_NAME}")

        for service in client.services:
            print(f"Service: {service.uuid}")
            for char in service.characteristics:
                print(f"  Characteristic: {char.uuid} (Properties: {char.properties})")
                for desc in char.descriptors:
                    print(f"  Descriptor: {desc.uuid}")

        # Subscribe to notifications
        await client.start_notify(NOTIFY_INDOOR_BIKE_DATA, notification_handler)
        print(f"Subscribed to notifications on {NOTIFY_INDOOR_BIKE_DATA}")

        # Enable indications for the FMCP characteristic
        await client.start_notify(FMCP_UUID, indication_handler)
        print(f"Indications enabled for {FMCP_UUID}")

        req_ctrl = bytearray([0x00])  # Opcode for "Request Control"
        try:
            await client.write_gatt_char(FMCP_UUID, req_ctrl, response=True)
            print(f"Sent Request Control command to {FMCP_UUID}")
        except Exception as e:
            print(f"Failed to send Request Control command: {e}")

        lvl = 1
        await set_resistance(client, lvl)
        print(f"Set resistance level to {lvl}")

        try:
            # Keep the program running until a keyboard interrupt
            print("Listening for notifications... Press Ctrl+C to stop.")
            while True:
                await asyncio.sleep(1)  # Keep the event loop alive
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received. Unsubscribing...")
        finally:
            # Unsubscribe from notifications
            await client.stop_notify(NOTIFY_INDOOR_BIKE_DATA)
            await client.stop_notify(FMCP_UUID)
            print("Unsubscribed and disconnected.")

# Run the asyncio event loop
asyncio.run(main())