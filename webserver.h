#ifndef WEBSERVER_H
#define WEBSERVER_H

#include "mongoose.h"
#include <string>
#include <vector>

class WebServer 
{
public:

    WebServer(std::string Address, size_t Port, std::string RootDir);
    void WebServer_Run();
    
private:

    std::string mRootDir;
    std::string mAddress;
    size_t mPort;

    struct mClient_Values {
        std::string Uid;
        struct mg_connection * Connection;
        std::string Type;

        bool operator==(const mClient_Values & other) const;
    };

    std::vector<mClient_Values> mClients;
    std::string WebServer_BuildAddress();
    std::string WebServer_JsonifyClients();
    void WebServer_BroadCastToWebClients(std::string data);
    static void WebServer_EventHandler(struct mg_connection *pConnection, int Event, void *pEvent_Data);

};

#endif /* WEBSERVER_H */