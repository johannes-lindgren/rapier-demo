precision mediump float;

varying vec2 vTextureCoord;

uniform vec4 seed;

float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio

float gold_noise(vec2 xy, float seed) {
  return fract(tan(distance(xy * PHI, xy) * seed) * xy.x);
}

float rand(vec2 co, float seed){
  return fract(sin(dot(co + seed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  gl_FragColor = vec4(
    rand(vTextureCoord, seed[0]),
    rand(vTextureCoord, seed[1]),
    rand(vTextureCoord, seed[2]),
    rand(vTextureCoord, seed[3])
  );
  //  gl_FragColor = vec4(vUvs.x,0,time.x,1);
}
