#version 300 es

precision mediump float;

in vec2 vTextureCoord;
out vec4 fragColor;

uniform sampler2D terrainTexture;
uniform vec2 dimensions;
uniform float threshold;

vec4 textureAt(sampler2D tex, vec2 uv){
  return 1.0 * smoothstep( threshold - 0.2, threshold + 0.2, texture(tex, uv));
//  return texture(terrainTexture, uv);
}

float[9] make_kernel(sampler2D tex, vec2 coord, vec2 dim)
{
  float n[9];

  float w = 1.0 / dim.x;
  float h = 1.0 / dim.y;

  for (int i = 0; i <= 2; i++) {
    for (int j = 0; j <= 2; j++) {
      n[i+j * 3] = textureAt(tex, coord + vec2( w * float(i - 1), h * float(j -1))).r;
    }
  }

  return n;
}

vec2 grad(){
  float n[9] = make_kernel(terrainTexture, vTextureCoord, dimensions );
  return vec2(
    n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]),
    n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8])
  );
}

void main() {
  vec2 g = grad();
  float sobel = length(g);
//  vec4 sobel = clamp(2.0 * sobel_edge_v, 0.0, 1.0);

//  float color = textureAt(terrainTexture, vTextureCoord).r;
  float grassArea = smoothstep(0.0, 1.0, g.y);
  vec4 grassCol = vec4(0.0, grassArea, 0.0, grassArea);
  vec4 heightCol = texture(terrainTexture, vTextureCoord);
  float height = 1.4 * mix(heightCol.r, grassArea, 0.3);
  fragColor = vec4(height, height, height, 1.0);
//  fragColor = mix(grassCol, heightCol, 0.5);
//  fragColor = grassCol;
//  fragColor = textureAt(terrainTexture, vTextureCoord);
}