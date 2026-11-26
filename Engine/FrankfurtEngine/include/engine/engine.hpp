#pragma once

#include <string>

struct GLFWwindow;

namespace frankfurt {

struct EngineConfig {
    int width = 1280;
    int height = 720;
    std::string title = "Frankfurt Engine | Development Build";
    bool vsync = true;
};

class Engine {
public:
    explicit Engine(EngineConfig config = {});
    ~Engine();

    Engine(const Engine&) = delete;
    Engine& operator=(const Engine&) = delete;

    bool initialize();
    int run();

private:
    void shutdown();
    void renderFrame(float deltaSeconds);

    EngineConfig config_;
    GLFWwindow* window_ = nullptr;
    unsigned int shaderProgram_ = 0;
    unsigned int vertexArray_ = 0;
    unsigned int vertexBuffer_ = 0;
    bool initialized_ = false;
};

} // namespace frankfurt
