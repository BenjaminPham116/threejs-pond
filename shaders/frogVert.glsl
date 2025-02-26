varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
varying vec3 vWorldPosition;

varying vec2 vUv; // Declaring a varying for UV coordinates
uniform float uTime;

#include <noiseLibrary>
#include <common>
#include <skinning_pars_vertex>
void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <skinning_vertex>
  #include <project_vertex>

  vUv = uv;  // Pass the uv coordinates from vertex to fragment shader
 
  float f = waterHeight((modelMatrix * vec4(0.,0.,0., 1.0)).xz, uTime);
  vec3 newPosition = transformed + vec3(0.,1.,0.) * f * 8. / length(modelMatrix[0].xyz);
  
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
  vScreenPosition = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = vScreenPosition;
}
