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
  vec3 pos = vWorldPosition * .5;
  float f = fbmO(pos.xz, 5 );
  float f2 = fbmO(pos.xz * 2., 6 );
  float f3 = fbmO(pos.xz + 200., 5 );
  float mask = step(.4, f);
  f = smoothstep(.5,.8, f);
  f3 = smoothstep(0.2,1., f3);
  vec4 col = vec4(1.);
  col.rgb = mix(vec3(0.07,.2, .1), vec3(0.3,.7, .46), clamp(f2 + f,0.,1.));
  col.rgb = mix(col.rgb, vec3(0.6, .8, .56) * .4, f3);
  
  
  gl_FragColor = col;
}
