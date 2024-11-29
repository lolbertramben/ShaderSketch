let shaderProgram;
let version = 'refraction';
let cubeMap;
const texture = 'drawing';

function preload() {
    shaderProgram = loadShader(`shader_base.vert`, `shader_${version}.frag`);
    cubeMap = {
        px: loadImage(`assets/textures/${texture}.jpg`),
        nx: loadImage(`assets/textures/${texture}.jpg`),
        py: loadImage(`assets/textures/${texture}.jpg`),
        ny: loadImage(`assets/textures/${texture}.jpg`),
        pz: loadImage(`assets/textures/${texture}.jpg`),
        nz: loadImage(`assets/textures/${texture}.jpg`)
    };
    reflectionMap = {
        px: loadImage(`assets/textures/reflection.jpg`),
        nx: loadImage(`assets/textures/reflection.jpg`),
        py: loadImage(`assets/textures/reflection.jpg`),
        ny: loadImage(`assets/textures/reflection.jpg`),
        pz: loadImage(`assets/textures/reflection.jpg`),
        nz: loadImage(`assets/textures/reflection.jpg`)
    };
}

let isShake = false;
let blizzardFactor = 0.0;
let lerpTo = 0.0;
let step = 0.05;
let mousePrev = [0, 0];


function setup() {
    let canvas = createCanvas(1024, 1024, WEBGL);
    canvas.parent('p5');
    shader(shaderProgram);
    noStroke();
    textureMode(NORMAL);

    gl = canvas.GL;
    createCubeMapTexture();
    mousePrev = [mouseX, mouseY];

    // Check if the user is on a mobile device
    isMobile = checkIfMobile();
    console.log(isMobile);

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        document.body.addEventListener('click', function() {
          DeviceMotionEvent.requestPermission()
            .then(function() {
              console.log('DeviceMotionEvent enabled');
      
              motion = true;
              ios = true;
            })
            .catch(function(error) {
              console.warn('DeviceMotionEvent not enabled', error);
            })
        })
    }
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

    const reflectionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflectionTexture);

    const facesRefl = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, img: reflectionMap.px },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, img: reflectionMap.nx },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, img: reflectionMap.py },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, img: reflectionMap.ny },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, img: reflectionMap.pz },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, img: reflectionMap.nz }
    ];

    facesRefl.forEach((face) => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflectionTexture);
        gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face.img.canvas);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });

    shaderProgram.setUniform('iReflection', reflectionTexture);
}

function lerpCustom(min, max, t) {
    return min + (max - min) * t;
}
function clampToBinary(value) {
    return max(0.0, min(1.0, value > 0.999 ? 1.0 : (value < 0.001 ? 0.0 : value)));
}
function checkIfMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iPad|iPhone|iPod/i.test(userAgent);
}

function draw() {
    clear();
    // mouse position
    let mouse = [mouseX, mouseY];
    let zMotion = round(rotationZ)
    // x and y values moved from the centre point
    let yMotion = round(rotationX)
    let xMotion = round(rotationY)

    console.log("z: ",zMotion, "y: ",yMotion, "x: ",xMotion);

    if (mouse[0] !== mousePrev[0] || mouse[1] !== mousePrev[1]) {
        isShake = true;
    } else if (isMobile && (zMotion > 10 || yMotion > 10 || xMotion > 10)) {
        isShake = true;
    } else {
        isShake = false;
    }

    if (isShake) {
       lerpTo = 1.0; 
       step = 0.05;
    } else {
        lerpTo = 0.0;
        step = 0.02;
    }

    blizzardFactor = lerpCustom(blizzardFactor, lerpTo, step);
    isShake = clampToBinary(isShake);

    // Pass the time and resolution to the shader
    shaderProgram.setUniform('iTime', millis() / 1000.0);
    shaderProgram.setUniform('iResolution', [1024, 1024]);
    shaderProgram.setUniform('iMouse', [mouseX, mouseY, mouseIsPressed ? 1.0 : 0.0, 0.0]);
    shaderProgram.setUniform('iBlizzardFactor', blizzardFactor);
    
    // Draw a rectangle that covers the entire canvas
    rect(-width / 2, -height / 2, width, height);
    mousePrev = [mouseX, mouseY];
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}