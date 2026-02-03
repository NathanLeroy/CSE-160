// blockyAnimal.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;' +
  '}\n'; 

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n'  +
  '}\n';

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
//let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_globalAngle = 0;
let g_leftArm2Angle = 8;
let g_leftFistAngle = 0;

let g_animationOn = false;

// time
let g_startTime = performance.now();
let g_seconds = 0;
let g_leftArm2AngleSlider = 8;
let g_leftFistAngleSlider = 0;

// fps button
let g_lastFPSUpdate = 0;
let g_frameCount = 0;
let g_fps = 0;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}


function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  /*
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size){
    console.log('Failed to get the storage location of u_Size');
    return;
  }
  */

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix){
    console.log('Failed to get storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix){
    console.log('failed to get storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;

function addActionsForHtmlUI(){
    document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0];};
    document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0];};
    document.getElementById('clearButton').onclick = function() {g_shapesList=[]; renderAllShapes(); };

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });


    document.getElementById('angleSlide').addEventListener('mousemove', function(){ g_globalAngle = this.value; renderAllShapes();});
    //document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });

    /*
    // the lego man
    document.getElementById('leftArm2AngleSlide').addEventListener('input', function() {
      g_leftArm2Angle = Number(this.value);
      renderAllShapes();
    });

    document.getElementById('leftFistAngleSlide').addEventListener('input', function() {
      g_leftFistAngle = Number(this.value);
      renderAllShapes();
    });
    */

    document.getElementById('leftArm2AngleSlide').addEventListener('input', function() {
      g_leftArm2AngleSlider = Number(this.value);
      if (!g_animationOn) renderAllShapes();
    });
    
    document.getElementById('leftFistAngleSlide').addEventListener('input', function() {
      g_leftFistAngleSlider = Number(this.value);
      if (!g_animationOn) renderAllShapes();
    });

    document.getElementById('animOnButton').onclick = function() {
      g_animationOn = true;
    };
    
    document.getElementById('animOffButton').onclick = function() {
      g_animationOn = false;
    
      // snap back to slider values when turning animation off
      g_leftArm2Angle = g_leftArm2AngleSlider;
      g_leftFistAngle = g_leftFistAngleSlider;
    
      renderAllShapes();
    };

    // bunny function
    document.getElementById('bunnyButton').onclick = function() { drawBunny(); };
}

function main() {

  setupWebGL();
  connectVariablesToGLSL();

  addActionsForHtmlUI();


  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)}};

  // Specify the color for clearing <canvas>

  //DELETE IF NOT FIXING ISSUE
  //gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);


  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
  requestAnimationFrame(tick);
}


function updateAnimationAngles() {
  if (!g_animationOn) {
    //not animating: use the sliders
    g_leftArm2Angle = g_leftArm2AngleSlider;
    g_leftFistAngle = g_leftFistAngleSlider;
    return;
  }

  //override joints automatically using time
  g_leftArm2Angle = 8 + 33 * Math.sin(g_seconds * 2.0);
  g_leftFistAngle = 10 * Math.sin(g_seconds * 5.0);
}

/*
function tick() {
  g_seconds = (performance.now() - g_startTime) / 1000.0;

  updateAnimationAngles();
  renderAllShapes();

  requestAnimationFrame(tick);
}
*/

function tick() {
  // time since start (seconds)
  g_seconds = (performance.now() - g_startTime) / 1000.0;

  // FPS calculation
  g_frameCount++;
  const now = performance.now();

  if (now - g_lastFPSUpdate >= 1000) { // update once per second
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFPSUpdate = now;

    sendTextToHTML(
      "FPS: " + g_fps,
      "fpsDisplay"
    );
  }

  updateAnimationAngles();
  renderAllShapes();

  requestAnimationFrame(tick);
}

var g_shapesList = [];
//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];



function click(ev) {

  let [x,y] = convertCoordinatesEventToGL(ev);

  //let point = new Triangle();

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  // Store the coordinates to g_points array
  //g_points.push([x, y]);
  //g_colors.push(g_selectedColor);
  //g_sizes.push(g_selectedSize);

  // Store the coordinates to g_points array
  //if (x >= 0.0 && y >= 0.0) {      // First quadrant
   // g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  //} else if (x < 0.0 && y < 0.0) { // Third quadrant
  //  g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  //} else {                         // Others
  //  g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  //}

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; //x-coord
    var y = ev.clientY; //y-coord
    var rect = ev.target.getBoundingClientRect();
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return ([x,y]);
}

function renderAllShapes(){

  
  var startTime = performance.now();

  var globalRotMat=new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  //gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //drawTriangle3D([-1.0,0.0,0.0, -0.5,-1.0,0.0, 0.0,0.0,0.0] );

  //body cube
  var body = new Cube();
  body.color = [1.0,0.0,0.3,1.0];
  body.matrix.translate(-.25,-.5,-0.05);
  body.matrix.scale(0.5,1,.5);
  body.render();


  // (side/side) (up/down) (forwards/back)
  // (skinniness) (length)
  // Left arm
  var leftArm = new Cube();
  leftArm.color = [1,1,0,1];
  leftArm.matrix.setTranslate(.6,-0.20,0.0);
  leftArm.matrix.rotate(50,0,0,1);
  leftArm.matrix.scale(0.15,0.6,0.3);
  leftArm.render();

  // Forearm (leftArm2)
var leftArm2 = new Cube();
leftArm2.color = [1,1,0,1];
leftArm2.matrix.setTranslate(.58,-0.12,0.0);
leftArm2.matrix.rotate(g_leftArm2Angle, 0, 0, 1);
leftArm2.matrix.scale(0.15, 0.5, 0.3);
leftArm2.render();


// Left fist
var leftFist = new Cube();
leftFist.color = [1,1,0,1];
leftFist.matrix = new Matrix4(leftArm2.matrix);
leftFist.matrix.translate(0.0, 1.0, 0.0);

// rotate fist around the wrist joint
leftFist.matrix.rotate(g_leftFistAngle, 0, 0, 1);

// shape fist
leftFist.matrix.scale(1.6, 0.35, 1.35);
leftFist.render();


// Fingers
var fistBase = new Matrix4(leftArm2.matrix);
fistBase.translate(0.0, 1.0, 0.0);
fistBase.rotate(g_leftFistAngle, 0, 0, 1);

// Finger 1
var leftFinger1 = new Cube();
leftFinger1.color = [1,1,0,1];
leftFinger1.matrix = new Matrix4(fistBase);
leftFinger1.matrix.translate(0.15, 0.15, 0.12);
leftFinger1.matrix.scale(0.25, 0.25, 0.25);
leftFinger1.render();

// Finger 2
var leftFinger2 = new Cube();
leftFinger2.color = [1,1,0,1];
leftFinger2.matrix = new Matrix4(fistBase);
leftFinger2.matrix.translate(0.45, 0.15, 0.12);
leftFinger2.matrix.scale(0.25, 0.25, 0.25);
leftFinger2.render();

// Finger 3
var leftFinger3 = new Cube();
leftFinger3.color = [1,1,0,1];
leftFinger3.matrix = new Matrix4(fistBase);
leftFinger3.matrix.translate(0.75, 0.15, 0.12);
leftFinger3.matrix.scale(0.25, 0.25, 0.25);
leftFinger3.render();


  /*
  var leftArm2 = new Cube();
  leftArm2.color = [1,1,0,1];
  leftArm2.matrix.setTranslate(.58,-0.12,0.0);
  leftArm2.matrix.rotate(g_leftArm2Angle,0,0,1);
  leftArm2.matrix.scale(0.15,0.5,0.3);
  leftArm2.render();

  var leftFist = new Cube();
  leftFist.color = [1,1,0,1];
  leftFist.matrix.setTranslate(0.48,0.35,-0.05);
  leftFist.matrix.rotate(10,0,0,1);
  leftFist.matrix.scale(0.24,0.2,0.40);
  leftFist.render();
  */

  /*
  //leftArm2 (upper/lower arm segment)
  var leftArm2 = new Cube();
  leftArm2.color = [1,1,0,1];
  leftArm2.matrix.setTranslate(.58,-0.12,0.0);
  leftArm2.matrix.rotate(g_leftArm2Angle, 0, 0, 1);
  leftArm2.matrix.scale(0.15, 0.5, 0.3);
  leftArm2.render();

  //left fist inherits leftArm2 transform
  var leftFist = new Cube();
  leftFist.color = [1,1,0,1];
  leftFist.matrix = new Matrix4(leftArm2.matrix);
  leftFist.matrix.translate(0.0, 1.0, 0.0);
  leftFist.matrix.scale(1.6, 0.35, 1.35);
  leftFist.render();

  ///////////////////
  var leftFingers = new Cube();
  leftFingers.color = [1,1,0,1];
  leftFingers.matrix.setTranslate(0.45,0.51,0.075);
  leftFingers.matrix.rotate(10,0,0,1);
  leftFingers.matrix.scale(0.10,0.15,0.20);
  leftFingers.render();

  var leftFingers2 = new Cube();
  leftFingers2.color = [1,1,0,1];
  leftFingers2.matrix.setTranslate(0.58,0.56,0.075);
  leftFingers2.matrix.rotate(10,0,0,1);
  leftFingers2.matrix.scale(0.10,0.13,0.20);
  leftFingers2.render();
  */

  

  //right arm
  var rightArm = new Cube();
  rightArm.color = [1,1,0,1];
  rightArm.matrix.setTranslate(-0.70, -0.15, 0);
  rightArm.matrix.rotate(-45, 0, 0, 1);
  rightArm.matrix.scale(0.15, 0.6, 0.3);
  rightArm.render();

  //right arm
  var rightArm = new Cube();
  rightArm.color = [1,1,0,1];
  rightArm.matrix.setTranslate(-0.70, -0.15, 0);
  rightArm.matrix.rotate(45, 0, 0, 1);
  rightArm.matrix.scale(0.15, 0.2, 0.3);
  rightArm.render();

  //left leg
  var leftLeg = new Cube();
  leftLeg.color = [1,1,0,1];
  leftLeg.matrix.setTranslate(-0.75, -0.75, 0);
  leftLeg.matrix.rotate(-45, 0, 0, 1);
  leftLeg.matrix.scale(0.15, 0.7, 0.3);
  leftLeg.render();

  //right leg
  var rightLeg = new Cube();
  rightLeg.color = [1,1,0,1];
  rightLeg.matrix.setTranslate(.65,-0.90,0.0);
  rightLeg.matrix.rotate(45,0,0,1);
  rightLeg.matrix.scale(0.15,0.7,0.3);
  rightLeg.render();



  //head
  var head = new Cube();
  head.color = [1,1,0,1];
  head.matrix.setTranslate(-0.3, 0.45, -0.09);
  head.matrix.rotate(0, 0, 0, 0.1);
  head.matrix.scale(0.6, 0.5, 0.55);
  head.render();

  //tooth 1
  var tooth1 = new Cube();
  tooth1.color = [0,0,0,0];
  tooth1.matrix.setTranslate(-0.25, 0.470, -0.05);
  tooth1.matrix.rotate(0, 0, 0, 0.1);
  tooth1.matrix.scale(0.05, 0.15, -0.10);
  tooth1.render();

  //tooth 2
  var tooth2 = new Cube();
  tooth2.color = [0,0,0,0];
  tooth2.matrix.setTranslate(0.09, 0.470, -0.05);
  tooth2.matrix.rotate(0, 0, 0, 0.1);
  tooth2.matrix.scale(0.05, 0.15, -0.10);
  tooth2.render();

  //tooth 3
  var tooth3 = new Cube();
  tooth3.color = [0,0,0,0];
  tooth3.matrix.setTranslate(-0.05, 0.470, -0.05);
  tooth3.matrix.rotate(0, 0, 0, 0.1);
  tooth3.matrix.scale(0.05, 0.15, -0.05);
  tooth3.render();

  //smile
  var smile = new Cube();
  smile.color = [1,0,0,1];
  smile.matrix.setTranslate(-0.25, 0.50, -0.01);
  smile.matrix.rotate(0, 0, 0, 0.1);
  smile.matrix.scale(0.4, 0.1, -0.5);
  smile.render();

  //eye 1

  var eye1 = new Cube();
  eye1.color = [0,0,0,1];
  eye1.matrix.setTranslate(-0.25, 0.70, -0.01);
  eye1.matrix.rotate(0, 0, 0, 0.1);
  eye1.matrix.scale(0.1, 0.1, -0.1);
  eye1.render();

  //eye 2
  var eye2 = new Cube();
  eye2.color = [0,0,0,1];
  eye2.matrix.setTranslate(0.07, 0.70, -0.01);
  eye2.matrix.rotate(0, 0, 0, 0.1);
  eye2.matrix.scale(0.1, 0.1, -0.1);
  eye2.render();


  // party hat
  var hat = new Cone();
  hat.color = [0.19, 0.84, 0.78, 1]
  hat.matrix.setTranslate(-0.7, -0.09, 0);
  hat.matrix.scale(0.5, 0.5, 0.25);
  hat.matrix.rotate(10, 0, 0, 1);
  hat.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration))
  
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}