let shaderProgram;

function preload() {
    // Load the vertex and fragment shaders
    let vertShader = loadStrings('test.vert');
    let fragShader = loadStrings('test.frag');
    
    // Create the shader program
    shaderProgram = createShader(vertShader.join('\n'), fragShader.join('\n'));
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('p5');
    noStroke();
}

function draw() {
    background(255); // Clear the background every frame
    
    // Use the shader program
    shader(shaderProgram);
    
    // Draw a rectangle that covers the entire canvas
    rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}