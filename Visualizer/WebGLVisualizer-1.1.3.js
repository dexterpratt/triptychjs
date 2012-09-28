/*
   Copyright 2012 Dexter Pratt

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


TRIPTYCH.WebGLVisualizer = function(){
	
	this.showLabels = true;
	this.showEdgeLabels = true;
	this.nodeDisplayers = {};
	this.edgeDisplayers = {};
	this.timeLoop = {};

};

TRIPTYCH.WebGLVisualizer.prototype = new TRIPTYCH.Visualizer();

TRIPTYCH.WebGLVisualizer.prototype.constructor = TRIPTYCH.WebGLVisualizer;

//--------------------------------------
//
// Displayers
//
//--------------------------------------

// get node displayer
TRIPTYCH.WebGLVisualizer.prototype.getNodeDisplayer = function(node){
	var displayer = this.nodeDisplayers[node.type];
	return displayer || this.defaultNodeDisplayer;
};

// add node displayer
TRIPTYCH.WebGLVisualizer.prototype.addNodeDisplayer = function(type, displayer){
	displayer.visualizer = this;
	this.nodeDisplayers[type] = displayer;
};

// get edge displayer
TRIPTYCH.WebGLVisualizer.prototype.getEdgeDisplayer = function(edge){
	var displayer = this.edgeDisplayers[edge.relationship.type];
	return displayer || this.defaultEdgeDisplayer;
};

// add edge displayer
TRIPTYCH.WebGLVisualizer.prototype.addEdgeDisplayer = function(type, displayer){
	displayer.visualizer = this;
	this.edgeDisplayers[type] = displayer;
};

//--------------------------------------
//
// Basic WebGL Node Displayer
//
//--------------------------------------

TRIPTYCH.WebGLNodeDisplayer = function(){
	this.plainMaterialName = "defaultSurfaceMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.WebGLNodeDisplayer.prototype = {

	constructor : TRIPTYCH.WebGLNodeDisplayer,
	
	update : function(node){
		this.updateMain(node);
		this.updateLabel(node);
		this.updateAnimation(node);
	},
	
	updateMain : function(node){
		if (!node.displayList.main){
			node.displayList.main = this.makeMain(node);
			this.visualizer.addElement(node.displayList.main, node, 'main');
		} 
		if (node.selected){
			this.select(node);
		} else if (node.highlighted){
			this.highlight(node);
		} else {
			this.plain(node);
		}	
		node.displayList.main.position.copy(node.position);
	},
	
	updateLabel : function(node){
		if (this.visualizer.showLabels == true && node.label){
			if (!node.displayList.label) {
				node.displayList.label = this.makeLabel(node);
				this.visualizer.addElement(node.displayList.label, node, 'label');
			}
			var pos = node.displayList.label.position;
			pos.copy(node.position);
			pos.addSelf(this.visualizer.camera.up.clone().multiplyScalar(20));
			var vectorToCamera = this.visualizer.camera.position.clone().subSelf( pos );
			pos.addSelf(vectorToCamera.normalize().multiplyScalar(20));
			node.displayList.label.visible = true;
		}
	},
	
	updateAnimation : function(node){
		if (node.animated){
			this.animate(node);
		} else {
			this.stopAnimation(node);
		}
	},
	
	makeMain : function(node){
		var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
		return this.visualizer.makeMesh(node.position, this.visualizer.resources[this.plainMaterialName], geometry, 10);
	},
	
	makeLabel : function(node){
 		 return this.visualizer.makeTextSprite(node.label, 36, "white");
	},
	
	highlight : function(node){
		node.displayList.main.material = this.visualizer.resources[this.highlightMaterialName];
	},
	
	select : function(node){
		node.displayList.main.material = this.visualizer.resources[this.selectMaterialName];
	},
	
	plain : function(node){
		node.displayList.main.material = this.visualizer.resources[this.plainMaterialName];
	},
	
	animate : function(node){
		
	},
	
	stopAnimation : function(node){
		
	}
	
};

//--------------------------------------
//
// Basic WebGL Sprite Node Displayer
//
//--------------------------------------

TRIPTYCH.SpriteNodeDisplayer = function(){
	this.plainMapName = "defaultSpriteMap";
	this.selectMapName = "defaultSpriteMap";
	this.highlightMapName = "defaultSpriteMap";
};

TRIPTYCH.SpriteNodeDisplayer.prototype = new TRIPTYCH.WebGLNodeDisplayer();

TRIPTYCH.SpriteNodeDisplayer.prototype.constructor = TRIPTYCH.SpriteNodeDisplayer;

TRIPTYCH.SpriteNodeDisplayer.prototype.updateMain = function(node){
		if (!node.displayList.main){
			node.displayList.main = this.makeMain(node);
			this.visualizer.addElement(node.displayList.main, node, 'main');
			
			// 
			// The "main" is required for intercepting mouse events
			// but it is not visible
			//
			node.displayList.main.visible = false;
		} 
		if (!node.displayList.sprite){
			node.displayList.sprite = this.makeSprite(node);
			this.visualizer.addElement(node.displayList.sprite, node, 'sprite');
		}
		if (node.selected){
			this.select(node);
		} else if (node.highlighted){
			this.highlight(node);
		} else {
			this.plain(node);
		}
				
		node.displayList.main.position.copy(node.position);
		node.displayList.sprite.position.copy(node.position);
};


TRIPTYCH.SpriteNodeDisplayer.prototype.makeSprite = function(node){
	var map = this.visualizer.resources[this.plainMapName];
	var sprite = new THREE.Sprite( { map: map, useScreenCoordinates: false, color: 0xffffff} );
	sprite.scale.x = sprite.scale.y = 0.1;
	return sprite;
};

TRIPTYCH.SpriteNodeDisplayer.prototype.highlight = function(node){
		node.displayList.sprite.map = this.visualizer.resources[this.highlightMapName];
};
	
TRIPTYCH.SpriteNodeDisplayer.prototype.select = function(node){
		node.displayList.sprite.map = this.visualizer.resources[this.selectMapName];
};

TRIPTYCH.SpriteNodeDisplayer.prototype.plain = function(node){
		node.displayList.sprite.map = this.visualizer.resources[this.plainMapName];
};



//--------------------------------------
//
// EdgeDisplayers
//
//--------------------------------------

TRIPTYCH.WebGLEdgeDisplayer = function(){
	this.plainMaterialName = "defaultLineMaterial";
	this.selectMaterialName = "defaultLineSelectedMaterial";
	this.highlightMaterialName = "defaultLineHighlightedMaterial";
};

TRIPTYCH.WebGLEdgeDisplayer.prototype = new TRIPTYCH.EdgeDisplayer();

TRIPTYCH.WebGLEdgeDisplayer.prototype = {

	constructor : TRIPTYCH.WebGLEdgeDisplayer,

	update : function(edge){
		this.updateMain(edge);
		this.updateLabel(edge);
		this.updateAnimation(edge);
	},
	
	updateMain : function(edge){
		if (!edge.displayList.main){
			edge.displayList.main = this.makeMain(edge);
			this.visualizer.addElement(edge.displayList.main, edge, 'main');
		} 
		if (edge.to.selected || edge.from.selected){
			this.select(edge);
		} else if (edge.to.highlighted || edge.from.highlighted){
			this.highlight(edge);
		} else {
			this.plain(edge);
		}
		this.positionMain(edge);
		
	},
	
	positionMain : function(edge){
		var geometry = edge.displayList.main.geometry;
		var fromV3 = geometry.vertices[0];
		var toV3 = geometry.vertices[1];
		fromV3.copy(edge.from.position);
		toV3.copy(edge.to.position);
		geometry.verticesNeedUpdate = true;
	},
	
	updateLabel : function(edge){
		if (this.visualizer.showEdgeLabels == true){
			if (!edge.displayList.label) {
				edge.displayList.label = this.makeLabel(edge);
				this.visualizer.addElement(edge.displayList.label, edge, 'label');
			}
			var v = edge.getVector();
			edge.displayList.label.position = edge.from.position.clone().addSelf(v.multiplyScalar(0.5));
			edge.displayList.label.matrix.lookAt( this.visualizer.camera.position, edge.displayList.label.position, this.visualizer.camera.up );
		}
	},
	
	updateAnimation : function(edge){
		if (edge.animated){
			this.animate(edge);
		} else {
			this.stopAnimation(edge);
		}
	},

	makeMain : function(edge){
		return this.visualizer.makeLine( edge.from.position, edge.to.position, this.visualizer.resources[this.plainMaterialName] );
	},
	
	makeLabel : function(edge){
		return this.visualizer.makeTextSprite(edge.relationship.type, 28, "yellow", null);
	},
	
	highlight : function(edge){
		edge.displayList.main.material = this.visualizer.resources[this.highlightMaterialName];
	},
	
	select : function(edge){
		edge.displayList.main.material = this.visualizer.resources[this.selectMaterialName];
	},
	
	plain : function(edge){
		edge.displayList.main.material = this.visualizer.resources[this.plainMaterialName];
	},
		
	animate : function(edge){
		
	},
	
	stopAnimation : function(edge){
		
	}

};

//--------------------------------------
//
// Object Intersection
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.findIntersectedObjects = function(mouse){
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	this.projector.unprojectVector( vector, this.camera );

	var ray = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );

	this.intersectedObjects = ray.intersectObjects( this.scene.children );
};

TRIPTYCH.WebGLVisualizer.prototype.findClosestIntersectedElement = function(mouse){
	this.findIntersectedObjects(mouse);
	for (var i = 0; i < this.intersectedObjects.length; i++){
		var intersected = this.intersectedObjects[i];
		var elementAndRole = this.getElementAndRoleByDisplayObject(intersected.object);
		if ( elementAndRole ){
			var element = elementAndRole[0];
			var role = elementAndRole[1];
			if (TRIPTYCH.Node == element.constructor) {
				this.lastIntersectedElement = this.intersectedElement;
				this.lastIntersectionRole = this.intersectionRole;
				this.intersectedElement = element;
				this.intersectionRole = role;
				return;
			}
		}
	}
	this.lastIntersectedElement = this.intersectedElement;
	this.lastIntersectionRole = this.intersectionRole;
	this.intersectedElement = null;
	this.intersectionRole = null;
};


//--------------------------------------
//
// Init method (required for all visualizers)
//
//--------------------------------------


TRIPTYCH.WebGLVisualizer.prototype.init = function(width, height, camera){
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setSize( width, height);
	this.projector = new THREE.Projector();
	
	this.camera = camera;	
	this.scene.add(this.camera);
	
	this.initDefaultDisplayers();
	this.initDisplayers();
	
	this.initDefaultResources();
	this.initResources();
	
	this.initTimeLoops();

	this.initLights();
	
	// What does this do?
	this.renderer.autoClear = false;
	this.scene.matrixAutoUpdate = false;

};

TRIPTYCH.WebGLVisualizer.prototype.initDefaultDisplayers = function(){
	this.defaultNodeDisplayer = new TRIPTYCH.WebGLNodeDisplayer();
	this.defaultNodeDisplayer.visualizer = this;
	this.defaultEdgeDisplayer = new TRIPTYCH.WebGLEdgeDisplayer();
	this.defaultEdgeDisplayer.visualizer = this;
	
};

TRIPTYCH.WebGLVisualizer.prototype.initDisplayers = function(){
	
};

//--------------------------------------
//
// TimeLoops
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.initTimeLoops = function(){
	this.timeLoop.start = Date.now();
	this.timeLoop.stepFraction = 0;
	this.timeLoop.cycleFraction = 0;
	this.timeLoop.stepTime = 1000;  // milliseconds
	this.timeLoop.numberOfSteps = 1;
	this.timeLoop.step = 0;
	
};

// (required for all visualizers)
TRIPTYCH.WebGLVisualizer.prototype.updateTimeLoops = function(){

	var elapsedTime = Date.now() - this.timeLoop.start;
	var cycle = this.timeLoop.stepTime * this.timeLoop.numberOfSteps;
	this.timeLoop.stepFraction = (elapsedTime%this.timeLoop.stepTime)/this.timeLoop.stepTime;
	this.timeLoop.cycleFraction = (elapsedTime%cycle)/cycle;
	this.timeLoop.step = Math.floor(this.timeLoop.cycleFraction * this.timeLoop.numberOfSteps);
	//console.log("step " + this.timeLoop.step + " " + this.timeLoop.stepFraction);
	
};

//--------------------------------------
//
// Lighting
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.initLights = function(){
	var pointLight = new THREE.PointLight( 0xFFFFFF );
	pointLight.position.set(10, 50, 500);
	this.scene.add(pointLight);
	
	this.cameraLight = new THREE.PointLight( 0xFFFFFF );
	this.cameraLight.position.copy(this.camera.position); 
	this.scene.add(this.cameraLight);
};

// (required for all visualizers)
TRIPTYCH.WebGLVisualizer.prototype.updateLights = function(graph){

	if (this.cameraLight) this.cameraLight.position.copy(this.camera.position);
	
};

//--------------------------------------
//
// Node Updating - (required for all visualizers)
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.updateNode = function(node){
	if (!node.displayer){
		node.displayer = this.getNodeDisplayer(node);
	}
	node.displayer.update(node);
};

//--------------------------------------
//
// Edge Updating - (required for all visualizers)
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.updateEdge = function(edge){
	if (!edge.displayer){
		edge.displayer = this.getEdgeDisplayer(edge);
	}
	edge.displayer.update(edge);
};

//--------------------------------------
//
// Resources
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.initDefaultResources = function(node){
	this.resources.defaultLineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 1.0 } );
	this.resources.defaultLineSelectedMaterial = new THREE.LineBasicMaterial( { color: 0xffff00, opacity: 1.0 } );
	this.resources.defaultLineHighlightedMaterial = new THREE.LineBasicMaterial( { color: 0x00ffff, opacity: 1.0 } );
	this.resources.defaultSurfaceMaterial = new THREE.MeshPhongMaterial( { color: 0xff3333,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.defaultSurfaceSelectedMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading  } );
	this.resources.defaultSurfaceHighlightedMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );

};

TRIPTYCH.WebGLVisualizer.prototype.initResources = function(){
};


//--------------------------------------
//
// Graphics Utilities
//
//--------------------------------------

TRIPTYCH.WebGLVisualizer.prototype.makeLine = function (v1, v2, lineMaterial){

	var lineGeometry = new THREE.Geometry();
	lineGeometry.dynamic = true;
	lineGeometry.vertices.push( v1.clone()  );
	lineGeometry.vertices.push( v2.clone()  );
	return new THREE.Line( lineGeometry, lineMaterial );
	
};

TRIPTYCH.WebGLVisualizer.prototype.makeMesh = function (position, material, geometry, scale){

	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.copy(position);
	mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
	return mesh;
	
};

TRIPTYCH.WebGLVisualizer.prototype.getPowerOfTwo = function (value, pow) {
	var pow = pow || 1;
	while(pow<value) {
		pow *= 2;
	}
	return pow;
};


TRIPTYCH.WebGLVisualizer.prototype.makeTextSprite = function (text, size, color, backGroundColor, backgroundMargin) {
	if(!backgroundMargin) backgroundMargin = 50;

	var canvas = document.createElement("canvas");

	var context = canvas.getContext("2d");
	context.font = size + "pt Arial";

	var textWidth = context.measureText(text).width;
	
	var dimension = Math.max(textWidth + backgroundMargin, size + backgroundMargin);

	canvas.width = dimension;
	canvas.height = dimension;
	context = canvas.getContext("2d");
	context.font = size + "pt Arial";
/*
	if(backGroundColor) {
		context.fillStyle = backGroundColor;
		context.fillRect(
						canvas.width / 2 - textWidth / 2 - backgroundMargin / 2, 
						canvas.height / 2 - size / 2 - +backgroundMargin / 2, 
						textWidth + backgroundMargin, 
						size + backgroundMargin);
	}
*/
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = color;
	context.fillText(text, canvas.width / 2, canvas.height / 2);


	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var sprite = new THREE.Sprite( { map: texture, useScreenCoordinates: false, color: 0xffffff} );
	sprite.scale.set(0.15, 0.15);

	return sprite;
};

TRIPTYCH.WebGLVisualizer.prototype.scaleAndRotateEdge = function(edge, object, useMidpoint){
	// the object is always built to be scaled in Z and rotated align with the vertices
	
	// scale object in Z
	var v = edge.getVector();
	var len = v.length();
	var scale = len / this.edgeReferenceLength;
	object.scale.z = scale;
	
	if (useMidpoint){
		object.position = edge.from.position.clone().addSelf(v.multiplyScalar(0.5));
	} else {
		// place it at the edge "from" position
		object.position.copy(edge.from.position);
	}
	// make it look at the edge "to" position
	object.lookAt(edge.to.position);

};




