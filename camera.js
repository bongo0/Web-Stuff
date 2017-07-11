Camera = function(canvas){
    this.canvas = canvas;
    this.pitch = 0.0;
    this.yaw = Math.PI/2.0;
    
    this.lastMouseX = 0.0;
    this.lastMouseY = 0.0;
    
    this.pos = [0.0,0.0,0.0];
    this.up = [0.0, 1.0, 0.0];
    this.target = [0.0, 0.0, 1.0];
    this.viewMatrix = Matrix.makeViewMatrix(this.pos, this.target, this.up);
    
    this.mousePressed = false;
    
    this.canvas.addEventListener('mousemove', (evt)=> {this.mouseEventUpdate(evt)});
    
    this.canvas.addEventListener('mousedown', ()=>{
        this.mousePressed = true;
        console.log('mouseDown');
    });
    this.canvas.addEventListener('mouseup', ()=>{
        this.mousePressed = false;
        console.log('mouseUp');
    });
};

Camera.prototype.update = function(dYaw, dPitch){
    
    // bounding camera angles
    this.pitch += dPitch;
    if(this.pitch > Math.PI/2.0){
        this.pitch = Math.PI/2.0;
    } else if(this.pitch < -Math.PI/2.0){
        this.pitch = -Math.PI/2.0;
    }
    this.yaw += dYaw;
    if(this.yaw > 2*Math.PI || this.yaw < -2*Math.PI){
        this.yaw = 0.0;
    }
    
    // recalculating camera target
    this.target = [
        // x:
        Math.cos(this.yaw)*Math.cos(this.pitch),
        // y:
        Math.sin(this.pitch),
        // z:
        Math.sin(this.yaw)*Math.cos(this.pitch)
    ];
    
    this.viewMatrix = Matrix.makeViewMatrix(this.pos, this.target, this.up);
}

Camera.prototype.mouseEventUpdate = function(evt){
    
    // get current mouse pos as Normalized Device Coordinates
    var rect = this.canvas.getBoundingClientRect();
    var height = this.canvas.clientHeight;
    var width = this.canvas.clientWidth;
    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;    
    var NDCx = (2*x - width)/width;
    var NDCy = (2*y - height)/height;
    if(this.mousePressed){
    this.update(NDCx - this.lastMouseX, -NDCy + this.lastMouseY);
    }
    this.lastMouseX = NDCx;
    this.lastMouseY = NDCy;
    console.log(this.yaw,' : ', this.pitch);
}

