#version 300 es

precision mediump float;

in vec2 vTextureCoord;
out vec4 fragColor;

uniform sampler2D whiteNoise;
uniform vec2 size;
uniform float time;

// r between 0 and 1
vec2 gradient(float r) {
  float angle = 3.14159 * 2.0 * r;
  return vec2(cos(angle), sin(angle));
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

void main() {
  float colf = floor(vTextureCoord.x / size.x);
  float rowf = floor(vTextureCoord.y / size.y);
  int column = int(colf);
  int row = int(rowf);
  vec2 gridUv = vec2(vTextureCoord.x / size.x - colf, vTextureCoord.y / size.y - rowf);

  vec2 d2Tl = (gridUv - vec2(0, 0));
  vec2 d2Tr = (gridUv - vec2(1, 0));
  vec2 d2Bl = (gridUv - vec2(0, 1));
  vec2 d2Br = (gridUv - vec2(1, 1));

//  float angle = 3.14159 * 2.0 * texelFetch(whiteNoise, ivec2(column, row), 0).x;

  vec4 rTl = texelFetch(whiteNoise, ivec2(column, row), 0);
  vec4 rTr = texelFetch(whiteNoise, ivec2(column + 1, row), 0);
  vec4 rBl = texelFetch(whiteNoise, ivec2(column, row + 1), 0);
  vec4 rBr = texelFetch(whiteNoise, ivec2(column + 1, row + 1), 0);

//  float val = dot(gridCoord, d2bl);
  float dotTl = dot(d2Tl, gradient(rTl[0]));
  float dotTr = dot(d2Tr, gradient(rTr[0]));
  float dotBl = dot(d2Bl, gradient(rBl[0]));
  float dotBr = dot(d2Br, gradient(rBr[0]));

  vec2 gridUv2 = fade(gridUv);
  gridUv2.y = 1.0 - gridUv2.y;

  float b = mix(dotBl, dotBr, gridUv2.x);
  float t = mix(dotTl, dotTr, gridUv2.x);
  float perlin = 0.5 * mix(b, t, gridUv2.y) + 0.5;

  float color = perlin;
  float a = perlin > 0.5 ? 1.0 : 0.0;
//  fragColor = vec4(perlin,perlin,perlin, 1.0) * a;
  fragColor = vec4(perlin,perlin,perlin, 1.0);
}