
//----WEBGL STUFF---------------------------
var canvas = document.getElementById('glCanvas');
var gl; // global var for WebGL context

var vertexSource =
    `
    attribute vec4 vertexPos;
    attribute vec4 vertexColor;
    attribute vec3 offset;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;

    varying mediump vec4 vColor;
    void main(){
        vec4 worldPos = modelMatrix * vertexPos;
        worldPos += vec4(offset, 0.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vColor = vertexColor;
    }`;
var fragmentSource =
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
var vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
var fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
var shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
gl.useProgram(shaderProgram);

// get shader attributes
var vertexPosAttribute = gl.getAttribLocation(shaderProgram, 'vertexPos');
gl.enableVertexAttribArray(vertexPosAttribute);

var vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'vertexColor');
gl.enableVertexAttribArray(vertexColorAttribute);

var instanceOffsetAttribute = gl.getAttribLocation(shaderProgram, 'offset');
gl.enableVertexAttribArray(instanceOffsetAttribute);
//==========================================
//MATRIX STUFF
var camPos = [0,0,0];
var camUp = [0,1,0];
var camTarget = [0,0,100];
// define transformation matrices
var modelMatrix = Matrix.make3DTranslationMatrix([0,0,-100]);
var viewMatrix = Matrix.makeViewMatrix(camPos, camTarget, camUp);
var projectionMatrix = Matrix.makeProjectionMatrix(Math.PI*(5/12)/*75deg*/, 0.1, 100, gl.canvas.clientWidth/gl.canvas.clientHeight);

// get matrices uniform locations
var modelLoc = gl.getUniformLocation(shaderProgram, 'modelMatrix');
var projectionLoc = gl.getUniformLocation(shaderProgram, 'projectionMatrix');
var viewLoc = gl.getUniformLocation(shaderProgram, 'viewMatrix');
//==========================================

// data
var positions = [
      // pos         // color
     1.0,  1.0,  0.0,   1.0, 0.0, 0.0, 1.0,
    -1.0, 1.0,  0.0,    0.0, 1.0, 0.0, 1.0,
    1.0,  -1.0, 0.0,    0.0, 0.0, 1.0, 1.0,
    -1.0, -1.0, 0.0,    1.0, 1.0, 1.0, 1.0,
    0.0, 0.0, 2.0,      0.0, 1.0, 1.0, 1.0 
  ];

  var indices = [
      0, 1, 2,  1, 2, 3, // base
      0, 1, 4, // sides
      0, 2, 4,
      2, 3, 4,
      1, 3, 4
  ];

  var offsets = [
      0.0, 0.0, 0.0,
      0.0, 3.0, 0.0,
      0.0, -3.0, 0.0,
      3.0, 0.0, 0.0,
      -3.0, 0.0, 0.0,
      3.0, 3.0, 0.0
  ];
  var INSTANCE_COUNT = offsets.length/3;

// Extension for draving instanced arrays
var ext = gl.getExtension("ANGLE_instanced_arrays");
if(ext == null){
    alert('your browser sucks:: no support for ANGLE_instanced_arrays');
}

// setting up vertex buffer
var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
// setting up vertex attrib pointers
// for documentation
  const GL_FLOAT_SIZE = 4;
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = GL_FLOAT_SIZE*7;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(vertexPosAttribute, size, type, normalize, stride, offset);
gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, GL_FLOAT_SIZE*7, GL_FLOAT_SIZE*3);

// vertex index buffer setup. in which order vertex data is to be drawn
// when drawing ELEMENTS
var vertexIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// world offsets for different instances of the model
var offsetBuffer = gl.createBuffer();
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

var lastFrame = 0;
var deltaTime = 0;
var angle = 0;
var fps = 0;
// draw loop function
function draw(){
    // frame timings
    var currentFrame = (new Date).getTime();
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
    var camPos = [0,0,0];
    var camUp = [0,1,0];
    var camTarget = [0,0,100];
    modelMatrix = Matrix.make3DTranslationMatrix([0,0,-10]);
    viewMatrix = Matrix.makeViewMatrix(camPos, camTarget, camUp);
    projectionMatrix = Matrix.makeProjectionMatrix(Math.PI*(5/12)/*75deg*/, 0.1, 100, gl.canvas.clientWidth/gl.canvas.clientHeight);
    //=============================================

    //=========
    //rotating the quad
    angle += deltaTime*(1/1000);
    if(angle >= 2*Math.PI){angle = 0;}
    var rm = Matrix.makeRotationMatrix([1,1,1], angle);
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
    var realToCSSPixels = window.devicePixelRatio;
    // change global variables
    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    var width = Math.floor(gl.canvas.clientWidth*realToCSSPixels);
    var height = Math.floor(gl.canvas.clientHeight*realToCSSPixels);
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
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexS);
    gl.attachShader(shaderProgram, fragmentS);
    gl.linkProgram(shaderProgram);
    //check for errors
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        console.log('ERROR::LINKING_SADER_PROGRAM:: ', + gl.getProgramInfoLog(shaderProgram));
    }
    return shaderProgram;
}

// for getting and compiling the shader source codes
// pass gl context, html script id, type of the shader
function createShader(gl, source, type){
    var shader;
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
