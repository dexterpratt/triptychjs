TRIPTYCH.BasicVisualizer = function(){

	// label parameters			
	this.showLabels = true;
			
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
	// node parameters
	// this.nodeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF3333 });
	this.nodeMaterial = new THREE.MeshPhongMaterial( { color: 0xff3333, shading: THREE.SmoothShading } );
	this.nodeSelectedMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, shading: THREE.SmoothShading } );
	this.nodeHighlightedMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, shading: THREE.SmoothShading } );

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

TRIPTYCH.BasicVisualizer.prototype.createEdgeParticleGeometry = function(){
	var geometry = new THREE.Geometry();
	var zSpacing = this.edgeParticlesLength / this.edgeParticleCount;
	var particleZ = 0;
	// create a line of particles in the z axis
	for(var p = 0; p < this.edgeParticleCount; p++) {
		
		var pVertex = new THREE.Vertex(
				new THREE.Vector3(0, 0, particleZ)
			);
		
		// add it to the geometry
		geometry.vertices.push(pVertex);
		
		// increment particleZ
		particleZ += zSpacing;
	}
	return geometry;
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
 	
 	var label = this.createSpriteLabel(text, 24, "blue", "white", 20);

	//label.scale.x = label.scale.y = label.scale.z = 0.1;
		
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
	
	//label.lookAt(this.camera.position);
	
	label.matrix.lookAt( this.camera.position, label.position, this.camera.up );
	/*
		if ( label.rotationAutoUpdate ) {

			label.rotation.setRotationFromMatrix( label.matrix );

		}
	*/

};

TRIPTYCH.BasicVisualizer.prototype.createLabel = function (text, size, color, backGroundColor, backgroundMargin) {
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
	
	var material = new THREE.MeshBasicMaterial({
		map : texture
		});
	
	var mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), material);
	// mesh.overdraw = true;
	mesh.doubleSided = true;
	mesh.position.x = x - canvas.width;
	mesh.position.y = y - canvas.height;
	mesh.position.z = z;
	
	return mesh;
};

TRIPTYCH.BasicVisualizer.prototype.createSpriteLabel = function (text, size, color, backGroundColor, backgroundMargin) {
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
	
	// context.strokeRect(0, 0, canvas.width, canvas.height);
	
	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	
	var sprite = new THREE.Sprite( { map: texture, useScreenCoordinates: false, color: 0xffffff} );
	//sprite.scale.x = canvas.width;
	//sprite.scale.y = canvas.height;
	sprite.scale.set(canvas.width / 1000, canvas.height / 1000);
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
	this.lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5 } );
	
	// edge particle variables for animation
	this.edgeParticleCount = 20;
	this.edgeParticlesLength = 1000;

	this.edgeParticleGeometry = this.createEdgeParticleGeometry();
	
	this.edgeParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			size: 4,
			transparent: true
		});
}

TRIPTYCH.BasicVisualizer.prototype.updateEdge = function(edge){

	// if no main in displayList, make the edge
	var line = edge.displayList.main;
	//var particles = edge.displayList.particles;
	if (!line){
		this.makeEdgeLine(edge);
		//this.makeEdgeParticles(edge);
	} else {
		var fromVertex = line.geometry.vertices[0];
		var toVertex = line.geometry.vertices[1];
		fromVertex.position.copy(edge.from.position);
		toVertex.position.copy(edge.to.position);
		line.geometry.__dirtyVertices = true;
		
		//this.setEdgeParticleParameters(edge, particles);
		
	}
	
};

TRIPTYCH.BasicVisualizer.prototype.setEdgeParticleParameters = function(edge, particles){
		// scale particle system in Z
		var v = edge.getVector();
		var len = v.length();
		var scale = len / this.edgeParticlesLength;
		particles.scale.z = scale;
		
		// animation offset. loop every 100 updates - better if it works on timer...
		// determine the offset: 0.1 * (edge length / num particles) *animationCount of that
		var aCount = edge.displayList.animationCount;
		if (aCount == null) aCount = 0;
		var zOffset = 0.1 * (len / this.edgeParticleCount) * aCount;
		aCount++;
		if (aCount > 10) aCount = 0;
		edge.displayList.animationCount = aCount
		
		v = v.setLength(zOffset);
		
		// place it at the edge "from" position plus the animation offset along the vector
		particles.position = v.addSelf(edge.from.position);
		
		// make it look at the edge "to" position
		particles.lookAt(edge.to.position);
		
		// not sure we need to update vertices
};

TRIPTYCH.BasicVisualizer.prototype.makeEdgeLine = function(edge){

	var line = this.makeLine( edge.from.position, edge.to.position, this.lineMaterial );
	this.scene.add( line );
	edge.displayList.main = line;
	
};

TRIPTYCH.BasicVisualizer.prototype.makeEdgeParticles = function(edge){

	var particles = new THREE.ParticleSystem( this.edgeParticleGeometry, this.edgeParticleMaterial);
	this.scene.add( particles );
	edge.displayList.particles = particles;
	this.setEdgeParticleParameters(edge, particles);
	
};

TRIPTYCH.BasicVisualizer.prototype.makeLine = function (v1, v2, lineMaterial){

	var lineGeometry = new THREE.Geometry();
	lineGeometry.dynamic = true;
	lineGeometry.vertices.push( new THREE.Vertex( v1 ) );
	lineGeometry.vertices.push( new THREE.Vertex( v2 ) );
	return new THREE.Line( lineGeometry, lineMaterial );
	
};