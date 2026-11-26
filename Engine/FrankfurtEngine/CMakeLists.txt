cmake_minimum_required(VERSION 3.24)
project(FrankfurtEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)
set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
FetchContent_Declare(glfw GIT_REPOSITORY https://github.com/glfw/glfw.git GIT_TAG 3.4 GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(glfw)

FetchContent_Declare(glad GIT_REPOSITORY https://github.com/Dav1dde/glad.git GIT_TAG v2.0.8 GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(glad)
glad_add_library(glad_gl_core_33 REPRODUCIBLE API gl:core=3.3)

add_executable(frankfurt_engine
    src/main.cpp
    src/engine.cpp
)
target_include_directories(frankfurt_engine PRIVATE include)
target_link_libraries(frankfurt_engine PRIVATE glfw glad_gl_core_33)
target_compile_definitions(frankfurt_engine PRIVATE GLFW_INCLUDE_NONE)

if(MSVC)
    target_compile_options(frankfurt_engine PRIVATE /W4 /permissive-)
else()
    target_compile_options(frankfurt_engine PRIVATE -Wall -Wextra -Wpedantic)
endif()
