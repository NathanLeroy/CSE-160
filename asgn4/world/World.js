// World.js

var VSHADER_SOURCE = `
precision mediump float;

attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

void main() {
  // world position is computed using the same "world transform" you should use for normals
  vec4 worldPos = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  v_WorldPos = worldPos.xyz;

  // u_NormalMatrix should be inverse-transpose of (u_GlobalRotateMatrix * u_ModelMatrix)
  v_WorldNormal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);

  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
  v_UV = a_UV;
}
`;

var FSHADER_SOURCE = `
precision mediump float;

varying vec2 v_UV;
varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform int u_whichTexture;

uniform vec3 u_LightPos;
uniform vec3 u_LightColor;
uniform vec3 u_CameraPos;

uniform int u_enableLighting;
uniform int u_showNormals;

// Spotlight
uniform int u_enableSpot;
uniform vec3 u_SpotPos;
uniform vec3 u_SpotDir;      // normalized world dir (points OUT of the light)
uniform float u_SpotCutoff;  // cos(angle)
uniform float u_SpotExponent;

vec4 getBaseColor() {
  if (u_whichTexture == -2) return u_FragColor;
  if (u_whichTexture == -1) return vec4(v_UV, 1.0, 1.0);
  if (u_whichTexture == 0)  return texture2D(u_Sampler0, v_UV);
  if (u_whichTexture == 1)  return texture2D(u_Sampler1, v_UV);
  if (u_whichTexture == 2)  return texture2D(u_Sampler2, v_UV);
  return vec4(0.0, 0.0, 0.0, 1.0);
}

void main() {
  // Normal visualization
  if (u_showNormals == 1) {
    vec3 n = normalize(v_WorldNormal);
    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    return;
  }

  vec4 base = getBaseColor();

  // No lighting
  if (u_enableLighting == 0) {
    gl_FragColor = base;
    return;
  }

  vec3 N = normalize(v_WorldNormal);
  vec3 V = normalize(u_CameraPos - v_WorldPos);

  // Point light
  vec3 L = normalize(u_LightPos - v_WorldPos);
  float ndotl = max(dot(N, L), 0.0);

  // Blinn-Phong specular
  vec3 H = normalize(L + V);
  float specPow = 32.0;
  float spec = pow(max(dot(N, H), 0.0), specPow);

  float ka = 0.20;
  float kd = 1.00;
  float ks = 0.50;

  vec3 ambient  = ka * base.rgb;
  vec3 diffuse  = kd * ndotl * base.rgb * u_LightColor;
  vec3 specular = ks * spec * u_LightColor;

  // Spotlight (optional)
  if (u_enableSpot == 1) {
    vec3 Ls = normalize(u_SpotPos - v_WorldPos);
    float ndotlS = max(dot(N, Ls), 0.0);

    // direction from spot to fragment:
    vec3 spotToFrag = normalize(v_WorldPos - u_SpotPos);

    // If u_SpotDir points outward from the light, dot > cutoff means inside cone
    float cosTheta = dot(normalize(u_SpotDir), spotToFrag);

    float spotFactor = 0.0;
    if (cosTheta > u_SpotCutoff) {
      spotFactor = pow(cosTheta, u_SpotExponent);
    }

    vec3 spotColor = vec3(1.0, 1.0, 1.0);
    vec3 Hs = normalize(Ls + V);
    float specS = pow(max(dot(N, Hs), 0.0), specPow);

    diffuse  += (ndotlS * base.rgb) * spotFactor * spotColor;
    specular += ks * specS * spotFactor * spotColor;
  }

  gl_FragColor = vec4(ambient + diffuse + specular, base.a);
}
`;

// ===================== GLOBALS =====================

let canvas, gl;
let a_Position, a_UV, a_Normal;

let u_FragColor;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix, u_GlobalRotateMatrix;
let u_NormalMatrix;

let u_Sampler0, u_Sampler1, u_Sampler2, u_whichTexture;

let u_LightPos, u_LightColor, u_CameraPos;
let u_enableLighting, u_showNormals;

let u_enableSpot, u_SpotPos, u_SpotDir, u_SpotCutoff, u_SpotExponent;

let camera;

// state
let g_globalAngle = 0;

let g_enableLighting = true;
let g_showNormals = false;

let g_lightPos = [2, 2, 2];
let g_lightColor = [1, 1, 1];
let g_animateLight = false;

let g_enableSpot = false;
let g_spotPos = [0, 3, 0];
let g_spotDir = [0, -1, 0]; 
let g_spotCutoff = Math.cos((15 * Math.PI) / 180);
let g_spotExponent = 20.0;

// mouse
let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_mouseSensitivity = 0.2;

// time + fps
let g_startTime = performance.now();
let g_seconds = 0;
let g_lastFPSUpdate = 0;
let g_frameCount = 0;

// animation values from your old project (lego man)
let g_leftArm2Angle = 8;
let g_leftFistAngle = 0;
let g_animationOn = false;
let g_leftArm2AngleSlider = 8;
let g_leftFistAngleSlider = 0;

// global rotate matrix cached each frame (Cube.js should read this)
let g_globalRotMat = new Matrix4();

// ===================== MAP FROM OLD PROJECT =====================

var g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
  [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,0,0,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],

  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],

  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],

  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],

  [1,0,0,0,0,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],

  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1]
];

function drawMap() {
  const rows = g_map.length;
  const cols = g_map[0].length;

  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) { // MUST use cols
      if (g_map[x][y] === 1) {
        const block = new Cube();
        block.textureNum = -2; // solid white blocks; change to 0/1/2 if you want textures
        block.color = [1.0, 1.0, 1.0, 1.0];
        block.matrix.translate(x - 4, -0.75, y - 4);
        block.render();
      }
    }
  }
}

// ===================== WEBGL SETUP =====================

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get WebGL context");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to init shaders");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");

  u_LightPos = gl.getUniformLocation(gl.program, "u_LightPos");
  u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
  u_CameraPos = gl.getUniformLocation(gl.program, "u_CameraPos");
  u_enableLighting = gl.getUniformLocation(gl.program, "u_enableLighting");
  u_showNormals = gl.getUniformLocation(gl.program, "u_showNormals");

  u_enableSpot = gl.getUniformLocation(gl.program, "u_enableSpot");
  u_SpotPos = gl.getUniformLocation(gl.program, "u_SpotPos");
  u_SpotDir = gl.getUniformLocation(gl.program, "u_SpotDir");
  u_SpotCutoff = gl.getUniformLocation(gl.program, "u_SpotCutoff");
  u_SpotExponent = gl.getUniformLocation(gl.program, "u_SpotExponent");

  // safe init
  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, new Matrix4().elements);
}

function addActionsForHtmlUI() {
  const setSpan = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  };

  const btnLighting = document.getElementById("toggleLightingBtn");
  if (btnLighting) {
    btnLighting.onclick = () => {
      g_enableLighting = !g_enableLighting;
      btnLighting.textContent = "Lighting: " + (g_enableLighting ? "ON" : "OFF");
    };
  }

  const btnNormals = document.getElementById("toggleNormalsBtn");
  if (btnNormals) {
    btnNormals.onclick = () => {
      g_showNormals = !g_showNormals;
      btnNormals.textContent = "Normals: " + (g_showNormals ? "ON" : "OFF");
    };
  }

  const btnSpin = document.getElementById("toggleLightAnimBtn");
  if (btnSpin) {
    btnSpin.onclick = () => {
      g_animateLight = !g_animateLight;
      btnSpin.textContent = "Light Spin: " + (g_animateLight ? "ON" : "OFF");
    };
  }

  const btnSpot = document.getElementById("toggleSpotBtn");
  if (btnSpot) {
    btnSpot.onclick = () => {
      g_enableSpot = !g_enableSpot;
      btnSpot.textContent = "Spotlight: " + (g_enableSpot ? "ON" : "OFF");
    };
  }

  const bindSlider = (sliderId, spanId, setter) => {
    const s = document.getElementById(sliderId);
    if (!s) return;
    s.addEventListener("input", () => {
      const v = parseFloat(s.value);
      setter(v);
      setSpan(spanId, v);
    });
    setSpan(spanId, s.value);
  };

  bindSlider("lightX", "lightXVal", (v) => (g_lightPos[0] = v));
  bindSlider("lightY", "lightYVal", (v) => (g_lightPos[1] = v));
  bindSlider("lightZ", "lightZVal", (v) => (g_lightPos[2] = v));

  bindSlider("lightR", "lightRVal", (v) => (g_lightColor[0] = v));
  bindSlider("lightG", "lightGVal", (v) => (g_lightColor[1] = v));
  bindSlider("lightB", "lightBVal", (v) => (g_lightColor[2] = v));

  const angle = document.getElementById("angleSlide");
  if (angle) {
    angle.addEventListener("input", () => {
      g_globalAngle = parseFloat(angle.value);
      const out = document.getElementById("angleVal");
      if (out) out.textContent = String(g_globalAngle);
    });
    const out = document.getElementById("angleVal");
    if (out) out.textContent = angle.value;
  }
  const arm2 = document.getElementById("leftArm2AngleSlide");
  if (arm2) {
    arm2.addEventListener("input", function () {
      g_leftArm2AngleSlider = Number(this.value);
    });
  }
  const fist = document.getElementById("leftFistAngleSlide");
  if (fist) {
    fist.addEventListener("input", function () {
      g_leftFistAngleSlider = Number(this.value);
    });
  }
  const animOn = document.getElementById("animOnButton");
  if (animOn) animOn.onclick = () => (g_animationOn = true);
  const animOff = document.getElementById("animOffButton");
  if (animOff) {
    animOff.onclick = () => {
      g_animationOn = false;
      g_leftArm2Angle = g_leftArm2AngleSlider;
      g_leftFistAngle = g_leftFistAngleSlider;
    };
  }
}

// ===================== TEXTURES =====================

function initTextures() {
  const image0 = new Image();
  image0.onload = function () { sendTextureToGLSL(image0, 0); };
  image0.src = "lava.jpg";

  const image1 = new Image();
  image1.onload = function () { sendTextureToGLSL(image1, 1); };
  image1.src = "pool.jpg";

  const image2 = new Image();
  image2.onload = function () { sendTextureToGLSL(image2, 2); };
  image2.src = "sky.jpg";
}

function sendTextureToGLSL(image, textureUnit) {
  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (textureUnit === 0) gl.activeTexture(gl.TEXTURE0);
  else if (textureUnit === 1) gl.activeTexture(gl.TEXTURE1);
  else if (textureUnit === 2) gl.activeTexture(gl.TEXTURE2);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (textureUnit === 0) gl.uniform1i(u_Sampler0, 0);
  else if (textureUnit === 1) gl.uniform1i(u_Sampler1, 1);
  else if (textureUnit === 2) gl.uniform1i(u_Sampler2, 2);
}

// ===================== INPUT =====================

function setupInput() {
  document.onkeydown = function (ev) {
    switch (ev.key) {
      case "w": camera.moveForward(); break;
      case "s": camera.moveBackwards(); break;
      case "a": camera.moveLeft(); break;
      case "d": camera.moveRight(); break;
      case "q": camera.panLeft(); break;
      case "e": camera.panRight(); break;
    }
  };

  canvas.onmousedown = (ev) => {
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmouseup = () => (g_mouseDown = false);
  canvas.onmouseleave = () => (g_mouseDown = false);
  canvas.onmousemove = onMove;
}

function onMove(ev) {
  if (!g_mouseDown) return;

  const x = ev.clientX;
  const dx = x - g_lastMouseX;
  g_lastMouseX = x;

  const yawDeg = dx * g_mouseSensitivity;
  if (yawDeg > 0) camera.panRight(yawDeg);
  else camera.panLeft(-yawDeg);
}

// ===================== ANIMATION =====================

function updateAnimationAngles() {
  if (!g_animationOn) {
    g_leftArm2Angle = g_leftArm2AngleSlider;
    g_leftFistAngle = g_leftFistAngleSlider;
    return;
  }
  g_leftArm2Angle = 8 + 33 * Math.sin(g_seconds * 2.0);
  g_leftFistAngle = 10 * Math.sin(g_seconds * 5.0);
}

// ===================== MAIN LOOP =====================

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  camera = new Camera(canvas);
  addActionsForHtmlUI();
  setupInput();
  initTextures();

  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);

  requestAnimationFrame(tick);
}

function tick() {
  g_seconds = (performance.now() - g_startTime) / 1000.0;

  // FPS
  g_frameCount++;
  const now = performance.now();
  if (now - g_lastFPSUpdate >= 1000) {
    const fpsEl = document.getElementById("fpsDisplay");
    if (fpsEl) fpsEl.textContent = "FPS: " + g_frameCount;
    g_frameCount = 0;
    g_lastFPSUpdate = now;
  }

  // animate point light in a circle if enabled
  if (g_animateLight) {
    const r = 4.0;
    g_lightPos[0] = r * Math.cos(g_seconds);
    g_lightPos[2] = r * Math.sin(g_seconds);
    g_lightPos[1] = 2.0;

    // sync sliders if they exist
    const lx = document.getElementById("lightX");
    const ly = document.getElementById("lightY");
    const lz = document.getElementById("lightZ");
    if (lx) lx.value = g_lightPos[0];
    if (ly) ly.value = g_lightPos[1];
    if (lz) lz.value = g_lightPos[2];

    const lxv = document.getElementById("lightXVal");
    const lyv = document.getElementById("lightYVal");
    const lzv = document.getElementById("lightZVal");
    if (lxv) lxv.textContent = g_lightPos[0].toFixed(2);
    if (lyv) lyv.textContent = g_lightPos[1].toFixed(2);
    if (lzv) lzv.textContent = g_lightPos[2].toFixed(2);
  }

  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

// ===================== RENDER =====================

function renderAllShapes() {
  // matrices
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  g_globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_globalRotMat.elements);

  // lighting uniforms
  gl.uniform3f(
    u_CameraPos,
    camera.eye.elements[0],
    camera.eye.elements[1],
    camera.eye.elements[2]
  );

  gl.uniform1i(u_enableLighting, g_enableLighting ? 1 : 0);
  gl.uniform1i(u_showNormals, g_showNormals ? 1 : 0);

  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  // spotlight uniforms
  gl.uniform1i(u_enableSpot, g_enableSpot ? 1 : 0);
  gl.uniform3f(u_SpotPos, g_spotPos[0], g_spotPos[1], g_spotPos[2]);

  {
    const d = g_spotDir;
    const m = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
    gl.uniform3f(u_SpotDir, d[0] / m, d[1] / m, d[2] / m);
  }
  gl.uniform1f(u_SpotCutoff, g_spotCutoff);
  gl.uniform1f(u_SpotExponent, g_spotExponent);

  // clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Old Project scene objects

  // Floor (pool.jpg)
  const floor = new Cube();
  floor.color = [1, 1, 1, 1];
  floor.textureNum = 1;
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(64, 0.02, 64);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  // Sphere test object
  const s1 = new Sphere(24, 24);
  s1.textureNum = -2; 
  s1.color = [0.0, 0.0, 1.0, 1.0];
  s1.matrix.translate(3, 1.5, 0.0);
  s1.matrix.scale(0.8, 0.8, 0.8);
  s1.render();

  // Skybox
  const sky = new Cube();
  sky.color = [1.0, 1.0, 1.0, 1.0];
  sky.textureNum = 2;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // Map blocks
  drawMap();

  // body
  const body = new Cube();
  body.color = [1.0, 0.0, 0.3, 1.0];
  body.textureNum = -2;
  body.matrix.translate(-0.25, -0.5, -0.05);
  body.matrix.scale(0.5, 1, 0.5);
  body.render();

  // Left arm
  const leftArm = new Cube();
  leftArm.color = [1, 1, 0, 1];
  leftArm.textureNum = -2;
  leftArm.matrix.setTranslate(0.6, -0.20, 0.0);
  leftArm.matrix.rotate(50, 0, 0, 1);
  leftArm.matrix.scale(0.15, 0.6, 0.3);
  leftArm.render();

  // Forearm
  const leftArm2 = new Cube();
  leftArm2.color = [1, 1, 0, 1];
  leftArm2.textureNum = -2;
  leftArm2.matrix.setTranslate(0.58, -0.12, 0.0);
  leftArm2.matrix.rotate(g_leftArm2Angle, 0, 0, 1);
  leftArm2.matrix.scale(0.15, 0.5, 0.3);
  leftArm2.render();

  // Left fist
  const leftFist = new Cube();
  leftFist.color = [1, 1, 0, 1];
  leftFist.textureNum = -2;
  leftFist.matrix = new Matrix4(leftArm2.matrix);
  leftFist.matrix.translate(0.0, 1.0, 0.0);
  leftFist.matrix.rotate(g_leftFistAngle, 0, 0, 1);
  leftFist.matrix.scale(1.6, 0.35, 1.35);
  leftFist.render();

  // Fingers base
  const fistBase = new Matrix4(leftArm2.matrix);
  fistBase.translate(0.0, 1.0, 0.0);
  fistBase.rotate(g_leftFistAngle, 0, 0, 1);

  const leftFinger1 = new Cube();
  leftFinger1.color = [1, 1, 0, 1];
  leftFinger1.textureNum = -2;
  leftFinger1.matrix = new Matrix4(fistBase);
  leftFinger1.matrix.translate(0.15, 0.15, 0.12);
  leftFinger1.matrix.scale(0.25, 0.25, 0.25);
  leftFinger1.render();

  const leftFinger2 = new Cube();
  leftFinger2.color = [1, 1, 0, 1];
  leftFinger2.textureNum = -2;
  leftFinger2.matrix = new Matrix4(fistBase);
  leftFinger2.matrix.translate(0.45, 0.15, 0.12);
  leftFinger2.matrix.scale(0.25, 0.25, 0.25);
  leftFinger2.render();

  const leftFinger3 = new Cube();
  leftFinger3.color = [1, 1, 0, 1];
  leftFinger3.textureNum = -2;
  leftFinger3.matrix = new Matrix4(fistBase);
  leftFinger3.matrix.translate(0.75, 0.15, 0.12);
  leftFinger3.matrix.scale(0.25, 0.25, 0.25);
  leftFinger3.render();

  // Right arm (segment 1)
  const rightArm1 = new Cube();
  rightArm1.color = [1, 1, 0, 1];
  rightArm1.textureNum = -2;
  rightArm1.matrix.setTranslate(-0.70, -0.15, 0);
  rightArm1.matrix.rotate(-45, 0, 0, 1);
  rightArm1.matrix.scale(0.15, 0.6, 0.3);
  rightArm1.render();

  // Right arm (segment 2)
  const rightArm2 = new Cube();
  rightArm2.color = [1, 1, 0, 1];
  rightArm2.textureNum = -2;
  rightArm2.matrix.setTranslate(-0.70, -0.15, 0);
  rightArm2.matrix.rotate(45, 0, 0, 1);
  rightArm2.matrix.scale(0.15, 0.2, 0.3);
  rightArm2.render();

  // Left leg
  const leftLeg = new Cube();
  leftLeg.color = [1, 1, 0, 1];
  leftLeg.textureNum = -2;
  leftLeg.matrix.setTranslate(-0.75, -0.75, 0);
  leftLeg.matrix.rotate(-45, 0, 0, 1);
  leftLeg.matrix.scale(0.15, 0.7, 0.3);
  leftLeg.render();

  // Right leg
  const rightLeg = new Cube();
  rightLeg.color = [1, 1, 0, 1];
  rightLeg.textureNum = -2;
  rightLeg.matrix.setTranslate(0.65, -0.90, 0.0);
  rightLeg.matrix.rotate(45, 0, 0, 1);
  rightLeg.matrix.scale(0.15, 0.7, 0.3);
  rightLeg.render();

  // Head
  const head = new Cube();
  head.color = [1, 1, 0, 1];
  head.textureNum = -2;
  head.matrix.setTranslate(-0.3, 0.45, -0.09);
  head.matrix.scale(0.6, 0.5, 0.55);
  head.render();

  // Teeth
  const tooth1 = new Cube();
  tooth1.color = [0, 0, 0, 1];
  tooth1.textureNum = -2;
  tooth1.matrix.setTranslate(-0.25, 0.470, -0.05);
  tooth1.matrix.scale(0.05, 0.15, 0.10);
  tooth1.render();

  const tooth2 = new Cube();
  tooth2.color = [0, 0, 0, 1];
  tooth2.textureNum = -2;
  tooth2.matrix.setTranslate(0.09, 0.470, -0.05);
  tooth2.matrix.scale(0.05, 0.15, 0.10);
  tooth2.render();

  const tooth3 = new Cube();
  tooth3.color = [0, 0, 0, 1];
  tooth3.textureNum = -2;
  tooth3.matrix.setTranslate(-0.05, 0.470, -0.05);
  tooth3.matrix.scale(0.05, 0.15, 0.05);
  tooth3.render();

  // Smile
  const smile = new Cube();
  smile.color = [1, 0, 0, 1];
  smile.textureNum = -2;
  smile.matrix.setTranslate(-0.25, 0.50, -0.01);
  smile.matrix.scale(0.4, 0.1, 0.5);
  smile.render();

  // Eyes
  const eye1 = new Cube();
  eye1.color = [0, 0, 0, 1];
  eye1.textureNum = -2;
  eye1.matrix.setTranslate(-0.25, 0.70, -0.01);
  eye1.matrix.scale(0.1, 0.1, 0.1);
  eye1.render();

  const eye2 = new Cube();
  eye2.color = [0, 0, 0, 1];
  eye2.textureNum = -2;
  eye2.matrix.setTranslate(0.07, 0.70, -0.01);
  eye2.matrix.scale(0.1, 0.1, 0.1);
  eye2.render();

  // Light marker cube
  const lightMarker = new Cube();
  lightMarker.textureNum = -2;
  lightMarker.color = [1, 1, 1, 1];
  lightMarker.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  lightMarker.matrix.scale(0.15, 0.15, 0.15);
  lightMarker.render();
}