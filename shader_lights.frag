precision highp float;

uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;

// Tweakable parameters
float fov = .6; // Field of view
float maxTravelDistance = 25.; // Amount of visible balls
float ballSize = 1.; //auto: 1. : mouse: .35 Size of the balls
float ballsInFrame = .2; //auto: .2 : mouse: 20. Number of balls in the frame

// PI
float PI = 3.1415926535897932384626433832795;

// Sphere
float sdSphere(vec3 p, float s) {
  return length(p) - s;
}
// Box
float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  float sphere = length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
  return sphere = smoothstep(0.0, .001, sphere);
}

// Smooth minimum
float smin( float a, float b, float k )
{
  float h = max( k-abs(a-b), 0.0 )/k;
  return min( a, b ) - h*h*h*k*(1.0/6.0);
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
  return clamp(noise, 0.0, 1.0);
}

// Color palettes
vec3 palette( float t ){
    vec3 a = vec3(0.5,0.5,0.5);
    vec3 b = vec3(0.5,0.5,0.5);
    vec3 c = vec3(1.0,1.0,1.0);
    vec3 d = vec3(0.30, 0.20, 0.20);
    return a + b*cos( 6.283185*(c*t+d) );
}

// Scene
float map(vec3 p) {

  // Sphere transform
  p.z -= ballsInFrame;
  //p.xy = fract(p.xy) - 0.5; // Repeat the scene
  float sphere = sdSphere(p, ballSize); // Box SDF
  //float ground = p.y + 0.75; // Ground plane

  return sphere; // Union of the sphere and the box
}

void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 m = (iMouse.xy * 2. - iResolution.xy) / iResolution.y;

  // Camera Initialization
  fov = .6; 
  float fog = .01;                       // Field of view
  // initialize the ray
  vec3 rayOrigin = vec3(0.0, 0.0, -3.0);  // Ray origin
  vec3 rayDir = normalize(vec3(uv * fov, 1.0)); // Ray direction with length 1
  vec3 col = vec3(1.0);                   // Color of the pixel
  float t = 0.0;     


  // Raymarching
  const int maxSteps = 100;                // Maximum number of steps
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = rayOrigin + rayDir * t;      // The ray's current position
    float d = map(p);                     // Distance to the scene
    t += d;                                // Move the ray along the direction by the distance to the scene
    
    //Ray Transforms
    // rayOrigin.y += sin(clamp(-m.y, -1., 1.)) * 0.01;
    // rayOrigin.x += sin(clamp(m.x, -1., 1.)) * 0.01;
    // rayOrigin.z += sin(-1.) * 0.01;  

    rayOrigin.y += sin(iTime*1.2) * 0.001;
    rayOrigin.x += cos(iTime*0.9) * 0.001;
    rayOrigin.z += sin(iTime*0.5) * 0.008;

    // Coloring
    col = vec3(float(i)) / float(maxSteps); // Color based on the number of steps taken by the ray
    if (d < 0.001 || t > maxTravelDistance) break;      // If the distance is very small, we assume the ray has hit the object  }
  }
  // Coloring
  //col += vec3(t * fog);                    // Color based on the distance traveled by the ray
  col *= noise(gl_FragCoord.xyz, .5, 4.); // Add noise

  gl_FragColor = vec4(col, 1.0);
}