// Cone.js
class Cone {
    constructor() {
      this.type = 'cone';
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
      this.segments = 20;
    }
  
    render() {
      // set color + transform
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const n = this.segments;
  
      // cone in local coords: base circle at y = 0 (radius 0.5), tip at y = 1
      const tip = [0, 1, 0];
      const center = [0, 0, 0];
      const r = 0.5;
  
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 2 * Math.PI;
        const a1 = ((i + 1) / n) * 2 * Math.PI;
  
        const p0 = [r * Math.cos(a0), 0, r * Math.sin(a0)];
        const p1 = [r * Math.cos(a1), 0, r * Math.sin(a1)];
  
        drawTriangle3D([
          tip[0], tip[1], tip[2],
          p0[0], p0[1], p0[2],
          p1[0], p1[1], p1[2],
        ]);
      }
    }
  }