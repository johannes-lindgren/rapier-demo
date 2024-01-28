#version 300 es
#define MAX_STRUCTS 5 // Maximum size of the array

precision mediump float;

in vec2 vTextureCoord;
out vec4 fragColor;

uniform sampler2D whiteNoise;
uniform vec2 perlins[MAX_STRUCTS];
uniform int perlinsCount;
uniform vec2 dimensions;

// r between 0 and 1
vec2 gradient(float r) {
  float angle = 3.14159 * 2.0 * r;
  return vec2(cos(angle), sin(angle));
}

vec2 fade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlin(sampler2D whiteNoise, vec2 vTextureCoord, vec2 size) {
  vec2 uv = vec2(vTextureCoord.x / size.x, vTextureCoord.y / size.y);
  float colf = floor(uv.x);
  float rowf = floor(uv.y);
  int column = int(colf);
  int row = int(rowf);
  vec2 gridUv = vec2(uv.x - colf, uv.y - rowf);

  vec2 d2Tl = (gridUv - vec2(0, 0));
  vec2 d2Tr = (gridUv - vec2(1, 0));
  vec2 d2Bl = (gridUv - vec2(0, 1));
  vec2 d2Br = (gridUv - vec2(1, 1));

  vec4 rTl = texelFetch(whiteNoise, ivec2(column, row), 0);
  vec4 rTr = texelFetch(whiteNoise, ivec2(column + 1, row), 0);
  vec4 rBl = texelFetch(whiteNoise, ivec2(column, row + 1), 0);
  vec4 rBr = texelFetch(whiteNoise, ivec2(column + 1, row + 1), 0);

  float dotTl = dot(d2Tl, gradient(rTl[0]));
  float dotTr = dot(d2Tr, gradient(rTr[0]));
  float dotBl = dot(d2Bl, gradient(rBl[0]));
  float dotBr = dot(d2Br, gradient(rBr[0]));

  vec2 gridUv2 = fade(gridUv);
  gridUv2.y = 1.0 - gridUv2.y;

  float b = mix(dotBl, dotBr, gridUv2.x);
  float t = mix(dotTl, dotTr, gridUv2.x);
  float perlin = 0.5 * mix(b, t, gridUv2.y) + 0.5;
  return perlin;
}

void main() {
  float color = 0.0;
  float aspectRatio = dimensions.x / dimensions.y;
  for (int i = 0; i < perlinsCount; i++) {
    float size = perlins[i][0];
    float weight = perlins[i][1];
    color += weight * perlin(whiteNoise, vTextureCoord, vec2(size, aspectRatio * size));
  }

  fragColor = vec4(color, color, color, 1.0);
}