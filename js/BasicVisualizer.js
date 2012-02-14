TRIPTYCH.BasicVisualizer = function(){

	// label parameters			
	this.showLabels = true;
	
	this.showEdgeLabels = true;
			
	this.cameraLight = new THREE.PointLight( 0xFFFFFF );

};

TRIPTYCH.BasicVisualizer.prototype = new TRIPTYCH.Visualizer();

TRIPTYCH.BasicVisualizer.prototype.constructor = TRIPTYCH.BasicVisualizer;

TRIPTYCH.BasicVisualizer.prototype.init = function(width, height, camera){
	this.renderer = new THREE.WebGLRenderer( { antialias: false } );
	this.renderer.setSize( width, height);
	this.projector = new THREE.Projector();
	
	this.camera = camera;
	
	this.scene.add(this.camera);
	
	//this.scene.fog = new THREE.FogExp2( 0x3333FF, 0.0025 );
	
	this.initNodeResources();
	this.initEdgeResources();
	// add lights to the scene
	var pointLight = new THREE.PointLight( 0xFFFFFF );

	pointLight.position.set(10, 50, 500);
	this.cameraLight.position.copy(camera.position); 
	
	this.scene.add(pointLight);
	this.scene.add(this.cameraLight);
	
	/*
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	this.scene.add( light );

	light = new THREE.DirectionalLight( 0x002288 );
	light.position.set( -1, -1, -1 );
	this.scene.add( light );

	light = new THREE.AmbientLight( 0x222222 );
	this.scene.add( light );
	*/
	
	// What does this do?
	this.renderer.autoClear = false;
	this.scene.matrixAutoUpdate = false;

};

TRIPTYCH.BasicVisualizer.prototype.updateLights = function(graph){

	if (this.cameraLight) this.cameraLight.position.copy(this.camera.position);
	
};

 
TRIPTYCH.BasicVisualizer.prototype.setNodeTypes = function(graph){


};

TRIPTYCH.BasicVisualizer.prototype.initNodeResources = function(){
	this.nodeMaterial = new THREE.MeshPhongMaterial( { color: 0xff3333,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.nodeSelectedMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.nodeHighlightedMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );

};

TRIPTYCH.BasicVisualizer.prototype.findIntersectedObjects = function(mouse){
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	this.projector.unprojectVector( vector, this.camera );

	var ray = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );

	this.intersectedObjects = ray.intersectScene( this.scene );
};

TRIPTYCH.BasicVisualizer.prototype.findClosestIntersectedElement = function(mouse){
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

TRIPTYCH.BasicVisualizer.prototype.updateNode = function(node){
	var nodeObject = node.displayList.main;
	if (!nodeObject){
		this.makeNodeObject(node);
	} else {
		if (node.needsUpdate){
			if (node.selected){
				nodeObject.material = this.nodeSelectedMaterial;
			} else if (node.highlighted){
				nodeObject.material = this.nodeHighlightedMaterial;
			} else {
				nodeObject.material = this.nodeMaterial;
			}
		}
				
		nodeObject.position.copy(node.position);
		node.needsUpdate = false;
	}
	if (this.showLabels){	
		var label = node.displayList.label;
		if (label == null){
			this.makeNodeLabel(node);
		} else {
			this.setLabelParameters(label, node);
		}
	}
};

TRIPTYCH.BasicVisualizer.prototype.makeNodeObject = function(node){
	var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
	var nodeSphere = this.makeMesh(node.position, this.nodeMaterial, geometry, 10);
	this.scene.add( nodeSphere );
	node.displayList.main = nodeSphere;
	this.mapDisplayObjectToElement( nodeSphere, node, "main");
};

TRIPTYCH.BasicVisualizer.prototype.makeNodeLabel = function (node){
 
 	var text = node.label;
 	
 	var label = this.makeTextSprite(text, 36, "white");
		
	this.setLabelParameters(label, node);
	
	this.scene.add( label );
	node.displayList.label = label;
	this.mapDisplayObjectToElement( label, node, "label");

	return label;

};

TRIPTYCH.BasicVisualizer.prototype.setLabelParameters = function (label, node){

	label.position.x = node.position.x + 20;
	label.position.y = node.position.y + 20;
	label.position.z = node.position.z;
	
	label.matrix.lookAt( this.camera.position, label.position, this.camera.up );

};

TRIPTYCH.BasicVisualizer.prototype.getPowerOfTwo = function (value, pow) {
	var pow = pow || 1;
	while(pow<value) {
		pow *= 2;
	}
	return pow;
}

TRIPTYCH.BasicVisualizer.prototype.expMakeTextSprite = function (text, size, color, backGroundColor, backgroundMargin) {
	
	if(!backgroundMargin) backgroundMargin = size / 10;
	
	var canvas = document.createElement("canvas");
	
	var context = canvas.getContext("2d");
	context.font = size + "pt Arial";
	
	var textWidth = context.measureText(text).width;
	
	var w = (textWidth + backgroundMargin) / 2;
	var h = (size + backgroundMargin) / 2;
	
	canvas.width = this.getPowerOfTwo(w);
	canvas.height = this.getPowerOfTwo(h);
	
	//var centerX = canvas.width / 2;
	//var centerY = canvas.height / 2;
	
	if(backGroundColor) {
		context.fillStyle = backGroundColor;
		//context.fillRect(centerX - (w / 2), centerY - (h /2) , centerX + (w /2), centerY + (h/2));
		context.fillRect(0, 0 , w, h);
		
		//context.strokeStyle = "red";
		//context.strokeRect((w/2) - (textWidth/ 4), (h/2)- (size /4) , (w/2) , (h/2) );

	}
	
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = color;
	context.fillText(text, w/2, h/2);
	
	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	
	var sprite = new THREE.Sprite( { map: texture, useScreenCoordinates: false, color: 0xffffff} );

	//var ratio = canvas.width / canvas.height;
	var scale = 0.1;
	sprite.scale.set((w/h) * scale, scale);

	return sprite;
};

TRIPTYCH.BasicVisualizer.prototype.makeTextSprite = function (text, size, color, backGroundColor, backgroundMargin) {
	if(!backgroundMargin) backgroundMargin = 50;

	var canvas = document.createElement("canvas");

	var context = canvas.getContext("2d");
	context.font = size + "pt Arial";

	var textWidth = context.measureText(text).width;

	canvas.width = textWidth + backgroundMargin;
	canvas.height = size + backgroundMargin;
	context = canvas.getContext("2d");
	context.font = size + "pt Arial";

	if(backGroundColor) {
		context.fillStyle = backGroundColor;
		context.fillRect(canvas.width / 2 - textWidth / 2 - backgroundMargin / 2, canvas.height / 2 - size / 2 - +backgroundMargin / 2, textWidth + backgroundMargin, size + backgroundMargin);
	}

	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = color;
	context.fillText(text, canvas.width / 2, canvas.height / 2);

	// context.strokeStyle = "black";
	// context.strokeRect(0, 0, canvas.width, canvas.height);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var sprite = new THREE.Sprite( { map: texture, useScreenCoordinates: false, color: 0xffffff} );
	//sprite.scale.x = canvas.width;
	//sprite.scale.y = canvas.height;
	sprite.scale.set(canvas.width / 2000, canvas.height / 2000);
	//sprite.uvScale.set( 0.5, 0.5 );
	//sprite.uvOffset.set( 2.0, 10.0 );

	return sprite;
};

TRIPTYCH.BasicVisualizer.prototype.makeMesh = function (position, material, geometry, scale){

	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.copy(position);
	mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
	return mesh;
	
};

TRIPTYCH.BasicVisualizer.prototype.initEdgeResources = function(node){
	// edge parameters
	this.lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 1.0 } );
}

TRIPTYCH.BasicVisualizer.prototype.updateEdge = function(edge){

	// if no main in displayList, make the edge
	var line = edge.displayList.main;

	if (!line){
		this.makeEdgeLine(edge);
		if (this.showEdgeLabels) this.makeEdgeLabel(edge);

	} else {
		var fromVertex = line.geometry.vertices[0];
		var toVertex = line.geometry.vertices[1];
		fromVertex.position.copy(edge.from.position);
		toVertex.position.copy(edge.to.position);
		line.geometry.__dirtyVertices = true;
		if (this.showEdgeLabels) this.updateEdgeLabel(edge);
		
	}
	
};

TRIPTYCH.BasicVisualizer.prototype.updateEdgeLabel = function(edge){
	// if no label in displayList, make the label
	var label = edge.displayList.label;
	if (!label){
		label = this.makeEdgeLabel(edge);
	} 
	this.setEdgeLabelParameters(label, edge);	
	
}

TRIPTYCH.BasicVisualizer.prototype.makeEdgeLabel = function(edge){

	var label = this.makeTextSprite(edge.relationship.type, 28, "yellow", null);
	this.scene.add( label );
	edge.displayList.label = label;
	return label;
	
};

TRIPTYCH.BasicVisualizer.prototype.setEdgeLabelParameters = function(label, edge){

	var v = edge.getVector();

	label.position = edge.from.position.clone().addSelf(v.multiplyScalar(0.5));
	
	label.matrix.lookAt( this.camera.position, label.position, this.camera.up );
	
};

TRIPTYCH.BasicVisualizer.prototype.makeEdgeLine = function(edge){

	var line = this.makeLine( edge.from.position, edge.to.position, this.lineMaterial );
	this.scene.add( line );
	edge.displayList.main = line;
	
};

TRIPTYCH.BasicVisualizer.prototype.makeLine = function (v1, v2, lineMaterial){

	var lineGeometry = new THREE.Geometry();
	lineGeometry.dynamic = true;
	lineGeometry.vertices.push( new THREE.Vertex( v1 ) );
	lineGeometry.vertices.push( new THREE.Vertex( v2 ) );
	return new THREE.Line( lineGeometry, lineMaterial );
	
};