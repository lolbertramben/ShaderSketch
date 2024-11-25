precision highp float;

attribute vec3 aPosition;

// The transform of the object being drawn
uniform mat4 uModelViewMatrix;

// Transforms 3D coordinates to 2D screen coordinates
uniform mat4 uProjectionMatrix;

// A custom uniform with the time in milliseconds
uniform float time;

void main() {
  // Apply the camera transform
  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);

  // Use the time to adjust the position of the vertices
  viewModelPosition.x += 10.0 * sin(time * 0.01 + viewModelPosition.y * 0.1);

  // Tell WebGL where the vertex goes
  gl_Position = uProjectionMatrix * viewModelPosition;  
}