precision highp float;

attribute vec3 aPosition;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aPosition.xy * 0.5 + 0.5;
    vec4 position = vec4(aPosition, 1.0);
    position.xy = position.xy * 2.0 - 1.0;

    gl_Position = position;
}
