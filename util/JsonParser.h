#ifndef JSON_PARSER
#define JSON_PARSER

#include <string>
#include <map>

class JsonParser
{
    public:
    JsonParser();
    std::string JsonIfy_client_values(const std::map<std::string, std::string>& keyValuePairs);
};

#endif /* JSON_PARSER */