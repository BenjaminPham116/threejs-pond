varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
varying vec2 vUv; // The passed UV coordinates from the vertex shader
varying vec3 vWorldPosition;

uniform sampler2D uTexture;
uniform float uTime;

#include <noiseLibrary>

void main() {
  vec2 uv = vUv;
  vec4 col = texture2D(uTexture, uv);
  
  gl_FragColor = col;
}
