class Triangle{
    constructor(){
        this.type = 'triangle';
        this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        this.size = 5.0;
    }

    render(){
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;
        
        //var xy = g_shapesList[i].position;
        //var rgba = g_shapesList[i].color;
        //var size = g_shapesList[i].size;

        //var xy = g_points[i];
        //var rgba = g_colors[i];
        //var size = g_sizes[i];
    
        // Pass the position of a point to a_Position variable
        //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
        gl.uniform1f(u_Size, size);
        // Draw
        //gl.drawArrays(gl.POINTS, 0, 1);
        var d = this.size/200.0;
        drawTriangle( [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d]);

    }
}

function drawTriangle(vertices) {
  //  var vertices = new Float32Array([
  //    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  //]);
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  //var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  //if (a_Position < 0) {
  //  console.log('Failed to get the storage location of a_Position');
  //  return -1;
  //}

  //REMOVE IF STILL BREAKING PROGRAM
  //gl.disableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);

  return n;
}

function drawRect(x1, y1, x2, y2) {
    drawTriangle([x1, y1,  x2, y1,  x2, y2]);
    drawTriangle([x1, y1,  x2, y2,  x1, y2]);
}

function drawBunny() {

  // ===== BODY (WHITE) =====
  gl.uniform4f(u_FragColor, 1, 1, 1, 1);
  drawRect(-0.6, -0.6,  0.6,  0.1);

  // ===== HEAD (WHITE) =====
  drawRect(-0.3, 0.1, 0.3, 0.45);

  // ===== EARS (WHITE OUTER) =====
  drawRect(-0.25, 0.45, -0.1, 0.85);
  drawRect( 0.1,  0.45,  0.25, 0.85);

  // ===== EARS (PINK INNER) =====
  gl.uniform4f(u_FragColor, 1.0, 0.7, 0.8, 1);
  drawRect(-0.22, 0.5, -0.13, 0.8);
  drawRect( 0.13, 0.5,  0.22, 0.8);

  // ===== EYES (WHITE) =====
  gl.uniform4f(u_FragColor, 1, 1, 1, 1);
  drawRect(-0.2, 0.3, -0.15, 0.35);
  drawRect( 0.15, 0.3,  0.2,  0.35);

  // ===== NOSE (BLACK TRIANGLE) =====
  gl.uniform4f(u_FragColor, 0, 0, 0, 1);
  drawTriangle([-0.05, 0.25,  0.05, 0.25,  0.0, 0.18]);

  // ===== SIDE BLOCKS =====
  // Blue triangle
  gl.uniform4f(u_FragColor, 0.2, 0.4, 1.0, 1);
  drawTriangle([0.6, 0.1,  0.75, 0.1,  0.6, 0.25]);

  // Yellow rectangles
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1);
  drawRect(0.75, 0.1, 0.9, 0.25);
  drawRect(0.9,  0.1, 1.05, 0.25);

  // ===== FEET (OFF-WHITE) =====
  gl.uniform4f(u_FragColor, 0.95, 0.95, 0.95, 1);
  drawRect(-0.55, -0.6, -0.35, -0.4);
  drawRect( 0.35, -0.6,  0.55, -0.4);
}
