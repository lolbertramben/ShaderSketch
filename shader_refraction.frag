precision highp float;

uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;
uniform samplerCube iSky;

#define PI 3.14159265359
#define TAU 6.28318530718
#define IOR 1.3 // Index of refraction
#define abb .01 // Absorption
#define density .1 // Optical density
#define maxDist 100.
#define minDist .01
#define maxSteps 100

vec3 glasscol = vec3(0.06,0.1,0.15);

// Sphere
float sdSphere(vec3 p, float s) {
  return length(p) - s;
}
// Box
float sdBox( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// Rotate 2D
mat2 rot2D(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Generate a random noise
float noise(vec3 p, float scale, float amount) {
  float noise = fract(sin(dot(p, vec3(12.9898, 78.233, 151.7182))) * 43758.5453);
  noise *= scale * amount;
  return clamp(noise, -1.0, 1.0);
}

float scene(vec3 p) {
    //box
    // p.xy *= rot2D(iTime);
    // p.xz *= rot2D(iTime);
    // float box = sdBox(p, vec3(1.));
    // return box;
    float sphere = sdSphere(p, 1.);
    return sphere;
}

float RayMarch(vec3 ro, vec3 rd, float side) {
    float t = 0.;
    
    for(int i=0; i<maxSteps; i++) {
        vec3 p = ro + rd * t;
        float d = scene(p) * side;
        t += d;
        if( t>maxDist || abs(d)<minDist) break;
    }
    
    return t;
}

vec3 GetNormal(vec3 p) {
    vec2 e = vec2(.001, 0);
    vec3 n = scene(p) - 
        vec3(scene(p-e.xyy), scene(p-e.yxy),scene(p-e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 
        f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u;
    return normalize(i);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    vec2 m = (iMouse.xy * 2. - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(0, 0, -3);
    ro.yz *= rot2D(m.y);
    ro.xz *= rot2D(-m.x * TAU);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.);
    
    vec3 col = textureCube(iSky, rd).rgb;
   
    float t = RayMarch(ro, rd, 1.); // outside of object
    
    if(t<maxDist) {
        vec3 p = ro + rd * t; // 3d hit position
        vec3 n = GetNormal(p); // normal of surface... orientation
        vec3 r = reflect(rd, n);
        vec3 refl = textureCube(iSky, r).rgb;
        
        vec3 rdIn = refract(rd, n, 1./IOR); // ray dir when entering
        
        vec3 pEnter = p - n*minDist*3.;
        float tIn = RayMarch(pEnter, rdIn, -1.); // inside the object
        
        vec3 pExit = pEnter + rdIn * tIn; // 3d position of exit
        vec3 nExit = -GetNormal(pExit); 
        
        // Chromatic Abberration
        vec3 reflTex = vec3(0.);
        vec3 rdOut = vec3(0.);
    
        // Red
        rdOut = refract(rdIn, nExit, IOR-abb);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.r = textureCube(iSky, rdOut).r;

        // Green
        rdOut = refract(rdIn, nExit, IOR);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.g = textureCube(iSky, rdOut).g;

        // Blue
        rdOut = refract(rdIn, nExit, IOR+abb);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.b = textureCube(iSky, rdOut).b;

        // Ray Absorbtion (optical distance)
        float optDist = exp(-tIn*density);

        vec3 transTex = vec3(reflTex * .8 + col * .8);
        reflTex = mix(reflTex * optDist * glasscol*4., transTex, .04);

        // Fresnel
        float fresnel = pow(1. + dot(rd, n), 3.);
        col = mix(reflTex, refl, fresnel);
    }
    
    col = pow(col, vec3(.4545));	// gamma correction

    gl_FragColor = vec4(col, 1.);
}