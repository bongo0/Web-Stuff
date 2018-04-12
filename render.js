
//----WEBGL STUFF---------------------------
let canvas = document.getElementById('glCanvas');
let gl; // global var for WebGL context

let vertexSource =
        `
    attribute vec4 vertexPos;
    attribute vec4 vertexColor;
    attribute vec3 offset;
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform float dt;
    
    varying mediump vec4 vColor;
    void main(){
        vec4 worldPos = modelMatrix * vertexPos;
        worldPos += vec4(offset.x, offset.y + sin(dt+offset.x/4.0)*2.0, offset.z+ sin(dt+offset.y/4.0)*2.0 , 0.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vColor = vec4(vertexColor.r+0.5*sin(dt+offset.x/10.0)*sin(dt),
                    vertexColor.g+0.5*sin(dt+offset.y/10.0)*sin(dt),
                    vertexColor.b+0.5*sin(dt)*sin(dt),
                    vertexColor.a);
    }`;
let fragmentSource =
    `
    precision mediump float;
    varying mediump vec4 vColor;
    void main(){
        gl_FragColor = vColor;
    }
    `;

//------------------------------------------
//--------" MAIN "--------------------------
//------------------------------------------
initWebGL(canvas);

// setup shader program
let vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
let fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
let shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
gl.useProgram(shaderProgram);

// get shader attributes
let vertexPosAttribute = gl.getAttribLocation(shaderProgram, 'vertexPos');
gl.enableVertexAttribArray(vertexPosAttribute);

let vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'vertexColor');
gl.enableVertexAttribArray(vertexColorAttribute);

let instanceOffsetAttribute = gl.getAttribLocation(shaderProgram, 'offset');
gl.enableVertexAttribArray(instanceOffsetAttribute);

//==CAMERA==================================
let camera = new Camera(canvas);

//==========================================
//MATRIX STUFF
// define transformation matrices
let modelMatrix = Matrix.make3DTranslationMatrix([0,0,-100]);
let viewMatrix = camera.viewMatrix;
let projectionMatrix = Matrix.makeProjectionMatrix(Math.PI*(5/12)/*75deg*/, 0.1, 100, gl.canvas.clientWidth/gl.canvas.clientHeight);

// get matrices uniform locations
let modelLoc = gl.getUniformLocation(shaderProgram, 'modelMatrix');
let projectionLoc = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
let viewLoc = gl.getUniformLocation(shaderProgram, 'viewMatrix');
let dtLoc = gl.getUniformLocation(shaderProgram, 'dt');
//==========================================

// data
let positions = [
      // pos         // color
     1.0,  1.0,  0.0,   1.0, 0.0, 0.0, 1.0,
    -1.0, 1.0,  0.0,    0.0, 1.0, 0.0, 1.0,
    1.0,  -1.0, 0.0,    0.0, 0.0, 1.0, 1.0,
    -1.0, -1.0, 0.0,    1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 2.0,      0.0, 1.0, 1.0, 1.0 
  ];

  let indices = [
      0, 1, 2,  1, 2, 3, // base
      0, 1, 4, // sides
      0, 2, 4,
      2, 3, 4,
      1, 3, 4
  ];

  let offsets = [
      /*0.0, 0.0, 0.0,
      0.0, 3.0, 0.0,
      0.0, -3.0, 0.0,
      3.0, 0.0, 0.0,
      -3.0, 0.0, 0.0,
      3.0, 3.0, 0.0,
      -3.0, 3.0, 0.0,
      -3.0, -3.0, 0.0,
      3.0, -3.0, 0.0*/
  ];

  for(let i = -100; i < 100; i+=2){
      for(let j = -100; j < 100; j+=2){
          offsets.push(i,j,-49);
      }
  }

  let INSTANCE_COUNT = offsets.length/3;

// Extension for draving instanced arrays
let ext = gl.getExtension("ANGLE_instanced_arrays");
if(ext == null){
    alert('your browser sucks:: no support for ANGLE_instanced_arrays');
}

// setting up vertex buffer
let vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
// setting up vertex attrib pointers
// for documentation
  const GL_FLOAT_SIZE = 4;
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 3;          // 3 components per iteration
  let type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = GL_FLOAT_SIZE*7;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(vertexPosAttribute, size, type, normalize, stride, offset);
gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, GL_FLOAT_SIZE*7, GL_FLOAT_SIZE*3);

// vertex index buffer setup. in which order vertex data is to be drawn
// when drawing ELEMENTS
let vertexIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// world offsets for different instances of the model
let offsetBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);
gl.vertexAttribPointer(instanceOffsetAttribute, 3, gl.FLOAT, false, 0, 0);
ext.vertexAttribDivisorANGLE(instanceOffsetAttribute, 1);


// if canvas has been resized update viewport size and stuff
  resizeEventGL();

  // enable depth test
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

setInterval(draw, 15);
//------------------------------------------
//------------------------------------------
//------------------------------------------

let lastFrame = 0;
let deltaTime = 0;
let angle = 0;
let fps = 0;
let dt = 0;
// draw loop function
function draw(){
    // frame timings
    let currentFrame = (new Date).getTime();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;
    // dont know how this should be done
    fps = 1000/deltaTime;
   
    // stuff for if window resized
    resizeEventGL();

    // Clear the canvas
    gl.clearColor(0.22, 0.16, 0.21, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //=============================================
    // setup matrices
    camera.update(deltaTime);
    modelMatrix = Matrix.make3DTranslationMatrix([0,0,-10]);
    viewMatrix = camera.viewMatrix;
    projectionMatrix = Matrix.makeProjectionMatrix(Math.PI/2 /*75deg*/, 0.1, 1000, gl.canvas.clientWidth/gl.canvas.clientHeight);
    //=============================================

    //=========
    //rotating the quad
    angle += deltaTime*(1/1000);
    if(angle >= 2*Math.PI){angle = 0;}
    let rm = Matrix.makeRotationMatrix([1,1,1], angle);
    modelMatrix = modelMatrix.mult(rm);
    //=========

        // Bind the position buffer.
    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,vertexIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    //send matrix data
                    //  uniformLoc,   do transpose,     data
    gl.uniformMatrix4fv(modelLoc,      false,          modelMatrix.getFloat32Array());
    gl.uniformMatrix4fv(viewLoc, false, viewMatrix.getFloat32Array());
    gl.uniformMatrix4fv(projectionLoc, false, projectionMatrix.getFloat32Array());
    gl.uniform1f(dtLoc, dt+=0.1);
    // draw                       offset, count
    //gl.drawArrays(gl.TRIANGLE_STRIP, 0,    4  );
    //gl.drawElements(gl.TRIANGLES,18, gl.UNSIGNED_SHORT, 0);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0, INSTANCE_COUNT);
}

function initWebGL(canvas){
    gl = null;
    // try to get webgl
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if(!gl){
        alert('your browser sucks');
    }
    return gl;
}

// calls resizeEventGL when window is resized
//window.addEventListener('resize',resizeEventGL,true);
function resizeEventGL(){
    let realToCSSPixels = window.devicePixelRatio;
    // change global variables
    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    let width = Math.floor(gl.canvas.clientWidth*realToCSSPixels);
    let height = Math.floor(gl.canvas.clientHeight*realToCSSPixels);
    // change canvas size
    if(gl.canvas.width !== width || gl.canvas.height !== height){
        gl.canvas.width = width;
        gl.canvas.height = height;
    }

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

}

//----SHADER LOADING COMPILING STUFF----------------------

function createShaderProgram(gl, vertexS, fragmentS){
    // create shader programs
    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexS);
    gl.attachShader(shaderProgram, fragmentS);
    gl.linkProgram(shaderProgram);
    //check for errors
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        console.log('ERROR::LINKING_SHADER_PROGRAM:: ', + gl.getProgramInfoLog(shaderProgram));
    }
    return shaderProgram;
}

// for getting and compiling the shader source codes
// pass gl context, html script id, type of the shader
function createShader(gl, source, type){
    let shader;
    shader = gl.createShader(type);
    // give the shader the source code
    gl.shaderSource(shader, source);
    // compile
    gl.compileShader(shader);
    // check for errors
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        console.log('ERROR::SHADER_COMPILE:: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
//------------------------------------------------------
