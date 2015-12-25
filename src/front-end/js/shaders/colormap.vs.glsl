// create a shared variable for the
// VS and FS containing the normal
varying vec3 vNormal;

void main() {

    // set the vNormal value with
    // the attribute value passed
    // in by Three.js
    vNormal = normal;

    gl_Position = projectionMatrix *
                  modelViewMatrix *
                  vec4(position,1.0);
}
