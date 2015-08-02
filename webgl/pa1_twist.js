"use strict";

var gl;
var points = [], outPoints;

var NumTimesToSubdivide;
var Angle;
var Wireframe, Sierpinski, SoftwareRender, UseColors;

var uAngle;
var uUseColors, uSoftwareRender;

var a,b,c;

// initialize triangle with center in (0, 0)
var Triangle = [
	vec2( 0.0, 1.0 ),
	vec2( -Math.cos(radians(30)), -Math.sin(radians(30)) ),
	vec2(  Math.cos(radians(30)), -Math.sin(radians(30)) )
];

$(window).load(function() {
    var canvas = $("#gl-canvas")[0];
	
    // Setup "gasket" mode checkbox, divide and redraw on each change
    Sierpinski = $("#sierp").is(":checked");
    $("#sierp").change(function() {
    	Sierpinski = $("#sierp").is(":checked");
    	divide();
    	redraw();
    });

    // Setup "wireframe" mode checkbox, divide and redraw on each change
    Wireframe = $("#wire").is(":checked");
    $("#wire").change(function() {
    	Wireframe = $("#wire").is(":checked");
    	redraw();
    });

    // Setup colors checkbox and redraw on each change
    UseColors = $("#colors").is(":checked");
    $("#colors").change(function() {
    	UseColors = $("#colors").is(":checked");
    	redraw();
    });
    
    // Setup "rendering" mode checkbox, divide and redraw on each change
    SoftwareRender = $("#render").is(":checked");
    $("#render").change(function() {
    	SoftwareRender = $("#render").is(":checked");
    	redraw();
    });
    
    // Setup angle slider, redraw on each change
	Angle = $('#angle').slider({
		tooltip: 'always'
	}).val();
    $("#angle").on("change", function (v) {
    	Angle = v.value.newValue;
		redraw();
	});

    // Setup tesselation count slider, divide on triangles and redraw on each change
	NumTimesToSubdivide = $('#tess').slider({
		tooltip: 'always',
	}).val();
    $("#tess").change(function (v) {
		NumTimesToSubdivide = v.value.newValue;
		divide();
		redraw();
	});

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	divide();
    redraw();
});

function redraw() {

    if (SoftwareRender) {
    	outPoints = twist(Angle);
    } else {
    	outPoints = points;
    }

    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(outPoints), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
  	uAngle = gl.getUniformLocation(program, "uAngle");
    a = gl.getUniformLocation(program, "a");
    b = gl.getUniformLocation(program, "b");
    c = gl.getUniformLocation(program, "c");
    uUseColors = gl.getUniformLocation(program, "uUseColors");
    uSoftwareRender = gl.getUniformLocation(program, "uSoftwareRender");
        
    render();
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count == 0 ) {
    	points.push( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
        if (!Sierpinski) {
            divideTriangle( ab, ac, bc, count );
        }
    }
}

function divide() {
	points = []
	divideTriangle( Triangle[0], Triangle[1], Triangle[2],
		NumTimesToSubdivide);
}

function twist(angleDegrees) {
	var angle = radians(angleDegrees);
	var out = []
	for (var i = 0; i < points.length; i++) {
		var p = points[i];
		var d = distance(p, vec2(0, 0));
		var x = p[0] * Math.cos(d * angle) - p[1] * Math.sin(d * angle);
		var y = p[0] * Math.sin(d * angle) + p[1] * Math.cos(d * angle);
		out.push(vec2(x, y));
	}
	return out;
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.uniform1f(uAngle, Angle);
    gl.uniform2fv(a, flatten(Triangle[0]));
    gl.uniform2fv(b, flatten(Triangle[1]));
    gl.uniform2fv(c, flatten(Triangle[2]));
    gl.uniform1i(uSoftwareRender, SoftwareRender);
    gl.uniform1i(uUseColors, UseColors);
    
    if (Wireframe) {
    	for (var i = 0; i < outPoints.length; i+=3) {
    		gl.drawArrays( gl.LINE_LOOP, i, 3 );
    	}
    } else {
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
}
