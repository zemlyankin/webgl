"use strict";

// WebGL context
var gl;

// WebGL shader program along with all vertex and uniform variables
var shaderProgram = {};

// Objects to draw
var objects = []

var Sphere = {
	latitudeBands: 30,
	longitudeBands: 30,
	radius: 0.2,
	vertices: [],
	normals: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
};

var Cone = {
	sectionsNumber: 30,
	radius: 0.2,
	height: 0.4,
	vertices: [],
	normals: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
}

var Cylinder = {
	sectionsNumber: 30,
	radius: 0.2,
	height: 0.4,
	vertices: [],
	normals: [],
	indices: [],
	vBuffer: null,
	iBuffer: null
}

var Light = function(p, a, d, s) {
	return {
		position: p,
		ambient: a,
		diffuse: d,
		specular: s
	};
}

var lights = [];
lights.push(new Light(
		vec4(0.0, 0.0, 1.0, 1.0 ),
		vec4(0.2, 0.2, 0.2, 1.0 ),
		vec4( 0.1, 0.1, 0.1, 1.0 ),
		vec4( 0, 0, 0, 1.0 )
		));
lights.push(new Light(
		vec4(0, 0, -1.0, 0.0 ),
		vec4(0.0, 0.0, 0.0, 1.0 ),
		vec4( 0.5, 0.5, 0.5, 1.0 ),
		vec4( 0.0, 0.0, 1.0, 1.0 )
		));
lights.push(new Light(
		vec4(1.0, -1.0, 1.0, 1.0 ),
		vec4(0.0, 0.0, 0.0, 1.0 ),
		vec4( .5, .5, .5, 1.0 ),
		vec4( 1.0, 0.0, 0.0, 1.0 )
		));

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;

var Obj = function(shape, transVector, rotVector, scaleVector, colorVector) {
	return {
		shape: shape,
		transVector: transVector,
		rotVector: rotVector,
		scaleVector: scaleVector,
		colorVector: colorVector,
	};
}

$(window).load(function() {
    var canvas = $("#gl-canvas")[0];
//    aspect =  canvas.width/canvas.height;
    
    setupControls();
    setupMouseHandlers();

    Sphere.vertices = new Float32Array(sphereVertices(Sphere.latitudeBands, Sphere.longitudeBands, Sphere.radius));
    Sphere.normals = new Float32Array(sphereNormals(Sphere.vertices));
    Sphere.indices = new Uint16Array(sphereIndices(Sphere.latitudeBands, Sphere.longitudeBands));

    Cone.vertices = new Float32Array(coneVertices(Cone.sectionsNumber, Cone.radius, Cone.height));
    Cone.indices = new Uint16Array(coneIndices(Cone.sectionsNumber));

    Cylinder.vertices = new Float32Array(cylinderVertices(Cylinder.sectionsNumber, Cylinder.radius, Cylinder.height));
    Cylinder.normals = new Float32Array(cylinderNormals(Cylinder.vertices, Cylinder.height));
    Cylinder.indices = new Uint16Array(cylinderIndices(Cylinder.sectionsNumber));

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    // Load shaders and initialize attribute buffers
    shaderProgram.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( shaderProgram.program );
    
    shaderProgram.vPosition = gl.getAttribLocation( shaderProgram.program, "vPosition" );
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

    render();
});

function setupMouseHandlers() {

	// disable right mouse click on canvas
	$('body').on('contextmenu', '#gl-canvas', function(e){ return false; });
	
	var canvasWidth = $("#gl-canvas").width();
	var canvasHeight = $("#gl-canvas").height();

	var holder = {
		x: 0,
		y: 0,
		scaleX: 0,
		scaleY: 0,
		noAction: true,
	};
	
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
		 holder.scaleX = parseInt($("#scaleX").val());
		 holder.scaleY = parseInt($("#scaleY").val());
		 holder.rotX = parseInt($("#rotX").val());
		 holder.rotY = parseInt($("#rotY").val());
		 holder.noAction = true;
		 event.preventDefault();
     });

    $("#gl-canvas").on("mouseup", function(event){
     	var pos = getGlPos(event);
     	if (holder.noAction) {
			objects.push(getObject());
			//render();
     	}
    });
	
    $("#gl-canvas").on("mousemove", function(event){
    	var pos = getGlPos(event);
    	holder.noAction = false;
    	switch (event.buttons) {
 		case 0: // no mouse buttons pressed
			$("#transX").val(pos.x);
			$("#transY").val(pos.y);
			$("#transXval").text(pos.x.toFixed(2));
			$("#transYval").text(pos.y.toFixed(2));
			break;
		case 1: // left button
			var newX = (holder.rotY + (holder.y - pos.y) * 360.0).toFixed(0);
			var newY = (holder.rotX + (holder.x - pos.x) * 360.0).toFixed(0)
			$("#rotX").val(newX);
			$("#rotY").val(newY);
			$("#rotXval").text($("#rotX").val());
			$("#rotYval").text($("#rotY").val());
			break;
		case 2: // right button
			var newX = Math.round(holder.scaleX + (pos.x - holder.x) * 100);
			var newY = Math.round(holder.scaleY + (pos.y - holder.y) * 100);
			$("#scaleX").val(newX);
			$("#scaleY").val(newY);
			$("#scaleXval").text($("#scaleX").val());
			$("#scaleYval").text($("#scaleY").val());
			break;
    	}
        //render();
    });

    $("#gl-canvas").on("wheel", function(event) {
    	switch (event.originalEvent.buttons) {
 		case 0: // no mouse buttons pressed
			var newZ = parseFloat($("#transZ").val());
			event.originalEvent.wheelDelta > 0 ? newZ += 0.02 : newZ -= 0.02;
			newZ = newZ.toFixed(2);
			$("#transZ").val(newZ);
			$("#transZval").text(newZ);
			break;
		case 1: // left button
			var newZ = parseFloat($("#rotZ").val());
			event.originalEvent.wheelDelta > 0 ? newZ -= 2 : newZ += 2;
			$("#rotZ").val(newZ.toFixed(0));
			$("#rotZval").text(newZ.toFixed(0));
			break;
		case 2: // right button
			var newZ = parseInt($("#scaleZ").val());
			event.originalEvent.wheelDelta > 0 ? newZ += 2 : newZ -= 2;
			$("#scaleZ").val(newZ);
			$("#scaleZval").text($("#scaleZ").val());
			break;
    	}
		event.preventDefault();
		//render();
	});	
}

function setupControls() {
	$("#transX").on("input", function(v) {
		$("#transXval").text(v.target.value);
		//render();
	});

	$("#transY").on("input", function(v) {
		$("#transYval").text(v.target.value);
		//render();
	});

	$("#transZ").on("input", function(v) {
		$("#transZval").text(v.target.value);
		//render();
	});
    
	$("#rotX").on("input", function(v) {
		$("#rotXval").text(v.target.value);
		//render();
	});

	$("#rotY").on("input", function(v) {
		$("#rotYval").text(v.target.value);
		//render();
	});

	$("#rotZ").on("input", function(v) {
		$("#rotZval").text(v.target.value);
		//render();
	});
    
	$("#scaleX").on("input", function(v) {
		$("#scaleXval").text(v.target.value);
		//render();
	});

	$("#scaleY").on("input", function(v) {
		$("#scaleYval").text(v.target.value);
		//render();
	});

	$("#scaleZ").on("input", function(v) {
		$("#scaleZval").text(v.target.value);
		//render();
	});

	$(".shape")[0].classList.add("active");
	$(".shape").click(function(v) {
		$(".shape").removeClass("active");
		v.target.classList.add("active");
		//render();
	});

	$("#add").click(function(v) {
		objects.push(getObject());
		//render();
	});

	$("#clear").click(function(v) {
		objects = [];
		//render();
	});
}

function initBuffers() {
    Sphere.vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Sphere.vertices, gl.STATIC_DRAW );

    Sphere.nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Sphere.nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Sphere.normals, gl.STATIC_DRAW );

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

    Cylinder.nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, Cylinder.nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, Cylinder.normals, gl.STATIC_DRAW );

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

function cylinderNormals(vertexPositionData, height) {
	var normalPositionData = [];
	var y1 = height / 2.0;
	var y2 = -height / 2.0;
	for (var i = 0; i < vertexPositionData.length - 6; i+=12) {
		var p = vec3(vertexPositionData[i], vertexPositionData[i+1], vertexPositionData[i+2]);
		var normal = normalize(subtract(p, vec3(0, y1, 0)));
		normalPositionData.push(normal[0]);
		normalPositionData.push(normal[1]);
		normalPositionData.push(normal[2]);
		
		var p = vec3(vertexPositionData[i+3], vertexPositionData[i+4], vertexPositionData[i+5]);
		var normal = normalize(subtract(p, vec3(0, y2, 0)));
		normalPositionData.push(normal[0]);
		normalPositionData.push(normal[1]);
		normalPositionData.push(normal[2]);
		
		var normal = vec3(0.0, 1.0, 0.0);
		normalPositionData.push(normal[0]);
		normalPositionData.push(normal[1]);
		normalPositionData.push(normal[2]);

		var normal = vec3(0.0, -1, 0.0);
		normalPositionData.push(normal[0]);
		normalPositionData.push(normal[1]);
		normalPositionData.push(normal[2]);
	}
	var normal = vec3(0.0, -1.0, 0.0);
	normalPositionData.push(normal[0]);
	normalPositionData.push(normal[1]);
	normalPositionData.push(normal[2]);
	var normal = vec3(0.0, 1.0, 0.0);
	normalPositionData.push(normal[0]);
	normalPositionData.push(normal[1]);
	normalPositionData.push(normal[2]);
	return normalPositionData;
}

function cylinderIndices(sectionsNumber) {
    var indexData = [];
    var bottom = (sectionsNumber + 1) * 4;
    var top = (sectionsNumber + 1) * 4 + 1;
    for (var section = 0; section < sectionsNumber; section++) {
    	var first = section * 4;
    	var second = first + 4;

     	indexData.push(first + 2);
        indexData.push(second + 2);
        indexData.push(top);

    	indexData.push(first);
        indexData.push(first+1);
        indexData.push(second);

    	indexData.push(second);
        indexData.push(first+1);
        indexData.push(second+1);

     	indexData.push(first + 1 + 2);
        indexData.push(bottom);
        indexData.push(second + 1 + 2);
    }
    return indexData;
}

function getObject() {
	var tx = parseFloat($("#transX").val());
	var ty = parseFloat($("#transY").val());
	var tz = parseFloat($("#transZ").val());
	var T = vec3(tx, ty, tz);

	var rx = parseFloat($("#rotX").val());
	var ry = parseFloat($("#rotY").val());
	var rz = parseFloat($("#rotZ").val());
	var R = vec3(rx, ry, rz);

	var sx = parseFloat($("#scaleX").val()) / 100.0;
	var sy = parseFloat($("#scaleY").val()) / 100.0;
	var sz = parseFloat($("#scaleZ").val()) / 100.0;
	var S = vec3(sx, sy, sz);

	// get chosen shape
	var buttons = $(".shape");
	var refShapes = [Sphere, Cone, Cylinder];
	var shapeIndex;
	for (var shapeIndex = 0; shapeIndex < buttons.length; shapeIndex++) {
		if (buttons[shapeIndex].classList.contains("active")) {
			break;
		}
	}

	// get chosen color
	var c = parseInt($("#color").val().slice(1), 16);
    var r = ((c >> 16) & 0xFF) / 255.0;
    var g = ((c >> 8) & 0xFF) / 255.0;
    var b = (c & 0xFF) / 255.0; 
    var color = vec4(r, g, b, 1.0);

	return new Obj(refShapes[shapeIndex], T, R, S, color);
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

    objects.push(getObject());
    
    lightAngle+=1;
	lights[1].position[0] = Math.sin(radians(lightAngle));
    lights[1].position[1] = 0.0;
	lights[1].position[2] = Math.cos(radians(lightAngle));
    lights[2].position[0] = -1.0;
	lights[2].position[1] = Math.cos(radians(lightAngle));
	lights[2].position[2] = Math.sin(radians(lightAngle));

	for (var i = 0; i < objects.length; i++) {
		var o = objects[i];
		var fillColor = (i < objects.length - 1) ? o.colorVector : vec4(1.0, 1.0, 1.0, 1.0);
	
		materialAmbient = fillColor;
	    var ambientProduct = [];
	    var diffuseProduct = [];
	    var specularProduct = [];
	    var lightPosition = [];
	    
	    for (var l = 0; l < lights.length; l++) {
	    	ambientProduct.push(mult(lights[l].ambient, materialAmbient));
	    	diffuseProduct.push(mult(lights[l].diffuse, materialDiffuse));
	    	specularProduct.push(mult(lights[l].specular, materialSpecular));
	    	lightPosition.push(lights[l].position);
	    }
	    gl.uniform4fv( gl.getUniformLocation(shaderProgram.program, "ambientProduct"),flatten(ambientProduct) );
	    gl.uniform4fv( gl.getUniformLocation(shaderProgram.program, "diffuseProduct"),flatten(diffuseProduct) );
	    gl.uniform4fv( gl.getUniformLocation(shaderProgram.program, "specularProduct"),flatten(specularProduct) );
	    gl.uniform4fv( gl.getUniformLocation(shaderProgram.program, "lightPosition"),flatten(lightPosition) );
	    gl.uniform1f( gl.getUniformLocation(shaderProgram.program, "shininess"),materialShininess );
	    
	    var T = translate(o.transVector)
	    var Rx = rotateZ(o.rotVector[0]);
	    var Ry = rotateY(o.rotVector[1]);
	    var Rz = rotateZ(o.rotVector[2]);
		var S = scalem(o.scaleVector);
		
		var transformMatrix = mult(T, mult(Rx, mult(Ry, mult(Rz, S))));
	    var normalMatrix_ = normalMatrix(transformMatrix, true);
	    //normalMatrix_ = [1,0,0,0,1,0,0,0,1];
		
	    gl.uniformMatrix4fv( shaderProgram.transform, false, flatten(transformMatrix) );
	    gl.uniformMatrix4fv( shaderProgram.modelView, false, flatten(modelViewMatrix) );
	    gl.uniformMatrix4fv( shaderProgram.projection, false, flatten(projectionMatrix) );
	    gl.uniformMatrix3fv(shaderProgram.normal, false, flatten(normalMatrix_) );

		gl.bindBuffer(gl.ARRAY_BUFFER, o.shape.vBuffer);    
		gl.vertexAttribPointer( shaderProgram.vPosition, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( shaderProgram.vPosition );
		gl.bindBuffer(gl.ARRAY_BUFFER, o.shape.nBuffer);    
		gl.vertexAttribPointer( shaderProgram.vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( shaderProgram.vNormal );
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.shape.iBuffer);
//		var wireColor;
//		if (fillColor[0] + fillColor[1] + fillColor[2] > 1.5) wireColor = vec4(0.0, 0.0, 0.0, 0.5);
//		else wireColor = vec4(0.5, 0.5, 0.5, 0.5)
//		gl.uniform4fv(shaderProgram.colorVector, wireColor);
//		gl.polygonOffset(0.0, 0.0);
//		gl.drawElements(gl.LINE_STRIP, o.shape.indices.length, gl.UNSIGNED_SHORT, 0);
		gl.uniform4fv(shaderProgram.colorVector, fillColor);
		gl.polygonOffset(1.0, 1.0);
		gl.drawElements(gl.TRIANGLES, o.shape.indices.length, gl.UNSIGNED_SHORT, 0);
	}

    objects.pop();
    
    window.requestAnimFrame(render);
}
