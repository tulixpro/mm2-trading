#include "engine/engine.hpp"

#include <glad/gl.h>
#include <GLFW/glfw3.h>

#include <iostream>
#include <string>
#include <utility>

namespace frankfurt {
namespace {

constexpr const char* kVertexShader = R"GLSL(
#version 330 core
layout (location = 0) in vec3 aPosition;
void main() {
    gl_Position = vec4(aPosition, 1.0);
}
)GLSL";

constexpr const char* kFragmentShader = R"GLSL(
#version 330 core
out vec4 FragColor;
uniform float uTime;
void main() {
    vec2 uv = gl_FragCoord.xy / vec2(1280.0, 720.0);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.7);
    vec3 horizon = vec3(0.035, 0.075, 0.11);
    vec3 skyline = vec3(0.12, 0.28, 0.34);
    vec3 color = mix(horizon, skyline, clamp(uv.y * 1.2, 0.0, 1.0));
    color += vec3(0.025, 0.045, 0.05) * pulse;
    FragColor = vec4(color, 1.0);
}
)GLSL";

unsigned int compileShader(unsigned int type, const char* source) {
    const unsigned int shader = glCreateShader(type);
    glShaderSource(shader, 1, &source, nullptr);
    glCompileShader(shader);

    int success = 0;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char log[1024]{};
        glGetShaderInfoLog(shader, sizeof(log), nullptr, log);
        std::cerr << "Shader compilation failed: " << log << '\n';
        glDeleteShader(shader);
        return 0;
    }
    return shader;
}

unsigned int createShaderProgram() {
    const unsigned int vertex = compileShader(GL_VERTEX_SHADER, kVertexShader);
    const unsigned int fragment = compileShader(GL_FRAGMENT_SHADER, kFragmentShader);
    if (vertex == 0 || fragment == 0) {
        if (vertex) glDeleteShader(vertex);
        if (fragment) glDeleteShader(fragment);
        return 0;
    }

    const unsigned int program = glCreateProgram();
    glAttachShader(program, vertex);
    glAttachShader(program, fragment);
    glLinkProgram(program);
    glDeleteShader(vertex);
    glDeleteShader(fragment);

    int success = 0;
    glGetProgramiv(program, GL_LINK_STATUS, &success);
    if (!success) {
        char log[1024]{};
        glGetProgramInfoLog(program, sizeof(log), nullptr, log);
        std::cerr << "Shader linking failed: " << log << '\n';
        glDeleteProgram(program);
        return 0;
    }
    return program;
}

} // namespace

Engine::Engine(EngineConfig config) : config_(std::move(config)) {}

Engine::~Engine() {
    shutdown();
}

bool Engine::initialize() {
    if (!glfwInit()) {
        std::cerr << "Could not initialize GLFW.\n";
        return false;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#endif

    window_ = glfwCreateWindow(config_.width, config_.height, config_.title.c_str(), nullptr, nullptr);
    if (!window_) {
        std::cerr << "Could not create the engine window.\n";
        glfwTerminate();
        return false;
    }

    glfwMakeContextCurrent(window_);
    glfwSwapInterval(config_.vsync ? 1 : 0);

    if (!gladLoadGL(glfwGetProcAddress)) {
        std::cerr << "Could not load OpenGL functions.\n";
        shutdown();
        return false;
    }

    glViewport(0, 0, config_.width, config_.height);
    glfwSetFramebufferSizeCallback(window_, [](GLFWwindow*, int width, int height) {
        glViewport(0, 0, width, height);
    });

    constexpr float triangle[] = {
        -0.62f, -0.48f, 0.0f,
         0.62f, -0.48f, 0.0f,
         0.00f,  0.62f, 0.0f
    };

    glGenVertexArrays(1, &vertexArray_);
    glGenBuffers(1, &vertexBuffer_);
    glBindVertexArray(vertexArray_);
    glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer_);
    glBufferData(GL_ARRAY_BUFFER, sizeof(triangle), triangle, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), nullptr);
    glEnableVertexAttribArray(0);
    glBindVertexArray(0);

    shaderProgram_ = createShaderProgram();
    if (shaderProgram_ == 0) {
        shutdown();
        return false;
    }

    initialized_ = true;
    std::cout << "Frankfurt Engine initialized (OpenGL "
              << reinterpret_cast<const char*>(glGetString(GL_VERSION)) << ").\n";
    return true;
}

int Engine::run() {
    if (!initialized_ && !initialize()) return 1;

    double previousTime = glfwGetTime();
    while (!glfwWindowShouldClose(window_)) {
        const double currentTime = glfwGetTime();
        const float deltaSeconds = static_cast<float>(currentTime - previousTime);
        previousTime = currentTime;

        glfwPollEvents();
        if (glfwGetKey(window_, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
            glfwSetWindowShouldClose(window_, GLFW_TRUE);
        }

        renderFrame(deltaSeconds);
        glfwSwapBuffers(window_);
    }
    return 0;
}

void Engine::renderFrame(float deltaSeconds) {
    (void)deltaSeconds;
    glClearColor(0.025f, 0.045f, 0.065f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram_);
    const int timeLocation = glGetUniformLocation(shaderProgram_, "uTime");
    glUniform1f(timeLocation, static_cast<float>(glfwGetTime()));
    glBindVertexArray(vertexArray_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
}

void Engine::shutdown() {
    if (window_ && glfwGetCurrentContext() == window_) {
        if (vertexBuffer_) glDeleteBuffers(1, &vertexBuffer_);
        if (vertexArray_) glDeleteVertexArrays(1, &vertexArray_);
        if (shaderProgram_) glDeleteProgram(shaderProgram_);
    }
    vertexBuffer_ = 0;
    vertexArray_ = 0;
    shaderProgram_ = 0;
    if (window_) {
        glfwDestroyWindow(window_);
        window_ = nullptr;
    }
    glfwTerminate();
    initialized_ = false;
}

} // namespace frankfurt
