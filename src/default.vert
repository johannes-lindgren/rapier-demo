#version 300 es

precision mediump float;

in vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform vec4 inputSize;
uniform vec4 outputFrame;

out vec2 vTextureCoord;

vec4 filterVertexPosition( void )
{
  vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

  return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
  return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}