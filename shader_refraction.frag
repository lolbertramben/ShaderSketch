precision highp float;

uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;
uniform samplerCube iSky;
//scene
#define PI 3.14159265359
#define TAU 6.28318530718
#define fov 1.5
#define IOR 1.3 // Index of refraction
#define abb .01 // Absorption
#define density .1 // Optical density
#define maxDist 100.
#define minDist .01
#define maxSteps 100
//Snow 3D
#define layers 100
#define depth 0.2
#define width 0.9
#define speed 0.8

const vec3 glasscol = vec3(0.06,0.1,0.15);

const mat3 pSnow = mat3(13.323122,23.5112,21.71123,21.1212,28.7312,11.9312,21.8112,14.7212,61.3934);
float rnd(float n) {return fract(sin(n * 0.1346) * 43758.5453123);}

vec3 snow(vec2 uv) {
    vec3 snowColor = vec3(0.);
    float dof = 5. * sin(iTime * .1);
    for(int i=0; i<layers; i++) {
        float fi = float(i);
        vec2 q = uv*(1. + fi*depth);
        q += vec2(q.y*(width*mod(fi*7.238917, 1.)-width*.5), speed*iTime/(1. + fi*depth*.03));
        vec3 n = vec3(floor(q), 31.189+fi);
        vec3 m = floor(n)*.00001 + fract(n);
        vec3 mp = (31415.9 + m) * fract(pSnow*m);
        vec3 r = fract(mp);
        vec2 s = abs(mod(q,1.)-.5+.9*r.xy-.45);
	    s += .01*abs(2.*fract(10.*q.yx)-1.); 
	    float d = .6*max(s.x-s.y,s.x+s.y)+max(s.x,s.y)-.01;
	    float edge = .005+.05*min(.5*abs(fi-5.-dof),1.);
	    snowColor += vec3(smoothstep(edge,-edge,d)*(r.x/(1.+.02*fi*depth)))*3.;
    }
    return snowColor;
}

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
    vec2 m = vec2(0);
    m.x = (iMouse.x * 2. - iResolution.x) / iResolution.x;
    m.y = (iMouse.y * 2. - iResolution.y) / iResolution.y;


    vec3 ro = vec3(0, 0, -3);
    ro.yz *= rot2D(m.y/2.);
    ro.xz *= rot2D(-m.x/2.);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), fov);
    
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

        vec3 transTex = reflTex * 0.8 + col * 0.8;
        reflTex = mix(reflTex * optDist * glasscol * 4.0, transTex, 0.04);

        // Fresnel
        float fresnel = pow(1. + dot(rd, n), 3.);
        col = mix(reflTex, refl, fresnel);

        // Snow
        uv = -iMouse.xy/iResolution.xy + vec2(1.,iResolution.y/iResolution.x)*gl_FragCoord.xy / iResolution.xy;
        vec3 snowColor = snow(-rdOut.xy);
        col += snowColor;
        
    
    }
    
    col = pow(col, vec3(.4545));	// gamma correction

    gl_FragColor = vec4(col, 1.);
}