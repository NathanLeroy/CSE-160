let canvas, ctx;

const SCALE = 20;          // scale vector coords by 20 for visibility
const ORIGIN_X = 200;      // center of 400x400 canvas
const ORIGIN_Y = 200;

function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
  ctx = canvas.getContext('2d');

  // black background
  clearCanvas();

  // default v1 (2.25, 2.25, 0)
  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");

  // hook up buttons
  document.getElementById("drawBtn").onclick = handleDrawEvent;
  document.getElementById("opBtn").onclick = handleDrawOperationEvent;
}

function clearCanvas() {
  // fill black
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw a vector from the canvas center using lineTo()
 * v is Vector3, color is string like "red"
 */
function drawVector(v, color) {
  const x = v.elements[0] * SCALE;
  const y = v.elements[1] * SCALE;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // from origin (center) to endpoint
  ctx.moveTo(ORIGIN_X, ORIGIN_Y);
  ctx.lineTo(ORIGIN_X + x, ORIGIN_Y - y); // subtract y: canvas y increases downward
  ctx.stroke();
}

function readV1() {
  const x = parseFloat(document.getElementById("v1x").value);
  const y = parseFloat(document.getElementById("v1y").value);
  return new Vector3([x, y, 0]);
}

function readV2() {
  const x = parseFloat(document.getElementById("v2x").value);
  const y = parseFloat(document.getElementById("v2y").value);
  return new Vector3([x, y, 0]);
}

function handleDrawEvent() {
  clearCanvas();
  const v1 = readV1();
  const v2 = readV2();
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  clearCanvas();

  // draw originals
  const v1 = readV1();
  const v2 = readV2();
  drawVector(v1, "red");
  drawVector(v2, "blue");

  const op = document.getElementById("op").value;
  const s = parseFloat(document.getElementById("scalar").value);

  const v1c = new Vector3(v1.elements);
  const v2c = new Vector3(v2.elements);

  if (op === "add") {
    // v3 = v1 + v2
    v1c.add(v2c);
    drawVector(v1c, "green");
  } else if (op === "sub") {
    // v3 = v1 - v2
    v1c.sub(v2c);
    drawVector(v1c, "green");
  } else if (op === "mul") {
    // v3 = v1 * s, v4 = v2 * s
    v1c.mul(s);
    v2c.mul(s);
    drawVector(v1c, "green");
    drawVector(v2c, "green");
  } else if (op === "div") {
    // v3 = v1 / s, v4 = v2 / s
    v1c.div(s);
    v2c.div(s);
    drawVector(v1c, "green");
    drawVector(v2c, "green");
  } else if (op === "magnitude") {
    console.log("magnitude v1 =", v1.magnitude());
    console.log("magnitude v2 =", v2.magnitude());
  } else if (op === "normalize") {
    console.log("magnitude v1 =", v1.magnitude());
    console.log("magnitude v2 =", v2.magnitude());
    v1c.normalize();
    v2c.normalize();
    drawVector(v1c, "green");
    drawVector(v2c, "green");
  } else if (op === "angle") {
    const ang = angleBetween(v1, v2);
    console.log("angle between (degrees) =", ang);
  } else if (op === "area") {
    const area = areaTriangle(v1, v2);
    console.log("triangle area =", area);
  }
}

function angleBetween(v1, v2) {
  const dot = Vector3.dot(v1, v2);
  const m1 = v1.magnitude();
  const m2 = v2.magnitude();

  if (m1 === 0 || m2 === 0) return 0;

  let cosA = dot / (m1 * m2);
  cosA = Math.max(-1, Math.min(1, cosA));

  const rad = Math.acos(cosA);
  return rad * 180 / Math.PI;
}

function areaTriangle(v1, v2) {
  const c = Vector3.cross(v1, v2);
  const parallelogramArea = c.magnitude();
  return parallelogramArea / 2;
}