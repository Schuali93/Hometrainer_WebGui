#!/bin/bash

# Function to extract the executable name from the `project()` line in CMakeLists.txt
get_executable_name() {
    grep -E '^project\(' ../CMakeLists.txt | awk -F'[()]' '{print $2}'
}

# Function to configure the build
configure() {
    if [ -d "build" ]; then
        echo -e "${GREEN}[INFO]${NC} Deleting existing build folder..."
        rm -rf build
    fi
    echo -e "${GREEN}[INFO]${NC} Creating new build folder..."
    mkdir build
    cd build || exit
    echo -e "${GREEN}[INFO]${NC} Running cmake .."
    cmake ..
    cd ..
}

# Function to build the project
build() {
    if [ ! -d "build" ]; then
        echo -e "${RED}[ERROR]${NC} Build folder does not exist. Run configure first."
        return
    fi
    cd build || exit
    echo -e "${GREEN}[INFO]${NC} Running make..."
    make

    # Extract the executable name
    executable_name=$(get_executable_name)

    # Copy the executable to the parent directory
    if [ -f "$executable_name" ]; then
        echo -e "${GREEN}[INFO]${NC} Copying executable '$executable_name' to parent directory..."
        cp "$executable_name" ../
    else
        echo -e "${RED}[ERROR]${NC} Executable '$executable_name' not found. Ensure the build process generates it."
    fi
    cd ..
}

# Function to configure and build the project
configurebuild() {
    configure
    build
}

# Define color codes
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Menu loop to choose between configure, build, configurebuild, and exit
while true; do
    echo -e "${GREEN}[INFO]${NC} Available commands:"
    echo "configure"
    echo "build"
    echo "configurebuild"
    echo "exit"
    read -rp ">> " command

    if [ "$command" == "configure" ]; then
        configure
    elif [ "$command" == "build" ]; then
        build
    elif [ "$command" == "configurebuild" ]; then
        configurebuild
    elif [ "$command" == "exit" ]; then
        echo -e "${GREEN}[INFO]${NC} Exiting script."
        break
    else
        echo -e "${RED}[ERROR]${NC} Invalid command. Try again."
    fi
    echo
done