let shaderProgram;
let vertShader, fragShader;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('p5');

    // Load the vertex shader
    loadStrings('vert.glsl', (result) => {
        vertShader = result.join('\n');
        checkShadersLoaded();
    });
    
    // Load the fragment shader
    loadStrings('frag.glsl', (result) => {
        fragShader = result.join('\n');
        checkShadersLoaded();
    });
}

function checkShadersLoaded() {
    if (vertShader && fragShader) {
        shaderProgram = createShader(vertShader, fragShader);
    }
}

function draw() {
    background(255);
    noStroke();
    
    // Use our custom shader
    shader(shaderProgram);
    
    // Pass the time from p5 to the shader
    shaderProgram.setUniform('time', millis());
    
    // Draw a shape using the shader
    circle(0, 0, 100);
  }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}