/*
* Matrix utilities and functions for 3D webGL
*============================================
*/
Matrix = function(){
    this.rows = 0;
    this.cols = 0;
    this.matrix = null;
};

/*
* aspect ratio = WIDTH/HEIGHT
* makes a perspective projection matrix
* 
*/
Matrix.makeProjectionMatrix = function(fov, znear, zfar, aspectRatio){
    
    var t = 1/Math.tan(fov/2);
    
    return new Matrix.make(
        [
            [(1/aspectRatio)*t, 0,              0,                            0           ],
            
            [        0,         t,              0,                            0           ],
            
            [        0,         0, (-znear-zfar)/(znear-zfar), (2*znear*zfar)/(znear-zfar)],
            
            [        0,         0,              1,                            0           ]
        ]
    );
}

Matrix.makeStereographigPM = function(near, far, screenWidth, screenHeight){
    return new Matrix.make(
    [
        [2/screenWidth, 0, 0, 0],
        [0, 2/screenHeight, 0, 0],
        [0, 0, 1/(far-near), -near/(far-near)],
        [0, 0, 0, 1]
    ]
    );
}

/*
* LookAt matrix
* translates and rotates world to camera view coordinates
* cameraPos, target, cameraUp all 3D vectors
*/
Matrix.makeViewMatrix = function(cameraPos, target, cameraUp){
    // cameraForward
    var f = Vector.sub(cameraPos, target);
    Vector.normalize(f);
    
    // cameraRight
    var r = Vector.cross(cameraUp, f);
    Vector.normalize(r);
    
    // should be unit vector already
    var v = Vector.cross(f, r);
    
    var p = cameraPos;
    
    return new Matrix.make(
        [
            [r[0], r[1], r[2], -r[0]*p[0]-r[1]*p[1]-r[2]*p[2] ],
            [v[0], v[1], v[2], -v[0]*p[0]-v[1]*p[1]-v[2]*p[2] ],
            [f[0], f[1], f[2], -f[0]*p[0]-f[1]*p[1]-f[2]*p[2] ],
            [ 0,     0,    0,               1              ]
        ]
    );
}

/* makes a translation matrix that translates
*  a position for 'vectors' amount
*/
Matrix.make3DTranslationMatrix = function(vector){
    if(vector.length == null || vector.length != 3){
        return null;
    }
    var M = Matrix.makeIdentity(4,4);
    M.matrix[0][3] = vector[0];
    M.matrix[1][3] = vector[1];
    M.matrix[2][3] = vector[2];
    return M;
}

/*
* make rotation matrix that rotates a vector
* around 'vector' by angle 'angle'
*/
Matrix.makeRotationMatrix = function(vector, angle){
    if(vector.length == null || vector.length != 3){
        return null;
    }
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var omc = 1 - c; //One Minus C
    
    var l = Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1] + vector[2]*vector[2]);
    var x = vector[0]/l, y = vector[1]/l, z = vector[2]/l;
    
    var M = Matrix.make(
        [
            [x*x*omc+c,   y*x*omc-z*s, z*x*omc+y*s, 0],
            [x*y*omc+z*s, y*y*omc+c,   z*y*omc-x*s, 0],
            [x*z*omc-y*s, y*z*omc+x*s, z*z*omc+c  , 0],
            [    0,            0,          0,       1]
        ]
    );
    return M;
}

// make rows x cols zero matrix
Matrix.makeZero = function(rows, cols){
    var X = new Matrix();
    X.rows = rows;
    X.cols = cols;
    X.matrix = [];
    for(var i = 0; i < X.rows; i++){
        X.matrix[i] = [];
        for(var j = 0; j < X.cols; j++){
            X.matrix[i][j] = 0;    
        }
    }
        return X;
};

Matrix.makeIdentity = function(rows, cols){
    var X = new Matrix();
    X.rows = rows;
    X.cols = cols;
    X.matrix = [];
        for(var i = 0; i < X.rows; i++){
        X.matrix[i] = [];
        for(var j = 0; j < X.cols; j++){
             X.matrix[i][j] = (i===j) ? 1 : 0;
        }
    }
        return X;
};

Matrix.makeDiagonal = function(vector){
    var X = new Matrix();
    X.rows = vector.length;
    X.cols = vector.length;
    X.matrix = [];
    for(var i = 0; i < X.rows; i++){
        this.matrix[i] = [];
        for(var j = 0; j < X.cols; j++){
            X.matrix[i][j] = (i==j) ? vector[i] : 0;
        }
    }
    return X;
};

/* 
* no validation checks at all!
* takes the first colums length as the second dimension
*/
Matrix.make = function(vectors){
    var X = new Matrix();
    
    X.rows = vectors.length;
    X.cols = vectors[0].length;
    if(X.cols == null){X.cols = 1;}
    X.matrix = vectors;
    
    return X;
};

// prototype function definitions
Matrix.prototype = {
    
    mult: function(in_matrix){
        if(!this.canMult(in_matrix)){return null}
        var M = new Matrix.makeZero(this.rows, in_matrix.cols);
        for(var i = 0; i < this.rows; i++){
            for(var j = 0; j < in_matrix.cols; j++){
                for(var k = 0; k < this.cols; k++){
                    M.matrix[i][j] += (this.matrix[i][k]*in_matrix.matrix[k][j]); 
                }
            }
        }
        return M;
    },
    
    canMult: function(in_matrix){
        if(this.matrix == null || in_matrix.matrix == null){
            return false;
        }
        return (this.cols === in_matrix.rows);
    },
    
    scalarMult: function(scalar){
        for(var i = 0; i < this.rows; i++){
            for(var j = 0; j < this.cols; j++){
                this.matrix[i][j] *= scalar;
            }
        }
    },
    
    scalarAdd: function(scalar){
                for(var i = 0; i < this.rows; i++){
            for(var j = 0; j < this.cols; j++){
                this.matrix[i][j] += scalar;
            }
        }
    },
    
    getFloat32Array: function(){
        var arr = [];
        for(var j = 0; j < this.cols; j++){
            for(var i = 0; i < this.rows; i++){
                arr.push(this.matrix[i][j]);
            }
        }
        return new Float32Array(arr);
    }
    
};