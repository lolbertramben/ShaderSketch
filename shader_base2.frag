precision highp float;

uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;

// Sphere
float sdSphere(vec3 p, float s) {
  return length(p) - s;
}
// Box
float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
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

// Color palettes
vec3 palette( float t ){
    vec3 a = vec3(0.5,0.5,0.5);
    vec3 b = vec3(0.5,0.5,0.5);
    vec3 c = vec3(1.0,1.0,1.0);
    vec3 d = vec3(0.30, 0.20, 0.20);
    return a + b*cos( 6.283185*(c*t+d) );
  }

// Distance to the scene (Objects)
float map(vec3 p) {
  // Sphere transform
  // vec3 spherePos = vec3(sin(iTime)*2.0, .0, 1.0); // Sphere position
  // float sphere = sdSphere(p - spherePos, .5); // Sphere SDF
  p.z += iTime * .4;
  // Box transform
  vec3 pBox = p;
  pBox -= vec3(.0, cos(iTime)*1.0, .0); // Box position
  pBox = fract(pBox) - 0.5; // Repeat the scene
  pBox.xy *= rot2D(iTime); // Rotate the box
  pBox.xz *= rot2D(iTime); // Rotate the box
  float box = sdBox(pBox, vec3(.1)); // Box SDF

  //float ground = p.y + 0.75; // Ground plane

  return box; // Union of the sphere and the box
}

void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 m = (iMouse.xy * 2. - iResolution.xy) / iResolution.y;

  // Camera Initialization
  float fov = .6; 
  float fog = .05;                       // Field of view
  // initialize the ray
  vec3 rayOrigin = vec3(0.0, 0.0, -3.0);  // Ray origin
  vec3 rayDir = normalize(vec3(uv * fov, 1.0)); // Ray direction with length 1
  vec3 col = vec3(0.0);                   // Color of the pixel

  float t = 0.0; 

  // Mouse movement horizontal
  rayOrigin.yz *= rot2D(m.y);
  rayDir.yz *= rot2D(m.y);  
  
  // Mouse movement horizontal
  rayOrigin.xz *= rot2D(-m.x);
  rayDir.xz *= rot2D(-m.x);                         // total distance traveled by the ray

  // Raymarching
  const int maxSteps = 100;                // Maximum number of steps
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = rayOrigin + rayDir * t;      // The ray's current position
    float d = map(p);                     // Distance to the scene
    t += d;                               // Move the ray along the direction by the distance to the scene
    //col = vec3(float(i)) / float(maxSteps); // Color based on the number of steps taken by the ray
    if (d < 0.001 || t > 100.) break;      // If the distance is very small, we assume the ray has hit the object  }
  }
  // Coloring
  // col = vec3(t * fog);                    // Color based on the distance traveled by the ray
  col = palette(t * fog);

  gl_FragColor = vec4(col, 1.0);
}