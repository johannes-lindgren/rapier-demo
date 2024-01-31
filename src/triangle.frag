#version 300 es

precision mediump float;

uniform sampler2D heightMap;
uniform sampler2D whiteNoise;
uniform vec2 dimensions;
uniform float threshold;

out vec4 fragColor;
// interpolated coordinate
in vec2 vUvsUniform;
// uniform coordinate for all fragments
in vec2 vUvs;

// TODO calculate from perlin noise instead
vec4 textureAt(sampler2D tex, vec2 uv){
  return smoothstep( 0.0, 1.0, texture(tex, uv));
//    return texture(tex, uv);
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
  float n[9] = make_kernel(heightMap, vUvs, dimensions );
  return vec2(
    n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]),
    n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8])
  );
}

void main() {
  vec2 g = grad();

  vec4 terrain = texture(heightMap, vUvs);
  float rock = texture(heightMap, vUvsUniform)[0];
  float material = terrain[1];

  if(g.y > .0){
    // grass
    fragColor = vec4(rock * vec3(0.3, 0.9, 0.4), 1.0) + 0.02 * texture(whiteNoise, vUvs);
  } else {
    // rock
    fragColor = vec4(rock, rock, rock, 1.0);
  }

//  fragColor = g.y > 0.5 ? vec4(0.0, g.y, 0.0, 1.0) : texture(heightMap, uv);
//  fragColor = vec4(0.0, g.y, 0.0, 1.0);
}