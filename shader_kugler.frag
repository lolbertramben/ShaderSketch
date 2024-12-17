precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

#define rot(a) mat2(cos(a), sin(a), -sin(a), cos(a))

float yRes;

// Erstatning for tanh-funktionen
vec2 tanhApprox(vec2 x) {
    return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
}

vec2 func(vec2 p) {
    return tanhApprox(vec2(cos(p.x * 3.0), sin(p.y * 2.0)) * 5.0 + 3.0);
}

float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 c = vec2(1.0, 0.0);
    f *= f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + c.yy), hash(i + c.xy), f.x),
        mix(hash(i + c.yx), hash(i + c.xx), f.x),
        f.y
    );
}

float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 7; ++i) {
        v += a * noise(x);
        x = rot(0.5) * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Ny round-implementering
float round(float x) {
    return floor(x + 0.5);
}

vec2 round(vec2 v) {
    return vec2(round(v.x), round(v.y));
}

float shadowBG(vec2 p, vec3 lightPos) {
    vec3 normal = vec3(0.0, 0.0, -0.5);
    vec3 l = normalize(lightPos - vec3(p, 2.0));
    return dot(normal, l);
}

vec3 carpet(vec2 p, vec3 lightPos, float scale, float amount, float lineWidth) {
    float light = shadowBG(p, lightPos);

    vec3 col = vec3(0.2);
    col *= sin((p.x - p.y) * yRes / (0.5 + lineWidth)) 
                * (round(hash(p)) * 0.34 + 0.18) + 1.0;
    
    float noiseVal = fbm(p * scale);
    noiseVal = mix(noiseVal, sin(noiseVal * 120.0 - cos(noiseVal * 420.0)), 0.2);
    col *= noiseVal * amount + 2.0;

    return pow(light * col, 1.0 - vec3(9.0, 8.0, 7.0) / 20.0);
}

vec3 carpet(vec2 p) {
    vec3 lightPos = vec3(cos(iTime), sin(iTime), 0.1);
    return carpet(p, lightPos, 0.4, 0.2, 1.2);
}

void main() {
    vec2 R = iResolution.xy;
    yRes = min(R.y, 800.0);
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 P = (2.0 * fragCoord - R) / yRes;
    vec2 p = P * 2.0;

    vec3 col = carpet(P);

    vec2 q = fract(p) - 0.5;
    vec2 rnd = vec2(3.0, 2.0) * hash(floor(p)) * 6.3 + iTime * 0.4;
    vec2 k = 0.18 * func(rnd);

    float d = length(q - k) - 0.3;
    float mask = smoothstep(0.02, 0.0, d);

    if (iMouse.z > 0.001 || fract(iTime * 0.07) < 0.2)
        col *= smoothstep(0.0, 0.01, max(q.x, q.y) - 0.48);

    vec2 pS = p + 0.2;
    vec2 rndS = vec2(3.0, 2.0) * hash(floor(pS)) * 6.3 + iTime * 0.4;
    vec2 kS = 0.18 * func(rndS);
    vec2 h = fract(pS) - 0.5;
    float dS = length(h - kS) - 0.2;
    float maskS = smoothstep(0.2, -0.2, dS);

    col = 0.5 - mix(
        col,
        vec3(length((h - kS + 0.5) * 0.9)),
        maskS * 0.4
    );

    col = mix(col, vec3(length((q - k + 0.5) * 1.2)), mask);

    gl_FragColor = vec4(col, 1.0);
}
