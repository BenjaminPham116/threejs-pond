varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
varying vec3 vWorldPosition;

varying vec2 vUv; // Declaring a varying for UV coordinates
uniform float uTime;

#include <noiseLibrary>

void main() {
  vUv = uv;  // Pass the uv coordinates from vertex to fragment shader
 
  float f = waterHeight((modelMatrix * vec4(position, 1.0)).xz, uTime);
  vec3 newPosition = position + vec3(0.,1.,0.) * f * .8;
  
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
  vScreenPosition = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = vScreenPosition;
}
