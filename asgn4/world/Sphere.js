// Sphere.js

class Sphere {
    constructor(latBands = 18, lonBands = 18) {
      this.type = "sphere";
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
      this.textureNum = -2;
  
      this.latBands = latBands;
      this.lonBands = lonBands;
    }
  
    render() {
      const rgba = this.color;
  
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // normal matrix for GlobalRotate * Model
      const worldMat = new Matrix4(g_globalRotMat);
      worldMat.multiply(this.matrix);
  
      const normalMat = new Matrix4();
      normalMat.setInverseOf(worldMat);
      normalMat.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  
      for (let lat = 0; lat < this.latBands; lat++) {
        const theta0 = (lat / this.latBands) * Math.PI;
        const theta1 = ((lat + 1) / this.latBands) * Math.PI;
  
        for (let lon = 0; lon < this.lonBands; lon++) {
          const phi0 = (lon / this.lonBands) * 2 * Math.PI;
          const phi1 = ((lon + 1) / this.lonBands) * 2 * Math.PI;
  
          // 4 corners on unit sphere
          const p00 = sph(theta0, phi0);
          const p10 = sph(theta1, phi0);
          const p01 = sph(theta0, phi1);
          const p11 = sph(theta1, phi1);
  
          const uv00 = [lon / this.lonBands, lat / this.latBands];
          const uv10 = [lon / this.lonBands, (lat + 1) / this.latBands];
          const uv01 = [(lon + 1) / this.lonBands, lat / this.latBands];
          const uv11 = [(lon + 1) / this.lonBands, (lat + 1) / this.latBands];
  
          // Triangle 1: p00, p10, p11
          drawTriangle3DUVNormal(
            [...p00, ...p10, ...p11],
            [...uv00, ...uv10, ...uv11],
            [...p00, ...p10, ...p11] // normal = position for unit sphere
          );
  
          // Triangle 2: p00, p11, p01
          drawTriangle3DUVNormal(
            [...p00, ...p11, ...p01],
            [...uv00, ...uv11, ...uv01],
            [...p00, ...p11, ...p01]
          );
        }
      }
  
      function sph(theta, phi) {
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.cos(theta);
        const z = Math.sin(theta) * Math.sin(phi);
        return [x, y, z];
      }
    }
  }