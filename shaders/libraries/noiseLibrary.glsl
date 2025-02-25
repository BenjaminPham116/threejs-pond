float rand21(vec2 p){
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 rand22(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float rand31(vec3 p){
    p *= vec3(22241.234,9287.31,157.23);
         
    return fract(sin(length(p)) * 9684.31);
}

vec3 rand33(vec3 p){
    p *= mat3(21.234,17.31,15.23,
              13.2113, 3.36, 12.545,
              2.334, 14.4335, 9.56);
         
    return fract(sin(p) * 9684.31);
}

float noise(vec2 st){
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float a = rand21(i);
    float b = rand21(i + vec2(1.0, 0.0));
    float c = rand21(i + vec2(0.0, 1.0));
    float d = rand21(i + vec2(1.0, 1.0));
    
    float rand = mix(mix(a, b, u.x),
                     mix(c, d, u.x), u.y);
    return rand;
}

float noise(vec3 p){
    vec3 id = floor(p);
    vec3 f  = fract(p);
    vec2 z = vec2(1.,0.);
    float a = rand31(id);
    float b = rand31(id + z.xyy);
    float c = rand31(id + z.yxy);
    float d = rand31(id + z.xxy);
    
    float a2 = rand31(id + z.yyx);
    float b2 = rand31(id + z.xyx);
    float c2 = rand31(id + z.yxx);
    float d2 = rand31(id + z.xxx);
    
    f = f*f *(3. - 2.*f);
    
    return mix(mix(mix(a,b,f.x),
               mix(c,d,f.x),f.y),
           mix(mix(a2,b2,f.x),
               mix(c2,d2,f.x),f.y),f.z);
}
float voronoise(vec3 p){
    vec3 id = floor(p);
    vec3 f  = fract(p);
    vec3 minP = rand33(id) + id;
    float minDist = distance(minP,p);
    for(int i = -1; i <= 1; i++){
        for(int j = -1; j <= 1; j++){
            for(int k = -1; k <= 1; k++){
                vec3 off = vec3(i,j,k);
                vec3 newP = rand33(id + off) + off + id;
                if(distance(newP,p) < minDist){
                    minP = newP;
                    minDist = distance(minP,p);
                }
            }   
        } 
    }
    return min(1.,minDist);
}

float fbm(vec2 st){
    int octaves = 2;
    float rand = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.5));
    float shift = 100.0;
    for(int i = 0; i < octaves; i++){
        rand += amp * noise(st * freq);
        amp *= 0.5;
        st = rot * st * 2.0 + shift;
    }
    return rand;
}

float fbmO(vec2 st, int octaves){
    float rand = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.5));
    float shift = 100.0;
    for(int i = 0; i < octaves; i++){
        rand += amp * noise(st * freq);
        amp *= 0.5;
        st = rot * st * 2.0 + shift;
    }
    return rand;
}

float fbm(vec3 p, int octaves){
    mat3 q = mat3(cos(0.5), sin(0.5), 0.0,
                  -sin(0.5), cos(0.5),  0.0,
                  0.0, 0.0, 1.0);
    
    float rand = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    float shift = 100.0;
    for(int i = 0; i < octaves; i++){
        rand += amp * noise(p * freq);
        amp *= 0.5;
        p = q * p * 2.0 + shift;
    }
    return rand;
}

vec3 voronoise(vec2 uv){
    vec2 f = fract(uv);
    f -= 0.5;
    vec2 i = floor(uv);
    vec2 pos = i;
    float dist = distance(f, rand22(i) - 0.5);
    for(int x = -1; x <= 1; x++){
        for(int y = -1; y <= 1; y++){
            vec2 p = i + vec2(x, y);
            float nDist = distance(f, rand22(p) + vec2(x, y) - 0.5);
            if(nDist < dist){
                dist = nDist;
                pos = p;
            }
        }
    }
    return vec3(dist, pos);
}


vec2 rot(vec2 uv, float a){
    mat2 mat = mat2(cos(a), -sin(a),
                   sin(a), cos(a));
    return mat * uv;
}

mat3 rotate(vec3 v, float a){
    float s = sin(a);
    float c = cos(a);
    float ic = 1.0 - c;

    return mat3( v.x * v.x * ic + c,     v.y * v.x * ic - s * v.z,  v.z * v.x * ic + s * v.y,
                v.x * v.y * ic + s * v.z, v.y * v.y * ic + c,       v.z * v.y * ic - s * v.x,
                v.x * v.z * ic - s * v.y, v.y * v.z * ic + s * v.x,  v.z * v.z * ic + c );
}

float waterHeight(vec2 pos, float t){
  vec2 fUV = pos * .2;
  float f = fbm(fUV +  fbm(vec3(fUV + t * .5, t * .3 + sin(t) * .3), 4) + t * .25) * .1;
  return f;
}