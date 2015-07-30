"use strict";

var gl;
var points = [], outPoints;

var NumTimesToSubdivide;
var Wireframe;
var Sierpinski;
var Angle;
var vAngle;
var SoftwareRendering = false;

// initialize triangle with center in (0, 0)
var Triangle = [
	vec2( 0.0, 1.0 ),
	vec2( -Math.cos(radians(30)), -Math.sin(radians(30)) ),
	vec2(  Math.cos(radians(30)), -Math.sin(radians(30)) )
];

$(window).load(function() {
    var canvas = $("#gl-canvas")[0];
	
    // Setup "gasket" mode checkbox, divide and redraw on each change
    Sierpinski = $("#sierp:checked").val();
    $("#sierp").change(function() {
    	Sierpinski = $("#sierp:checked").val();
    	divide();
    	redraw();
    });

    // Setup "wireframe" mode checkbox, divide and redraw on each change
    Wireframe = $("#wire:checked").val();
    $("#wire").change(function() {
    	Wireframe = $("#wire:checked").val();
    	redraw();
    });

    // Setup "rendering" mode checkbox, divide and redraw on each change
    Wireframe = $("#render:checked").val();
    $("#render").change(function() {
    	SoftwareRendering = $("#render:checked").val();
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

    if (SoftwareRendering) {
    	outPoints = twist(Angle);
    } else {
    	outPoints = points;
    }

    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, SoftwareRendering ? "vertex-shader-software" : "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(outPoints), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    if (!SoftwareRendering) {
    	vAngle = gl.getUniformLocation(program, "vAngle");
    }
    
    render();
}

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count == 0 ) {
        triangle( a, b, c );
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
    if (!SoftwareRendering) {
    	gl.uniform1f(vAngle, Angle);
	}
    if (Wireframe) {
    	for (var i = 0; i < outPoints.length; i+=3) {
    		gl.drawArrays( gl.LINE_LOOP, i, 3 );
    	}
    } else {
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
}
