// Cube.js
class Cube {
    constructor() {
      this.type = "cube";
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
      this.textureNum = -2;
    }
  
    render() {
      const rgba = this.color;
  
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      // Upload model matrix
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // worldPos = u_GlobalRotateMatrix * u_ModelMatrix * a_Position
      const worldMat = new Matrix4(g_globalRotMat); // global rotate from World.js
      worldMat.multiply(this.matrix);
  
      const normalMat = new Matrix4();
      normalMat.setInverseOf(worldMat);
      normalMat.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  
      // --- FRONT (z=0) outward normal should be (0,0,-1) if your cube faces outward
      drawTriangle3DUVNormal(
        [0, 0, 0, 1, 1, 0, 1, 0, 0],
        [1, 0, 0, 1, 1, 1],
        [0, 0, -1, 0, 0, -1, 0, 0, -1]
      );
      drawTriangle3DUVNormal(
        [0, 0, 0, 0, 1, 0, 1, 1, 0],
        [0, 0, 0, 1, 1, 1],
        [0, 0, -1, 0, 0, -1, 0, 0, -1]
      );
  
      // --- BACK (z=1) normal (0,0,1)
      drawTriangle3DUVNormal(
        [0, 0, 1, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 1, 1, 1],
        [0, 0, 1, 0, 0, 1, 0, 0, 1]
      );
      drawTriangle3DUVNormal(
        [0, 0, 1, 1, 1, 1, 0, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [0, 0, 1, 0, 0, 1, 0, 0, 1]
      );
  
      // --- LEFT (x=0) normal (-1,0,0)
      drawTriangle3DUVNormal(
        [0, 0, 0, 0, 0, 1, 0, 1, 1],
        [1, 0, 0, 1, 1, 1],
        [-1, 0, 0, -1, 0, 0, -1, 0, 0]
      );
      drawTriangle3DUVNormal(
        [0, 0, 0, 0, 1, 1, 0, 1, 0],
        [1, 0, 0, 1, 1, 1],
        [-1, 0, 0, -1, 0, 0, -1, 0, 0]
      );
  
      // --- TOP (y=1) normal (0,1,0)
      drawTriangle3DUVNormal(
        [0, 1, 0, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 1, 1],
        [0, 1, 0, 0, 1, 0, 0, 1, 0]
      );
      drawTriangle3DUVNormal(
        [0, 1, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 1, 1],
        [0, 1, 0, 0, 1, 0, 0, 1, 0]
      );
  
      // --- RIGHT (x=1) normal (1,0,0)
      drawTriangle3DUVNormal(
        [1, 0, 0, 1, 1, 1, 1, 0, 1],
        [0, 0, 1, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1, 0, 0]
      );
      drawTriangle3DUVNormal(
        [1, 0, 0, 1, 1, 0, 1, 1, 1],
        [0, 0, 0, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0]
      );
  
      // --- BOTTOM (y=0) normal (0,-1,0)
      drawTriangle3DUVNormal(
        [0, 0, 0, 1, 0, 1, 0, 0, 1],
        [0, 0, 1, 1, 0, 1],
        [0, -1, 0, 0, -1, 0, 0, -1, 0]
      );
      drawTriangle3DUVNormal(
        [0, 0, 0, 1, 0, 0, 1, 0, 1],
        [0, 0, 1, 0, 1, 1],
        [0, -1, 0, 0, -1, 0, 0, -1, 0]
      );
    }
  }