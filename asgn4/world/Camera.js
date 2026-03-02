// Camera.js
// Requires cuon-matrix-cse160.js (Vector3, Matrix4)

class Camera {
    constructor(canvas) {
      this.fov = 60;
  
      this.eye = new Vector3([0, 1, 6]);
      this.at  = new Vector3([0, 0, 0]);
      this.up  = new Vector3([0, 1, 0]);
  
      this.viewMatrix = new Matrix4();
      this.projectionMatrix = new Matrix4();
  
      this.updateView();
      this.updateProjection(canvas);
    }
  
    updateView() {
      const e = this.eye.elements;
      const a = this.at.elements;
      const u = this.up.elements;
  
      this.viewMatrix.setLookAt(
        e[0], e[1], e[2],
        a[0], a[1], a[2],
        u[0], u[1], u[2]
      );
    }
  
    updateProjection(canvas) {
      this.projectionMatrix.setPerspective(
        this.fov,
        canvas.width / canvas.height,
        0.1,
        1000
      );
    }
  
    moveForward(speed = 0.2) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
      f.normalize();
      f.mul(speed);
  
      this.eye.add(f);
      this.at.add(f);
  
      this.updateView();
    }
  
    moveBackwards(speed = 0.2) {
      let b = new Vector3();
      b.set(this.eye);
      b.sub(this.at);
      b.normalize();
      b.mul(speed);
  
      this.eye.add(b);
      this.at.add(b);
  
      this.updateView();
    }
  
    moveLeft(speed = 0.2) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
  
      let s = Vector3.cross(this.up, f);
      s.normalize();
      s.mul(speed);
  
      this.eye.add(s);
      this.at.add(s);
  
      this.updateView();
    }
  
    moveRight(speed = 0.2) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
  
      let s = Vector3.cross(f, this.up);
      s.normalize();
      s.mul(speed);
  
      this.eye.add(s);
      this.at.add(s);
  
      this.updateView();
    }
  
    panLeft(alpha = 5) {
      let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
  
      let rot = new Matrix4();
      const u = this.up.elements;
      rot.setRotate(alpha, u[0], u[1], u[2]);
  
      let fPrime = rot.multiplyVector3(f);
  
      this.at.set(this.eye);
      this.at.add(fPrime);
  
      this.updateView();
    }
  
    panRight(alpha = 5) {
      this.panLeft(-alpha);
    }
  }