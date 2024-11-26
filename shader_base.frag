precision highp float;

uniform vec2 iResolution;

// Distance to the scene (Objects)
float map(vec3 p) {
  return length(p) - 1.0;  // distance to a sphere with radius 1
}

void main() {
  vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;

  // initialize the ray
  vec3 rayOrigin = vec3(0.0, 0.0, -3.0);  // Ray origin
  vec3 rayDir = normalize(vec3(uv, 1.0)); // Ray direction with length 1
  vec3 col = vec3(0.0);                   // Color of the pixel

  float t = 0.0;                          // total distance traveled by the ray

  // Raymarching
  const int maxSteps = 80;                // Maximum number of steps
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = rayOrigin + rayDir * t;      // The ray's current position
    float d = map(p);                     // Distance to the scene
    t += d;                               // Move the ray along the direction by the distance to the scene
    //col = vec3(float(i)) / float(maxSteps); // Color based on the number of steps taken by the ray
    if (d < 0.001 || t > 100.) break;      // If the distance is very small, we assume the ray has hit the object  }
  }
  // Coloring
  col = vec3(t * 0.2);                    // Color based on the distance traveled by the ray

  gl_FragColor = vec4(col, 1.0);
}