// Vector Utils mostly 3D
// using arrays as vectors

// epic javascript namespace 
var Vector = {
    
    dot: function(vec1, vec2){
      if(vec1.length != vec2.length){return null;}
      var ans = 0;
      for(var i = 0; i < vec1.length; i++){
          ans += (vec1[i]*vec2[i]);
      }
      return ans;
    },
    
    cross: function(u, v){
        if(u.length != 3 && v.length != 3){return null;}
        return [(u[1]*v[2]-u[2]*v[1]), (u[2]*v[0]-u[0]*v[2]), (u[0]*v[1]-u[1]*v[0])];
    },
    normalize: function(vec){
        var scl = 1/Math.sqrt(Vector.dot(vec,vec));
            Vector.mult(vec,scl);
    },
    mult: function(vec, scalar){
        for(var i = 0; i < vec.length; i++){
            vec[i]*=scalar;
        }
    },
    
    sub: function(vec1, vec2){
        var ans = [];
        for(var i = 0; i < vec1.length; i++){
            ans[i] = (vec1[i] - vec2[i]);
        }
        return ans;
    }
    
};
