"use strict";

var gl;
var canvas;
var vBuffer, cBuffer;

var lineWidth;
var lineColor;

var painting = false;

var numLines = 0;
var indices = [];
var totalIndex = 0;
var colors = [];
var width = [];

var numVertices = 1024*1024;
var vertexSize = 8;
var colorSize = 16;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    canvas.addEventListener("mousemove", mousemoveHandler);
    canvas.addEventListener("mouseup", mouseupHandler);
    canvas.addEventListener("mousedown", mousedownHandler);

    document.getElementById("clear").addEventListener("click", clear);
    
    lineWidth = document.getElementById("lineWidth").value;
    document.getElementById("lineWidth").onchange = function() {
    	lineWidth = this.value;
    }
  
    lineColor = document.getElementById("lineColor").value;
    document.getElementById("lineColor").oninput = function() {
    	lineColor = this.value;
    }

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.98, 0.98, 0.98, 1.0 );

    // Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // create buffer for vertices
	vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, numVertices * vertexSize, gl.STATIC_DRAW );

	// Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // create colors buffer
	cBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, numVertices * colorSize, gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    render();
};

var mousedownHandler = function(event){
    indices[numLines] = 0;
    width[numLines] = lineWidth;
    var c = parseInt(lineColor.slice(1), 16);
    var r = ((c >> 16) & 0xFF) / 255.0;
    var g = ((c >> 8) & 0xFF) / 255.0;
    var b = (c & 0xFF) / 255.0; 
    colors[numLines] = vec4(r, g, b, 1);
    numLines++;
	painting = true;
}

var mousemoveHandler = function(event){
    if (!painting) return;
    
    var t = vec2(2*(event.clientX-canvas.offsetLeft)/canvas.width-1,
           2*(canvas.height-event.clientY+canvas.offsetTop)/canvas.height-1);
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, vertexSize * totalIndex, flatten(t));
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, colorSize * totalIndex, flatten(colors[numLines-1]));
    
    indices[numLines-1]++;
    totalIndex++;
}

var mouseupHandler = function(event){
	painting = false;
}

var clear = function() {
	numLines = 0;
	indices = [];
	colors = [];
	width = [];
	totalIndex = 0;
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    var start = 0;
    for (var i = 0; i < numLines; i++) {
    	gl.lineWidth(width[i]);
    	gl.drawArrays( gl.LINE_STRIP, start, indices[i]);
    	start += indices[i];
    }
    
    window.requestAnimFrame(render);
}
