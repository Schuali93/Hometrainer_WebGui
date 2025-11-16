#include "JsonParser.h"
#include <sstream>

std::string JsonParser::JsonIfy(const std::map<std::string, std::string> &keyValuePairs)
{
    std::ostringstream jsonStream;
    jsonStream << "{";

    // Iterate over the key-value pairs and format them as JSON
    for (auto it = keyValuePairs.begin(); it != keyValuePairs.end(); ++it) 
    {
        jsonStream << "\"" << it->first << "\": \"" << it->second << "\"";
        if (std::next(it) != keyValuePairs.end()) {
            jsonStream << ", ";
        }
    }

    jsonStream << "}";
    return jsonStream.str();

}