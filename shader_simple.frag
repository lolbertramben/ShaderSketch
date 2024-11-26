precision highp float;

varying vec2 pos;

void main() {
  gl_FragColor = vec4(pos, 1.0, 1.0);
}