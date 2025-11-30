import asyncio
import websockets
import json

# Global variables
websocket_connection = None
writequeue = None
gUid = None

set_resistance_callback = None

def register_set_resistance_callback(callback):
    global set_resistance_callback
    set_resistance_callback = callback

# Define event handlers
async def handle_uid(websocket, data):
    global gUid
    response_data = {
        "msgtype": "identification",
        "action": "repsonse",
        "type": "pythonclient",
        "uid": gUid
    }
    await websocket_setdata(response_data)
    print(f"Sent identification: {response_data}")

async def handle_default(data):
    print(f"Unhandled message: {data}")

# Create the WebSocket connection and store it in a global variable
async def websocket_connect(uri):
    global websocket_connection
    while True:
        try:
            websocket_connection = await websockets.connect(uri)
            print("Connected to WebSocket server.")
            break
        except Exception as e:
            print(f"WebSocket connection failed: {e}")
            print(f"Retrying in 1 second...")
            await asyncio.sleep(1)

# WebSocket reader: listens for incoming messages
async def websocket_reader():
    global websocket_connection
    while True:
        try:
            # Wait for a message from the server
            response = await websocket_connection.recv()
            data = json.loads(response)
            print(f"Received: {data}")

            # Dispatch to the appropriate handler based on "action"
            action = data.get("action")
            if action == "uid?":
                await handle_uid(websocket_connection, data)
            elif action == "setresistance":
                print(f"\033[92mSetting resistance to: {data.get('resistance', 1)}\033[0m")
                await set_resistance_callback(data.get("resistance", 1))
            else:
                await handle_default(data)

        except websockets.ConnectionClosed:
            print("Connection closed by the server.")
            break
        except json.JSONDecodeError:
            print("Received invalid JSON.")
        except Exception as e:
            print(f"An error occurred: {e}")

# WebSocket writer: sends data from the writequeue
async def websocket_writer():
    global websocket_connection
    global writequeue
    while True:
        try:
            # Get data from the queue
            data = await writequeue.get()
            await websocket_connection.send(json.dumps(data))
            print(f"Sent: {data}")
            writequeue.task_done()
        except websockets.ConnectionClosed:
            print("Connection closed by the server.")
            break
        except Exception as e:
            print(f"An error occurred: {e}")

# Main function to start the WebSocket client
async def websocket_start(uri, uid):
    global gUid
    global writequeue
    gUid = uid
    writequeue = asyncio.Queue()
    await websocket_connect(uri)  # Establish the connection
    # Run the reader and writer concurrently
    await asyncio.gather(websocket_reader(), websocket_writer())

async def websocket_setdata(data):
    global websocket_connection
    global writequeue

    if not websocket_connection:
        print("WebSocket is not connected.")
        return
    elif writequeue:
        await writequeue.put(data)
    else:
        print("Write queue is not initialized.")

if __name__ == "__main__":
    uri = "ws://192.168.0.32:8000/websocket"
    asyncio.run(websocket_start(uri, "EnergeticsCT1000"))