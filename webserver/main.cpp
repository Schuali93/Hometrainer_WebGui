#include "webserver.h"
#include <iostream>
#include <map>
#include <vector>
#include <algorithm>
#include <string>
#include "secrets.h"

using namespace std;

int main(void) 
{
    WebServer server(string(ws_host), ws_port, string(website_path));
    server.WebServer_Run();
    return 0;
}
