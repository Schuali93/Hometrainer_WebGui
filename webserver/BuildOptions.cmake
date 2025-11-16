# Build options
option(ENABLE_DEBUG "Enable debugging symbols" ON)

# Mongoose configuration
option(MG_ENABLE_PACKED_FS "Enable packed filesystem" OFF)

# Bsp options (client implementation)
option(USE_STUB "Use Stub implementation" OFF)
option(USE_STM32 "Use STM32 implementation" OFF)