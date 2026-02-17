//Cube.js
class Cube {
    constructor(){
        this.type = 'cube';
        //this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        //this.size = 5.0;
        //this.segments = 10;

        // CHANGE BACK ONCE FIXED
        this.matrix = new Matrix4();
        this.textureNum = 0;
    }


    render() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0],rgba[1],rgba[2],rgba[3]);
 
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        drawTriangle3DUV( [0,0,0 , 1,1,0, 1,0,0], [1,0, 0,1, 1,1]);
        drawTriangle3DUV( [0,0,0 , 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);
        // FRONT (z = 0)
        //drawTriangle3D( [0.0,0.0,0.0,   1.0,1.0,0.0,    1.0,0.0,0.0]);
       // drawTriangle3D( [0.0,0.0,0.0,   0.0,1.0,0.0,    1.0,1.0,0.0]);

        // BACK (z = 1)
       // drawTriangle3D([0,0,1,  1,0,1,  1,1,1]);
        drawTriangle3DUV([0,0,1,  1,0,1,  1,1,1], [1,0, 0,1, 1,1]);
        //drawTriangle3D([0,0,1,  1,1,1,  0,1,1]);
        drawTriangle3DUV([0,0,1,  1,1,1,  0,1,1],[0,0, 0,1, 1,1]);

        // LEFT (x = 0)
       // drawTriangle3D([0,0,0,  0,0,1,  0,1,1]);
       drawTriangle3DUV([0,0,0,  0,0,1,  0,1,1], [1,0, 0,1, 1,1]);
       // drawTriangle3D([0,0,0,  0,1,1,  0,1,0]);
       //drawTriangle3DUV([0,0,0,  0,0,1,  0,1,1],[0,0, 0,1, 1,1]);
       drawTriangle3DUV([0,0,0,  0,1,1,  0,1,0], [1,0, 0,1, 1,1]);

        // TOP (y = 1)
       // drawTriangle3D([0,1,0,  0,1,1,  1,1,1]);
       drawTriangle3DUV([0,1,0,  0,1,1,  1,1,1], [1,0, 0,1, 1,1]);
       // drawTriangle3D([0,1,0,  1,1,1,  1,1,0]);
       drawTriangle3DUV([0,1,0,  1,1,1,  1,1,0],[0,0, 0,1, 1,1]);

        

        // Shade for top and bottom to sim 3D
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        /*
        // RIGHT (x = 1)
        drawTriangle3D([1,0,0,  1,1,1,  1,0,1]);
        drawTriangle3D([1,0,0,  1,1,0,  1,1,1]);

        // BOTTOM (y = 0)
        drawTriangle3D([0,0,0,  1,0,1,  0,0,1]);
        drawTriangle3D([0,0,0,  1,0,0,  1,0,1]);
        */
       // RIGHT (x = 1)
        drawTriangle3DUV([1,0,0,  1,1,1,  1,0,1], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([1,0,0,  1,1,0,  1,1,1], [0,0, 0,1, 1,1]);

        // BOTTOM (y = 0)
        drawTriangle3DUV([0,0,0,  1,0,1,  0,0,1], [0,0, 1,1, 0,1]);
        drawTriangle3DUV([0,0,0,  1,0,0,  1,0,1], [0,0, 1,0, 1,1]);
    }
}
