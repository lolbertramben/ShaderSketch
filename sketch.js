let shaderProgram;
let version = 'glass';
function preload() {
    shaderProgram = loadShader(`shader_base.vert`, `shader_${version}.frag`);
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('p5');
    shader(shaderProgram);
    noStroke();
}

function draw() {
    clear();

    // Pass the time and resolution to the shader
    shaderProgram.setUniform('iTime', millis() / 1000.0);
    shaderProgram.setUniform('iResolution', [width, height]);
    shaderProgram.setUniform('iMouse', [mouseX, mouseY, mouseIsPressed ? 1.0 : 0.0, 0.0]);


    // Draw a rectangle that covers the entire canvas
    rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}