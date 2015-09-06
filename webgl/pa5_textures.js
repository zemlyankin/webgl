"use strict";

// WebGL context
var gl;

// WebGL shader program along with all vertex and uniform variables
var shaderProgram = {};

var Textures = [];

var Sphere = {
	latitudeBands: 60,
	longitudeBands: 60,
	radius: 0.6,
	vertices: [],
	normals: [],
	indices: [],
	vBuffer: null,
	iBuffer: null,
	tBuffer: null,
};

var Rotation = {
	x: 0,
	y: 0,
	z: 0
};

$(window).load(function() {
    var canvas = $("#gl-canvas")[0];
    
    setupControls();
    setupMouseHandlers();

    Sphere.vertices = new Float32Array(sphereVertices(Sphere.latitudeBands, Sphere.longitudeBands, Sphere.radius));
    Sphere.normals = new Float32Array(sphereNormals(Sphere.vertices));
    Sphere.texCoords = new Float32Array(sphereTexCoords(Sphere.latitudeBands, Sphere.longitudeBands, Sphere.radius));
    Sphere.indices = new Uint16Array(sphereIndices(Sphere.latitudeBands, Sphere.longitudeBands));

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 0.95, 0.95, 1.0 );

    // Load shaders and initialize attribute buffers
    shaderProgram.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( shaderProgram.program );
    
    shaderProgram.vPosition = gl.getAttribLocation( shaderProgram.program, "vPosition" );
    shaderProgram.vTexCoord = gl.getAttribLocation( shaderProgram.program, "vTexCoord" );
    shaderProgram.vNormal = gl.getAttribLocation( shaderProgram.program, "vNormal" );
    shaderProgram.colorVector = gl.getUniformLocation(shaderProgram.program, "color");
	shaderProgram.transform = gl.getUniformLocation(shaderProgram.program, "transformMatrix");
	shaderProgram.modelView = gl.getUniformLocation(shaderProgram.program, "modelViewMatrix");
	shaderProgram.projection = gl.getUniformLocation(shaderProgram.program, "projectionMatrix");
	shaderProgram.normal = gl.getUniformLocation(shaderProgram.program, "normalMatrix");
	shaderProgram.translationVector = gl.getUniformLocation(shaderProgram.program, "translationVector");
	shaderProgram.rotationVector = gl.getUniformLocation(shaderProgram.program, "rotationVector");
	shaderProgram.scaleVector = gl.getUniformLocation(shaderProgram.program, "scaleVector");

    initBuffers();
    
    configureTextures();

    render();
});

function setupMouseHandlers() {

	var canvasWidth = $("#gl-canvas").width();
	var canvasHeight = $("#gl-canvas").height();

	var holder = {
		x: 0,
		y: 0,
		rotationMode: false,
	};
	
	var rotationMode = false;
	
	var getGlPos = function(event) {
		var offset = $("#gl-canvas").offset();
		var x = 2 * (event.pageX-offset.left)/canvasWidth - 1;
		var y = 1 + 2 * (offset.top - event.pageY)/canvasHeight;
		return {x: x, y: y};
	}

    $("#gl-canvas").on("mousedown", function(event) {
        var pos = getGlPos(event);
		holder.x = pos.x;
		holder.y = pos.y;
    	holder.rotationMode = true;
		event.preventDefault();
    });

    $("#gl-canvas").on("mouseup", function(event) {
    	holder.rotationMode = false;
		event.preventDefault();
    });
	
    $("#gl-canvas").on("mousemove", function(event) {
    	if (!holder.rotationMode) return;

    	var pos = getGlPos(event);
    	switch (event.buttons) {
		case 1: // left button
			var dx = -(pos.y - holder.y) * 100.0;
			var dy = (pos.x - holder.x) * 100.0;

			Rotation.x += dx;
			Rotation.y += dy;

/*			var Rx = inverse(rotateX(Rotation.x));
			var Ry = inverse(rotateY(Rotation.y));
			var Rz = inverse(rotateZ(Rotation.z));

			var screenVector = vec4(dx, dy, 0, 1.0);
			var modelVector = mult2(Rz, mult2(Ry, mult2(Rx, screenVector)));

			var newX = holder.rotY + (holder.y - pos.y) * 100.0;
			var newY = holder.rotX + (holder.x - pos.x) * 100.0;

			Rotation.x += modelVector[0];
			Rotation.y += modelVector[1];
			Rotation.z += modelVector[2];
*/
			holder.x = pos.x;
			holder.y = pos.y;

			render();
			break;
    	}
    });
}

function setupControls() {

	$(".texture")[0].classList.add("active");
	$(".texture").click(function(v) {
		$(".texture").removeClass("active");
		v.target.classList.add("active");
		render();
	});
	
}

function initBuffers() {
    Sphere.vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Sphere.vertices, gl.STATIC_DRAW );

    Sphere.nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Sphere.normals, gl.STATIC_DRAW );

    Sphere.tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Sphere.texCoords, gl.STATIC_DRAW); 

    Sphere.iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Sphere.indices, gl.STATIC_DRAW); 
}

function sphereVertices(latitudeBands, longitudeBands, radius) {
	var vertexPositionData = [];
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;

			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}
	return vertexPositionData;
}

function sphereTexCoords(latitudeBands, longitudeBands, radius) {
	var texCoords = [];
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			texCoords.push(longNumber / longitudeBands);
			texCoords.push(latNumber / latitudeBands);
		}
	}
	return texCoords;
}

function sphereNormals(vertexPositionData) {
	var normalPositionData = [];
	for (var i = 0; i < vertexPositionData.length; i+=3) {
		var p = vec3(vertexPositionData[i], vertexPositionData[i+1], vertexPositionData[i+2]);
		var normal = subtract(vec3(), p);
		normalPositionData.push(normal[0]);
		normalPositionData.push(normal[1]);
		normalPositionData.push(normal[2]);
	}
	return normalPositionData;
}

function sphereIndices(latitudeBands, longitudeBands) {
	var indexData = [];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}
	return indexData;
}

function getChosenTexture() {
	var buttons = $(".texture");
	var shapeIndex;
	for (var shapeIndex = 0; shapeIndex < buttons.length; shapeIndex++) {
		if (buttons[shapeIndex].classList.contains("active")) {
			break;
		}
	}
	return Textures[shapeIndex];
}

function configureTextures() {	
	var texSize = 256;
	var numChecks = 64;
	var image1 = new Uint8Array(4*texSize*texSize);
	var c;
	for ( var i = 0; i < texSize; i++ ) {
	    for ( var j = 0; j <texSize; j++ ) {
	        var patchx = Math.floor(i/(texSize/numChecks));
	        var patchy = Math.floor(j/(texSize/numChecks));
	        if(patchx%2 ^ patchy%2) c = 255;
	        else c = 0;
	        //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
	        image1[4*i*texSize+4*j] = c;
	        image1[4*i*texSize+4*j+1] = c;
	        image1[4*i*texSize+4*j+2] = c;
	        image1[4*i*texSize+4*j+3] = 255;
	    }
	}
	Textures.push(configureTextureFromByteArray(image1, texSize, texSize));
	
    var image2 = $("#texImage")[0];
    Textures.push(configureTextureFromHtml( image2 ));
}

function configureTextureFromByteArray(image, width, height) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

function configureTextureFromHtml( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(shaderProgram.program, "texture"), 0);
    return texture;
}

var near = 10;
var far = -10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

//
//var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
//var  aspect;       // Viewport aspect ratio
//
//var mvMatrix, pMatrix;
//var modelView, projection;
var eye;
var at = vec3(0.0, 0.0, -1.0);
var up = vec3(0.0, 1.0, 1.0);

var lightAngle = 0;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
            radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    var modelViewMatrix = lookAt(eye, at , up);
    var projectionMatrix = ortho(left, right, bottom, ytop, near, far);

	var T = mat4();
    var Rx = rotateX(Rotation.x);
    var Ry = rotateY(Rotation.y);
    var Rz = rotateZ(Rotation.z);
	var S = mat4();
	
	var transformMatrix = mult(T, mult(Rx, mult(Ry, mult(Rz, S))));
    var normalsMatrix = normalMatrix(transformMatrix, true);
	
    gl.uniformMatrix4fv( shaderProgram.transform, false, flatten(transformMatrix) );
    gl.uniformMatrix4fv( shaderProgram.modelView, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( shaderProgram.projection, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(shaderProgram.normal, false, flatten(normalsMatrix) );

	gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vBuffer);    
	gl.vertexAttribPointer( shaderProgram.vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( shaderProgram.vPosition );

//	gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.nBuffer);    
//	gl.vertexAttribPointer( shaderProgram.vNormal, 3, gl.FLOAT, false, 0, 0 );
//	gl.enableVertexAttribArray( shaderProgram.vNormal );

    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.tBuffer);
    gl.vertexAttribPointer( shaderProgram.vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( shaderProgram.vTexCoord );
    
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, getChosenTexture() );
    gl.uniform1i(gl.getUniformLocation( shaderProgram.program, "texture"), 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.iBuffer);

	var wireColor = vec4(0.5, 0.5, 0.5, 1.0);
	gl.uniform4fv(shaderProgram.colorVector, wireColor);
	gl.polygonOffset(0.0, 0.0);
	gl.drawElements(gl.LINE_STRIP, Sphere.indices.length, gl.UNSIGNED_SHORT, 0);

	var fillColor = vec4(1.0, 1.0, 1.0, 1.0);
	gl.uniform4fv(shaderProgram.colorVector, fillColor);
	gl.polygonOffset(1.0, 1.0);
	gl.drawElements(gl.TRIANGLES, Sphere.indices.length, gl.UNSIGNED_SHORT, 0);
}

function mult2( u, v )
{
    var result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length != v.length ) {
            throw "mult(): trying to add matrices of different dimensions";
        }

        for ( var i = 0; i < u.length; ++i ) {
            if ( u[i].length != v[i].length ) {
                throw "mult(): trying to add matrices of different dimensions";
            }
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( [] );

            for ( var j = 0; j < v.length; ++j ) {
                var sum = 0.0;
                for ( var k = 0; k < u.length; ++k ) {
                    sum += u[i][k] * v[k][j];
                }
                result[i].push( sum );
            }
        }

        result.matrix = true;

        return result;
    } else if ( u.matrix && !v.matrix ) {
		if ( u.length != v.length ) {
			throw "mult(): trying to mult matrice and vector of different dimensions";
		}
        for ( var i = 0; i < u.length; ++i ) {
			if ( u[i].length != v.length ) {
				throw "mult(): trying to mult matrice and vector of different dimensions";
			}
        	var sum = 0.0;
			for ( var k = 0; k < v.length; ++k ) {
				sum += u[i][k] * v[k];
			}
            result.push( sum );
        }
        return result;
    } else {
        if ( u.length != v.length ) {
            throw "mult(): vectors are not the same dimension";
        }

        for ( var i = 0; i < u.length; ++i ) {
            result.push( u[i] * v[i] );
        }

        return result;
    }
}