#version 300 es

precision mediump float;

uniform sampler2D heightMap;

out vec4 fragColor;
in vec2 uv;

void main() {
  fragColor = texture(heightMap, uv);
}