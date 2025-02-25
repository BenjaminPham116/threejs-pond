varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
varying vec2 vUv; // The passed UV coordinates from the vertex shader
varying vec3 vWorldPosition;

uniform sampler2D uDepth;
uniform float uTime;
uniform float uNear;
uniform float uFar;
uniform vec3 uCameraPos;

#include <noiseLibrary>

float waterMap(vec2 uv){
  vec2 fUV = uv * 10.;
  float t = uTime * .1;
  float f = fbm(fUV +  fbm(vec3(fUV + t * 5., t * .3 + sin(uTime) * .3), 4) + t * .25);
  return f;
}

float specular(vec2 uv){
  float t = uTime * .1;
  float v = voronoise(uv * 50. + t * 10.).r + voronoise(uv * 50. + t * vec2(-1.,1.) * 10.).r;
  return v;
}

float perspectiveDepthToViewZ(float invClipZ, float near, float far) {
  return (near * far) / ((far - near) * invClipZ - far);
}

float viewZToOrthographicDepth(float viewZ, float near, float far) {
  return (viewZ + near) / (near - far);
}

float readDepth(vec2 coord) {
  float fragCoordZ = texture2D(uDepth, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, uNear, uFar);
  return viewZToOrthographicDepth(viewZ, uNear, uFar);
}

float linearizeDepth(float depth, float near, float far) {
    float z = depth * 2.0 - 1.0;         // Back to NDC (-1 to 1)
    return (2.0 * near * far) / (far + near - z * (far - near)); // World-space depth
}

void main() {

  // Perspective divide (NDC space: -1 to 1)
  vec3 ndc = vScreenPosition.xyz / vScreenPosition.w;
  // Remap from NDC (-1,1) to screen space (0,1)
  vec2 screenPos = ndc.xy * 0.5 + 0.5;

  float dist = distance(uCameraPos, vWorldPosition);
  float depth = texture2D(uDepth, screenPos).r;
  depth = linearizeDepth(depth, uNear, uFar);
  //depth = mix(uNear, uFar, depth);
  vec2 uv = vUv;
  float intensity = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
  vec4 color = vec4(1.);
  
  //water
  float water = waterMap(uv);
  float water2 = waterMap(uv + vec2(.01, 0));
  float water3 = waterMap(uv + vec2(.0, .01));
  vec3 normal = normalize(vec3((water - water2)/.01, 1, (water - water3)/.01));
  color.rgb = mix(vec3(.03,.15,.17), vec3(.13,.31,.26) * 2., smoothstep(-.1,.7,water));
  color.rgb = mix(color.rgb, vec3(.3,.4,.2), smoothstep(0.5,.9,water));
  
  //circle mask
  uv -= .5;
  uv *= 2.;
  color.a = smoothstep(0.,.5,1. - dot(uv,uv) - water * .5);
  color.rgb *= vec3(dot(1. - normalize(vec3(0.,1.,0.) + vec3(1.,0.,1.) * water * 2.), vec3(0.,.75,.75)));
  
  //color.a *= pow(depth,10.);
  float depthMask =  min(depth - dist,1.);
  float borderMask = (1. - smoothstep(0.2,.8,depthMask));
  color.a *= min(depthMask + borderMask  ,1.);
  color.rgb = mix(color.rgb, vec3(1.), borderMask);
  
  //vec3 lightDir = normalize(vec3(0.3,1.,0.3));
  //vec3 reflectedLight = reflect(normalize(vec3(0.,1.,0.) + vec3(fbm(vec3(uv * 100. + 100., uTime),5) * 4.,0., fbm(vec3(uv * 100., uTime),5) * 4.)),-lightDir);
  //vec3 cameraLookDir = normalize(vWorldPosition - uCameraPos);
  //float specular = pow(max(0.,dot(cameraLookDir, reflectedLight)),400.);
  //color.rgb += vec3(specular);
  gl_FragColor = color;
}
