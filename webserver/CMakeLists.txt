cmake_minimum_required(VERSION 3.10)

# Project name
project(MongooseServer)

# Set C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

include(BuildOptions.cmake)

# Check if debugging is enabled
if(ENABLE_DEBUG)
    set(CMAKE_BUILD_TYPE Debug)
    add_definitions(-DDEBUG)
else()
    set(CMAKE_BUILD_TYPE Release)
endif()

# Add source files
set(SOURCES
    main.cpp
    webserver.cpp
    mongoose.c
)

# Include directories
include_directories(${CMAKE_SOURCE_DIR} ../config)

# Create the executable
add_executable(${PROJECT_NAME} ${SOURCES})