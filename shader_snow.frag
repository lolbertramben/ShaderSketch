precision highp float;

uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;

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


// Distance to the scene (Objects)
float map(vec3 p) {
  // Sphere transform
  vec3 spherePos = vec3(.0, .0, 1.0); // Sphere position
  float sphere = sdSphere(p - spherePos, .5); // Sphere SDF
  // Box transform
  vec3 pBox = p;
  pBox.xy *= rot2D(iTime); // Rotate the box
  pBox.xz *= rot2D(iTime); // Rotate the box
  float box = sdBox(pBox, vec3(.1)); // Box SDF
  // Ground plane
  float ground = p.y + 0.75; // Ground plane

  return min(ground, min(box, sphere)); // Union of the sphere and the box
}

// Ray Marching
float rayMarching (vec3 rayOrigin, vec3 rayDir) {
  float t = 0.0;                         // Distance traveled by the ray

  const int maxSteps = 100;                // Maximum number of steps
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = rayOrigin + rayDir * t;      // The ray's current position
    float d = map(p);                     // Distance to the scene
    t += d;                               // Move the ray along the direction by the distance to the scene
    //col = vec3(float(i)) / float(maxSteps); // Color based on the number of steps taken by the ray
    if (d < 0.01 || t > 50.) break;      // If the distance is very small, we assume the ray has hit the object  }
  }

  return t;
}

// Get normals
vec3 getNormal(vec3 p) {
  float dist = map(p);
  vec2 e = vec2(0.001, 0.0);

  vec3 normal = vec3(
    map(p + e.xyy),
    map(p + e.yxy),
    map(p + e.yyx)
  ) - dist;
  return normalize(normal);
}

// Get Light
float getLight(vec3 p) {
  vec3 lightPos = vec3(0.0, 5.0, 1.0); // Light position
  lightPos.xz *= rot2D(iTime)*2.; // Rotate the light
  vec3 lightDir = normalize(lightPos - p); // Light direction
  vec3 normal = getNormal(p); // Normal at the point
  float diffuseLight = clamp(dot(normal, lightDir), 0., 1.); // Diffuse lighting
  // Shadows
  float t = rayMarching(p + normal * 0.01, lightDir); // Distance to the light
  if (t < length(lightPos - p)) diffuseLight *= 0.1; // Shadow

  return diffuseLight; // Diffuse lighting
}

void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 m = (iMouse.xy * 2. - iResolution.xy) / iResolution.y;

  // Camera Initialization
  float fov = .6;                     // Field of view
  // initialize the ray
  vec3 rayOrigin = vec3(0.0, 0.0, -3.0);  // Ray origin
  vec3 rayDir = normalize(vec3(uv * fov, 1.0)); // Ray direction with length 1

  // // Mouse movement horizontal
  // rayOrigin.yz *= rot2D(m.y);
  // rayDir.yz *= rot2D(m.y);  
  
  // // Mouse movement horizontal
  // rayOrigin.xz *= rot2D(-m.x);
  // rayDir.xz *= rot2D(-m.x);                         // total distance traveled by the ray

  // Raymarching
  float t = rayMarching(rayOrigin, rayDir);

  // Lighting
  vec3 p = rayOrigin + rayDir * t;
  float diffuseLight = getLight(p);

  // Coloring
  vec3 col = vec3(0.0); 
  //col = getNormal(p); // Color based on the normal
  col = vec3(diffuseLight);
  //col = vec3(t * fog);                    // Color based on the distance traveled by the ray
  //col *= noise(gl_FragCoord.xyz, 1., 1.); // Add noise

  gl_FragColor = vec4(col, 1.0);
}