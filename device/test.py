import websocket_client
import asyncio
import random

def parse_indoor_bike_data(data):
    #    4                          26  28    32        40          50  52  54  56    60
    # fe1f 0208 0000 6e 0000009a0000  02  001e  00000001  0000000000  00  68  00  0000

    # Generate random mock data
    seconds = random.randint(0, 3600)  # Random seconds (0 to 3600)
    ovsecnd = random.randint(0, 255)  # Random overflow seconds (0 to 255)
    heartrate = random.randint(40, 180)  # Random heartrate (40 to 180 bpm)
    resistance = random.randint(0, 20)  # Random resistance level (0 to 20)
    power = random.randint(0, 500)  # Random power (0 to 500 watts)
    distance = round(random.uniform(0, 100), 1)  # Random distance (0 to 100 km, 1 decimal)
    rpm = random.randint(40, 120)  # Random RPM (40 to 120)
    counter = random.randint(0, 255)  # Random counter (0 to 255)
    counterov = random.randint(0, 255)  # Random counter overflow (0 to 255)
    speed = random.randint(0, 50)  # Random speed (0 to 50 km/h)
    unknown = random.randint(0, 65535)  # Random unknown value (0 to 65535)
    rest_0 = random.randint(0, 65535)  # Random rest_0 value (0 to 65535)


    json_data = {
        "msgtype": "indoor_bike_data",
        "uid": "iConsole+0141",
        "data" : {
            "seconds": seconds,
            "ovsecond": ovsecnd,
            "heartrate": heartrate,
            "resistance": resistance,
            "power": power,
            "distance": distance,
            "rpm": rpm,
            "counter": counter,
            "counterov": counterov,
            "speed": speed,
            "unknown": unknown,
            "rest_0": rest_0
        }
    }

    return json_data

async def main():
    # Start the WebSocket connection
    asyncio.create_task(websocket_client.websocket_start("ws://192.168.0.88:8000/websocket", "MockIndoorBike"))

    while True:
    # Send test data to the WebSocket
        await websocket_client.websocket_setdata(parse_indoor_bike_data(None))
        await asyncio.sleep(0.5)  # Wait for 1 seconds before sending the next message

# Run the main coroutine
asyncio.run(main())