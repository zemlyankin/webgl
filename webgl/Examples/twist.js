"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    // First, initialize the corners of the outer triangle with three points.

    var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  0.5 ),
        vec2(  0.5, -0.5 )
    ];

    // generate all the vertices in the points array

    divideTriangle( vertices[0], vertices[1], vertices[2],
                    NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

// function for putting one triangle's vertices onto points array

function triangle( a, b, c )
{
    points.push( a, b, c );
}

// recursive subdivision of a triangles with vertices a, b and c
// count = numner of recursive steps

function divideTriangle( a, b, c, count )
{

    // check for end of recursion
    // if end then add vertices of triangle to points array

    if ( count === 0 ) {
        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

      // decrement remaining recursive steps

        count--;

        // four new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
        divideTriangle(ab, ac, bc, count );
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    //uncomment next line to render with lines

    for(var i = 0; i < points.length; i+=3 ) gl.drawArrays(gl.LINE_LOOP, i, 3);

    // unconmment next line to render with filled triangles

    //gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
