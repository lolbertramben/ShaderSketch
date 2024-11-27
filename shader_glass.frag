precision mediump float;

uniform vec2 iResolution; // Canvas-størrelse (fra p5.js: sketch.width, sketch.height)
uniform vec2 iMouse;      // Musens position (fra p5.js)
uniform float iTime;      // Tid i sekunder (fra p5.js)
uniform sampler2D texture0; // Samme som iChannel0
uniform sampler2D texture1; // Samme som iChannel1
uniform sampler2D texture2; // Samme som iChannel2
uniform sampler2D texture3; // Samme som iChannel3

float PI = 3.1415926535897932384626433832795;

// Rotate 2D
mat2 rot2D(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// Scene
float map(vec3 p) {
    return length(p) - 1.0;
}

// Get normal
vec3 nor(vec3 p) {
    float h = map(p);
    vec2 d = vec2(0.01, 0.0);
    return normalize(vec3(map(p + d.xyy), map(p + d.yxy), map(p + d.yyx)) - h);
}

vec3 bgcol = vec3(1.0, 1.0, 1.0);
vec3 glasscol = vec3(0.06, 0.1, 0.15);
float glassstep = 0.05;
float refr = 1.04;
float maxStep = 1.;

vec4 trace(vec3 rs, vec3 rd, vec2 fragCoord) {
    float t = 0.0;
    vec3 p = rs;
    float inside = 1.0;
    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);

    float A = dot(rd, rd);
    float B = 2.0 * dot(rd, rs);
    float C = dot(rs, rs) - 1.0;
    float q = B * B - 4.0 * A * C;
    float spheret = (-B - sqrt(max(0.0, q))) / (2.0 * A);

    p += rd * spheret;

    for (int i = 0; i < 50; ++i) {
        float h = map(p);
        h *= inside;

        // Finder ud af om vi er inde i kuglen
        if (h <= 0.0) {
            p += h * rd;
            vec3 n = nor(p);
            // nrd < 0.0 hvis vi er inde i kuglen
            float nrd = dot(n, rd) * inside;

            // Hvis inde i kuglen
            if (nrd < 0.0) {
                // Reflektionsvektoren
                vec3 rr = reflect(rd, n);
                // Reflektion
                float rocc = max(0.0, rr.y * 1. * inside);
                // Fresnel-effekten
                float fr = pow(1.0 + nrd, 5.0) * 0.99 + 0.01;

                col.xyz += col.w * fr * 3.0 * rocc * pow(texture2D(texture3, rr.xy).xyz, vec3(2.2));

                if (q > 0.1) rd = inside * normalize(refract(rd * inside, n, (inside < 0.0) ? refr : (1.0 / refr)));
                inside = -inside;
                col.w *= 0.95;
            }
        }
        // Beregn step-størrelse
        float step = max(0.01, abs(h) * 0.95);
        if (step > maxStep) {
            break; // Stop, hvis step-størrelsen er for stor
        }

        if (inside < 0.0) {
            step = min(step, glassstep);
            vec3 gcol = bgcol * 0.1;
            gcol = mix(gcol, vec3(0.5), -.9);
            float dd = 1. * 4.0;
            float k = exp(-step * dd);
            col.xyz += (1.0 - k) * col.w * gcol;
            col.w *= k;
            k = exp(-step * 0.5);
            col.xyz += (1.0 - k) * col.w * glasscol;
            col.w *= k;
        } else step = min(step, 5.0);
        p += step * rd;

        
        
    }

    col.w = 1.0 - col.w;
    col.xyzw *= smoothstep(0.0, 0.2, q);

    //
    float flot = (-1.0 - p.y) / rd.y;
    vec3 flo = p + flot * rd;
    vec3 bg = bgcol;
    if (dot(rd, flo - rs) > 0.0) {
        bg.xyz = vec3(sqrt(1.05 - 1.0 / dot(flo, flo)));
    }

    // Background pattern
    vec2 strip;
    float sca = 1.;
    strip.x = (atan(rd.x, rd.z) * sca * 12.0 / PI);
    strip.y = (asin(rd.y) * 6.0 * sca);
    strip = fract(strip);

    float stripe = smoothstep(0.05, 0.08, abs(length(strip) - 0.5));
    stripe *= smoothstep(0.05, 0.08, abs(length(1.0 - strip) - 0.5));
    //stripe = .1 - stripe;
    stripe *= smoothstep(0.0, 0.9, rd.y);
    bg *= 1.0 - stripe * 0.2;
    col.xyz += col.w * bg;
    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    vec2 m = (iMouse.xy * 2. - iResolution.xy) / iResolution.y;
    
    // Rotation X
    float th = (m.y * 0.1 - 0.5) * 1.0;
    vec3 rs = vec3(0, 0, -2.0);
    vec3 re = vec3(uv * 3.0, 2.0);
    rs.yz *= rot2D(th);
    re.yz *= rot2D(th);

    // Rotation Y
    th = (-m.x - 0.5) * 6.0 + iTime * 0.071 - 5.1;
    rs.xz *= rot2D(th);
    re.xz *= rot2D(th);

    // Ray marching
    vec3 rd = normalize(re - rs);
    vec4 col = trace(rs, rd, gl_FragCoord.xy);
    col += 4.0 / 255.0;
    col = mix(col, smoothstep(0., 1., col), 0.5);
    col = pow(col, vec4(.8));
    // Sort rim
    col *= vec4(smoothstep(2.0, 0.0, length(uv * vec2(0.5, .8))));
    col += vec4(212, 125, 11, 255)/255.;
    gl_FragColor = col;
}
