let shaderProgram;
let version = 'refraction';
let cubeMap;
const texture = 'soft_dark_upscale';

function preload() {
    shaderProgram = loadShader(`shader_base.vert`, `shader_${version}.frag`);
    // cubeMap = {
    //     px: loadImage('assets/night_sky_px.png'),
    //     nx: loadImage('assets/night_sky_nx.png'),
    //     py: loadImage('assets/night_sky_py.png'),
    //     ny: loadImage('assets/night_sky_ny.png'),
    //     pz: loadImage('assets/night_sky_pz.png'),
    //     nz: loadImage('assets/night_sky_nz.png')
    // };
    cubeMap = {
        px: loadImage(`assets/textures/${texture}.jpg`),
        nx: loadImage(`assets/textures/${texture}.jpg`),
        py: loadImage(`assets/textures/${texture}.jpg`),
        ny: loadImage(`assets/textures/${texture}.jpg`),
        pz: loadImage(`assets/textures/${texture}.jpg`),
        nz: loadImage(`assets/textures/${texture}.jpg`)
    };
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('p5');
    shader(shaderProgram);
    noStroke();
    textureMode(NORMAL);

    gl = canvas.GL;
    createCubeMapTexture();
}

function createCubeMapTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faces = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, img: cubeMap.px },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, img: cubeMap.nx },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, img: cubeMap.py },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, img: cubeMap.ny },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, img: cubeMap.pz },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, img: cubeMap.nz }
    ];

    faces.forEach((face) => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face.img.canvas);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });

    shaderProgram.setUniform('iSky', texture);
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