#include "webserver.h"
#include <iostream>
#include <algorithm>

using namespace std;

string WebServer::WebServer_BuildAddress()
{
    return "http://" + mAddress + ":" + to_string(mPort);
}

string WebServer::WebServer_JsonifyClients()
{
    string jsonstr = "{\"clients\": [";

    for (const auto& client : this->mClients)
    {
        if(client == mClients.back())
        {
            jsonstr += "{ \"uid\":\"" + client.Uid + "\", \"type\":\"" + client.Type + "\" }]}";
        }
        else
        {
            jsonstr += "{ \"uid\":\"" + client.Uid + "\", \"type\":\"" + client.Type + "\" },";
        }
    }

    return jsonstr;
}

void WebServer::WebServer_BroadCastToWebClients(std::string data)
{
    for (const auto& client : this->mClients)
    {
        if(client.Type == "webpage_client")
        {
            cout << "Broadcasting to client: " << client.Uid << endl;
            mg_ws_send(client.Connection, data.c_str(), data.length(), WEBSOCKET_OP_TEXT);
        }
        
    }
}

void WebServer::WebServer_BroadCastToSensors(std::string data) {
    for (const auto& client : this->mClients)
    {
        if(client.Type == "sensor")
        {
            cout << "Broadcasting to sensor client: " << client.Uid << endl;
            double power = 0;
            mg_json_get_num(mg_str(data.c_str()), "$.data.power", &power);
            double rpm = 0;
            mg_json_get_num(mg_str(data.c_str()), "$.data.rpm", &rpm);
            cout << "Power: " << power << " RPM: " << rpm << endl;

            string tmp = std::to_string(uint(power)) + "," + std::to_string(rpm);
            mg_ws_send(client.Connection, tmp.c_str(), strlen(tmp.c_str()), WEBSOCKET_OP_TEXT);
        }
        
    }
}

WebServer::WebServer(std::string Address, size_t Port, std::string RootDir)
{
    this->mAddress = Address;
    this->mPort = Port;
    this->mRootDir = RootDir;
}

void WebServer::WebServer_Run()
{
    struct mg_mgr mgr;        // Mongoose event manager
    mg_mgr_init(&mgr);        // Initialise event manager
    mg_http_listen(&mgr, WebServer_BuildAddress().c_str(), WebServer_EventHandler, this);

    mg_log_set(MG_LL_DEBUG);  // Set log level to debug

    for (;;) 
    {                // Infinite event loop
        mg_mgr_poll(&mgr, 0);   // Process network events
    }

    mg_mgr_free(&mgr);          // Free manager resources

}

void WebServer::WebServer_EventHandler(mg_connection *pConnection, int Event, void *pEvent_Data)
{
    WebServer *server = static_cast<WebServer *>(pConnection->fn_data);

    if (Event == MG_EV_HTTP_MSG) 
    {
        struct mg_http_message *hm = (struct mg_http_message *) pEvent_Data;

        if (mg_match(hm->uri, mg_str("/websocket"), NULL))
        {
            mg_ws_upgrade(pConnection, hm, NULL);
        }
        else if (mg_match(hm->uri, mg_str("/api/led/get"), NULL)) 
        {

        }
        else if (mg_match(hm->uri, mg_str("/api/led/toggle"), NULL)) 
        {
            struct mg_str body = hm->body;

            // Parse clientId from the JSON body
            char * str = mg_json_get_str(body, "$.clientId");
            string clientId(str);

            if (str != NULL)
            {
                auto it = find_if(server->mClients.begin(), server->mClients.end(),
                [&clientId](const mClient_Values& cv){
                    // Find the position of "]:"
                    size_t pos = cv.Uid.find("]:");
                    if (pos != string::npos) {
                        // Extract the part of the uid after "]:"
                        string actualClientId = cv.Uid.substr(pos + 2); // Skip "]:"
                        return actualClientId == clientId; // Compare with clientId
                    }
                    return false; // If "]:"" is not found, no match
                });

                if (it != server->mClients.end()) {
                    cout << "Found client to toggle LED: " << it->Uid << endl;
                    string jsonMessage = R"({"action":"toggle_led","clientId":")" + clientId + R"("})";

                    mg_ws_send(it->Connection, jsonMessage.c_str(), jsonMessage.length(), WEBSOCKET_OP_TEXT); 
                }

                mg_free(str);
                mg_http_reply(pConnection, 200, "", "{\"status\":\"LED toggle command sent\"}");
            }
        }
        else if (mg_match(hm->uri, mg_str("/api/clients/get"), NULL))
        {
            mg_http_reply(pConnection, 200, "", server->WebServer_JsonifyClients().c_str());
        }
        else 
        {
            struct mg_http_serve_opts opts = {.root_dir = server->mRootDir.c_str()};
            mg_http_serve_dir(pConnection, hm, &opts);
        }   
    }
    else if (Event == MG_EV_WS_OPEN)
    {
        cout << "WebSocket connection established" << endl;
        /* identify client */
        string jsonMessage = R"({"msgtype":"identification", "action":"uid?", "value":"none"})";
        mg_ws_send(pConnection, jsonMessage.c_str(), jsonMessage.length(), WEBSOCKET_OP_TEXT);        

    }
    else if (Event == MG_EV_WS_MSG)
    {
        struct mg_ws_message *wm = (struct mg_ws_message *) pEvent_Data;
        // cout << "Got websocket frame:" << wm->data.buf << endl;

        // Parse clientId from the JSON body
        char * str = mg_json_get_str(wm->data, "$.msgtype");
        string msgType = string(str);

        if (msgType == "identification")
        {
            char * uid = mg_json_get_str(wm->data, "$.uid");
            string id = "[" + to_string(pConnection->id) + "]" + ":" + uid;

            // cout << "Client identified with uid: " << id << endl;

            char * type = mg_json_get_str(wm->data, "$.type");

            mClient_Values cv;
            cv.Uid = id;
            cv.Connection = pConnection;
            cv.Type = type;

            server->mClients.push_back(cv);

            string jsonMessage = R"({"msgtype":"notification", "action":"none", "value":"ok"})";
            mg_ws_send(pConnection, jsonMessage.c_str(), jsonMessage.length(), WEBSOCKET_OP_TEXT); 
            mg_free(uid);
            mg_free(type);
        }
        else if (msgType == "indoor_bike_data")
        {
            // Broadcast measurement to all connected web clients
            server->WebServer_BroadCastToWebClients(string(wm->data.buf));
            server->WebServer_BroadCastToSensors(string(wm->data.buf));
        }
        else if (msgType == "indoor_bike_control")
        {
            cout << "Received control message for sensor client." << endl;
            for (const auto& client : server->mClients)
            {   
                char * str = mg_json_get_str(wm->data, "$.tuid");
                string tuid = string(str);
                
                size_t pos = client.Uid.find(":");
                if (pos != std::string::npos) {
                    std::string actualUid = client.Uid.substr(pos + 1); // Get substring after ':'
                    if (actualUid == tuid) {
                        cout << "Sending control to sensor client: " << client.Uid << endl;
                        mg_ws_send(client.Connection, wm->data.buf, wm->data.len, WEBSOCKET_OP_TEXT);
                    }
                }

                mg_free(str);
                
            }
        }

        mg_free(str);

    }
    else if (Event == MG_EV_CLOSE)
    {
    // Use std::find_if with explicit type
        string id_prefix = "[" + std::to_string(pConnection->id) + "]";

        auto it = std::find_if(server->mClients.begin(), server->mClients.end(),
        [&id_prefix](const mClient_Values& cv) {
            return cv.Uid.find(id_prefix) == 0;
        });

        if (it != server->mClients.end()) {
            cout << "Removing client ID: " << it->Uid << endl;
            server->mClients.erase(it);
        }

    }

}

bool WebServer::mClient_Values::operator==(const mClient_Values &other) const
{
    return Uid == other.Uid && Type == other.Type;
}
