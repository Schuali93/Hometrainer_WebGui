#include "webserver.h"
#include <iostream>
#include <map>
#include <vector>
#include <algorithm>

using namespace std;

// WebSocket broadcast function
static void broadcast_to_clients(struct mg_mgr *mgr, const char *message) {
    for (struct mg_connection *c = mgr->conns; c != NULL; c = c->next) {
        if (c->is_websocket) {
            mg_ws_send(c, message, strlen(message), WEBSOCKET_OP_TEXT);
        }
    }
}

// WebSocket broadcast function
static void broadcast_to_webclients(struct mg_mgr *mgr, const char *message) {
    for (struct mg_connection *c = mgr->conns; c != NULL; c = c->next) {
        if (c->is_websocket) {
            mg_ws_send(c, message, strlen(message), WEBSOCKET_OP_TEXT);
        }
    }
}

int main(void) 
{
    WebServer server("192.168.0.88", 8000, "./html");
    server.WebServer_Run();
    return 0;
}