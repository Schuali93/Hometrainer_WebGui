#include "webserver.h"
#include <iostream>
#include <map>
#include <vector>
#include <algorithm>

using namespace std;

int main(void) 
{
    WebServer server("192.168.0.88", 8000, "./html");
    server.WebServer_Run();
    return 0;
}