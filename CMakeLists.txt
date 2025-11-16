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

# BSP configuration
if(USE_STUB)
    message(STATUS "Using Stub implementation")
    list(APPEND SOURCES
        bsp/Stub/Stub_Gpio.c
    )
    include_directories(bsp/Stub)
    add_definitions(-DUSE_STUB)
elseif(USE_STM32)
    message(STATUS "Using STM32 implementation")
    list(APPEND SOURCES
        bsp/Stm32/Stm32_Gpio.c
    )
    include_directories(bsp/Stm32)
    add_definitions(-DUSE_STM32)
endif()

# Conditionally add packed_fs.c if MG_ENABLE_PACKED_FS is enabled
if(MG_ENABLE_PACKED_FS)
    add_definitions(-DMG_ENABLE_PACKED_FS=1)
    list(APPEND SOURCES packed_fs.c)
else()
    add_definitions(-DMG_ENABLE_PACKED_FS=0)
endif()

# Include directories
include_directories(${CMAKE_SOURCE_DIR})

# Create the executable
add_executable(${PROJECT_NAME} ${SOURCES})