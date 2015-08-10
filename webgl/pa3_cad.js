"use strict";

var gl;

var Shape = {
	vertices: [],
	indices: []
}

var Sphere = {
	latitudeBands: 30,
	longitudeBands: 30,
	radius: 0.2,
	x: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
};

var Cone = {
	sectionsNumber: 30,
	radius: 0.2,
	height: 0.4,
	vertices: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
}


var Cylinder = {
	sectionsNumber: 30,
	radius: 0.2,
	height: 0.4,
	vertices: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
}

var ShaderProgram = {
	program: null,
	vPosition: 0,
	colorVector: null,
	uTransMatrix: null,
}

var Obj = function(shape, transVector, rotVector, scaleVector, colorVector) {
	return {
		shape: shape,
		transVector: transVector,
		rotVector: rotVector,
		scaleVector: scaleVector,
		colorVector: colorVector,
	};
}

var objects = []

$(window).load(function() {
    var canvas = $("#gl-canvas")[0];
    aspect =  canvas.width/canvas.height;

	var startXY = {
		x: 0,
		y: 0
	};
	var getXY = function(event) {
		var offset = $("#gl-canvas").offset();
		var x = 2 * (event.pageX-offset.left)/canvas.width - 1;
		var y = 1 + 2 * (offset.top - event.pageY)/canvas.height;
		return {x: x, y: y};
	}
    canvas.addEventListener("mousemove", function(event){
    	var pos = getXY(event);
    	switch (event.buttons) {
 		case 0:
			$("#transX").val(pos.x);
			$("#transY").val(pos.y);
			break;
		case 1:
			$("#rotX").val((startXY.y - pos.y) * 360.0);
			$("#rotY").val((startXY.x - pos.x) * 360.0);
			break;
    	}
        render();
    });

     canvas.addEventListener("mousedown", function(event) {
     	 var pos = getXY(event);
		 startXY.x = pos.x;
		 startXY.y = pos.y;
     });
//     canvas.addEventListener("mouseup", mouseupHandler);

	canvas.addEventListener("wheel", function(event) {
		var newZ;
		if (event.wheelDelta > 0) {
			newZ = parseFloat($("#transZ").val()) + 0.01;
		} else {
			newZ = parseFloat($("#transZ").val()) - 0.01;
		}
		console.log(newZ);
		$("#transZ").val(newZ);
		render();
		event.preventDefault();
	});

    $("#gl-canvas").click(function(event) {
    	objects.push(getObject());
    	render();
    });

	$("#transX").on("input", function(v) {
		$("#transXval").text(v.target.value);
		render();
	});

	$("#transY").on("input", function(v) {
		$("#transYval").text(v.target.value);
		render();
	});

	$("#transZ").on("input", function(v) {
		$("#transZval").text(v.target.value);
		render();
	});
    
	$("#rotX").on("input", function(v) {
		$("#rotXval").text(v.target.value);
		render();
	});

	$("#rotY").on("input", function(v) {
		$("#rotYval").text(v.target.value);
		render();
	});

	$("#rotZ").on("input", function(v) {
		$("#rotZval").text(v.target.value);
		render();
	});
    
	$("#scaleX").on("input", function(v) {
		$("#scaleXval").text(v.target.value);
		render();
	});

	$("#scaleY").on("input", function(v) {
		$("#scaleYval").text(v.target.value);
		render();
	});

	$("#scaleZ").on("input", function(v) {
		$("#scaleZval").text(v.target.value);
		render();
	});

	$(".shape")[0].classList.add("active");
	$(".shape").click(function(v) {
		$(".shape").removeClass("active");
		v.target.classList.add("active");
		render();
	});

	$("#add").click(function(v) {
		objects.push(getObject());
		render();
	});

	$("#clear").click(function(v) {
		objects = [];
		render();
	});

    Sphere.vertices = new Float32Array(sphereVertices(Sphere.latitudeBands, Sphere.longitudeBands, Sphere.radius));
    Sphere.indices = new Uint16Array(sphereIndices(Sphere.latitudeBands, Sphere.longitudeBands));

    Cone.vertices = new Float32Array(coneVertices(Cone.sectionsNumber, Cone.radius, Cone.height));
    Cone.indices = new Uint16Array(coneIndices(Cone.sectionsNumber));

    Cylinder.vertices = new Float32Array(cylinderVertices(Cylinder.sectionsNumber, Cylinder.radius, Cylinder.height));
    Cylinder.indices = new Uint16Array(cylinderIndices(Cylinder.sectionsNumber));

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // Load shaders and initialize attribute buffers
    ShaderProgram.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( ShaderProgram.program );

    ShaderProgram.vPosition = gl.getAttribLocation( ShaderProgram.program, "vPosition" );

    initBuffers();
    ShaderProgram.colorVector = gl.getUniformLocation(ShaderProgram.program, "color");
	ShaderProgram.modelView = gl.getUniformLocation(ShaderProgram.program, "modelViewMatrix")
	ShaderProgram.projection = gl.getUniformLocation(ShaderProgram.program, "projectionMatrix")
	ShaderProgram.translationVector = gl.getUniformLocation(ShaderProgram.program, "translationVector")
	ShaderProgram.rotationVector = gl.getUniformLocation(ShaderProgram.program, "rotationVector")
	ShaderProgram.scaleVector = gl.getUniformLocation(ShaderProgram.program, "scaleVector")

    render();
});

function initBuffers() {
    Sphere.vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Sphere.vertices, gl.STATIC_DRAW );

    Sphere.iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Sphere.indices, gl.STATIC_DRAW); 

    Cone.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cone.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cone.vertices, gl.STATIC_DRAW);

    Cone.iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cone.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Cone.indices, gl.STATIC_DRAW); 

    Cylinder.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cylinder.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cylinder.vertices, gl.STATIC_DRAW);

    Cylinder.iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cylinder.iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Cylinder.indices, gl.STATIC_DRAW);
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

function coneVertices(sectionsNumber, radius, height) {
	var vertexPositionData = [];
    for (var section = 0; section <= sectionsNumber; section++) {
		var theta = section * 2 * Math.PI / sectionsNumber;
		var x = Math.sin(theta);
		var y = -height / 2.0;
		var z = Math.cos(theta);

		vertexPositionData.push(radius * x);
		vertexPositionData.push(y);
		vertexPositionData.push(radius * z);
    }
	vertexPositionData.push(0);
	vertexPositionData.push(-height / 2.0);
	vertexPositionData.push(0);
	vertexPositionData.push(0);
	vertexPositionData.push(height / 2.0);
	vertexPositionData.push(0);
    return vertexPositionData;
}


function coneIndices(sectionsNumber) {
    var indexData = [];
    var bottom = sectionsNumber + 1;
    var top = sectionsNumber + 2;
    for (var section = 0; section < sectionsNumber; section++) {
    	var first = section;
    	var second = section + 1;
    	indexData.push(first);
        indexData.push(second);
        indexData.push(top);
    	indexData.push(first);
        indexData.push(second);
        indexData.push(bottom);
    }
    return indexData;
}

function cylinderVertices(sectionsNumber, radius, height) {
	var vertexPositionData = [];
	var y1 = height / 2.0;
	var y2 = -height / 2.0;
    for (var section = 0; section <= sectionsNumber; section++) {
		var theta = section * 2 * Math.PI / sectionsNumber;
		var x = Math.sin(theta);
		var z = Math.cos(theta);

		vertexPositionData.push(radius * x);
		vertexPositionData.push(y1);
		vertexPositionData.push(radius * z);
		vertexPositionData.push(radius * x);
		vertexPositionData.push(y2);
		vertexPositionData.push(radius * z);
    }
    vertexPositionData.push(0);
	vertexPositionData.push(-height / 2.0);
	vertexPositionData.push(0);
	vertexPositionData.push(0);
	vertexPositionData.push(height / 2.0);
	vertexPositionData.push(0);
    return vertexPositionData;
}


function cylinderIndices(sectionsNumber) {
    var indexData = [];
    var bottom = (sectionsNumber + 1) * 2;
    var top = (sectionsNumber + 1) * 2 + 1;
    for (var section = 0; section < sectionsNumber; section++) {
    	var first = section * 2;
    	var second = first + 2;

     	indexData.push(first);
        indexData.push(second);
        indexData.push(top);

    	indexData.push(first);
        indexData.push(first+1);
        indexData.push(second);

    	indexData.push(second);
        indexData.push(first+1);
        indexData.push(second+1);

     	indexData.push(first + 1);
        indexData.push(bottom);
        indexData.push(second + 1);
    }
    return indexData;
}

function getObject() {
	var tx = $("#transX").val();
	var ty = $("#transY").val();
	var tz = $("#transZ").val();
	var T = vec3(tx, ty, tz);

	var rx = $("#rotX").val();
	var ry = $("#rotY").val();
	var rz = $("#rotZ").val();
	var R = vec3(rx, ry, rz);

	var sx = $("#scaleX").val();
	var sy = $("#scaleY").val();
	var sz = $("#scaleZ").val();
	var S = vec3(sx, sy, sz);

	var buttons = $(".shape");
	var refShapes = [Sphere, Cone, Cylinder];
	var shapeIndex;
	for (var shapeIndex = 0; shapeIndex < buttons.length; shapeIndex++) {
		if (buttons[shapeIndex].classList.contains("active")) {
			break;
		}
	}

	var c = parseInt($("#color").val().slice(1), 16);
    var r = ((c >> 16) & 0xFF) / 255.0;
    var g = ((c >> 8) & 0xFF) / 255.0;
    var b = (c & 0xFF) / 255.0; 
    var color = vec4(r, g, b, 1.0);

	return new Obj(refShapes[shapeIndex], T, R, S, color);
}

var near = 0.3;
var far = 3.0;
var radius = 3;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( ShaderProgram.modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( ShaderProgram.projection, false, flatten(pMatrix) );

    objects.push(getObject());

	for (var i = 0; i < objects.length; i++) {
		var o = objects[i];
		gl.uniform3fv(ShaderProgram.translationVector, o.transVector);
		gl.uniform3fv(ShaderProgram.rotationVector, o.rotVector);
		gl.uniform3fv(ShaderProgram.scaleVector, o.scaleVector);
		gl.bindBuffer(gl.ARRAY_BUFFER, o.shape.vBuffer);    
		gl.vertexAttribPointer( ShaderProgram.vPosition, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( ShaderProgram.vPosition );
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.shape.iBuffer);
		gl.uniform4fv(ShaderProgram.colorVector, vec4(0.0, 0.0, 0.0, 0.5));
		gl.drawElements(gl.LINE_STRIP, o.shape.indices.length, gl.UNSIGNED_SHORT, 0);
		if (i < objects.length - 1) {
			gl.uniform4fv(ShaderProgram.colorVector, o.colorVector);
			gl.drawElements(gl.TRIANGLES, o.shape.indices.length, gl.UNSIGNED_SHORT, 0);
		}
	}

    objects.pop();
}
