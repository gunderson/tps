precision highp float;
 
// Name it whatever it was named in the uniforms object
uniform float alpha;
uniform sampler2D colormap;
uniform vec2 colormapPosition;
 
void main(void) {
    // Standard sampling procedure. Just make sure
    // you've passed the uv coords varying.
    gl_FragColor = texture2D(colormap, colormapPosition);
}