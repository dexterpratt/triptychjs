TRIPTYCH.BELVisualizer = function(){

};

TRIPTYCH.BELVisualizer.prototype = new TRIPTYCH.BasicVisualizer();

TRIPTYCH.BELVisualizer.prototype.constructor = TRIPTYCH.BELVisualizer;

TRIPTYCH.BELVisualizer.prototype.updateNode = function(node){
	var nodeObject = node.displayList.main;
	if (nodeObject == null){
		this.makeNodeObject(node);
	} else {
		if (node.needsUpdate){
			if (node.selected){
				nodeObject.material = this.getNodeSelectedMaterial(node);
			} else if (node.highlighted){
				nodeObject.material = this.getNodeHighlightedMaterial(node);
			} else {
				nodeObject.material = this.getNodeNormalMaterial(node);
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

TRIPTYCH.BELVisualizer.prototype.makeNodeObject = function(node){
	var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
	var nodeSphere = this.makeMesh(node.position, this.getNodeNormalMaterial(node), geometry, 10);
	this.scene.add( nodeSphere );
	node.displayList.main = nodeSphere;
	this.mapDisplayObjectToElement( nodeSphere, node, "main");
};

TRIPTYCH.BELVisualizer.prototype.initNodeResources = function(node){

	this.nodeSelectedMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, shading: THREE.SmoothShading } );
	this.nodeHighlightedMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, shading: THREE.SmoothShading } );

	// activities are bright red
	this.activityMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, shading: THREE.SmoothShading } );

	// reactions are brick red
	this.reactionMaterial = new THREE.MeshPhongMaterial( { color: 0xff3333, shading: THREE.SmoothShading } );

	// molecules are violet
	this.moleculeMaterial = new THREE.MeshPhongMaterial( { color: 0xff00ff, shading: THREE.SmoothShading } );
	
	// RNA are green
	this.rnaMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00, shading: THREE.SmoothShading } );

	// everything else is very light gray
	this.nodeMaterial = new THREE.MeshPhongMaterial( { color: 0xc3c3c3, shading: THREE.SmoothShading } );

};

TRIPTYCH.BELVisualizer.prototype.setNodeTypes = function(graph){
	for (var i = 0; i < graph.nodes.length; i++){
		var node = graph.nodes[i];
		if (node.label.indexOf("exp") >= 0) node.type = "RNA";
		if (node.label.indexOf("kaof") >= 0) node.type = "activity";
		if (node.label.indexOf("paof") >= 0) node.type = "activity";
		if (node.label.indexOf("sec") >= 0) node.type = "activity";
		if (node.label.indexOf("taof") >= 0) node.type = "activity";
	}
};

TRIPTYCH.BELVisualizer.prototype.getNodeNormalMaterial = function(node){
	switch(node.type)
		{
		case "activity":
		  return this.activityMaterial;
		case "reaction":
		  return this.reactionMaterial;
		case "molecule":
		  return this.reactionMaterial;
		case "RNA":
			return this.rnaMaterial;
		default:
		  return this.nodeMaterial;
		}
};

TRIPTYCH.BELVisualizer.prototype.getNodeHighlightedMaterial = function(node){
	return this.nodeHighlightedMaterial;
};

TRIPTYCH.BELVisualizer.prototype.getNodeSelectedMaterial = function(node){
	return this.nodeSelectedMaterial;
};


TRIPTYCH.BELVisualizer.prototype.initEdgeResources = function(node){

	this.yellowMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, shading: THREE.SmoothShading } );
	this.cyanMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, shading: THREE.SmoothShading } );
	this.redMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, shading: THREE.SmoothShading } );
	this.blueMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff, shading: THREE.SmoothShading } );
	this.violetMaterial = new THREE.MeshPhongMaterial( { color: 0xff00ff, shading: THREE.SmoothShading } );
	this.greenMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00, shading: THREE.SmoothShading } );
	this.grayMaterial = new THREE.MeshPhongMaterial( { color: 0x333333, shading: THREE.SmoothShading } );
	this.edgeReferenceLength = 100;
	this.barGeometry = new THREE.CubeGeometry( 2, 2, this.edgeReferenceLength );
	this.dottedGeometry = this.createDottedGeometry(15);
	var increaseMap = THREE.ImageUtils.loadTexture("../../../textures/increaseDot.png");
	var decreaseMap = THREE.ImageUtils.loadTexture("../../../textures/decreaseDot.png");
	this.increaseParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: increaseMap,
			size: 4,
			transparent: true
		});
	this.decreaseParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: decreaseMap,
			size: 4,
			transparent: true
		});
		
	var sparkMap = THREE.ImageUtils.loadTexture("../../../textures/sprite1.png");
	this.sparkParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: sparkMap,
			size: 4,
			transparent: true
		});
		
	this.edgeParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFF00FF,
			size: 4,
			transparent: true
		});
	this.lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5 } );
};

TRIPTYCH.BELVisualizer.prototype.createDottedGeometry = function(numberOfDots){
	var geometry = new THREE.Geometry();
	var zSpacing = this.edgeReferenceLength / numberOfDots;
	var particleZ = 0;
	// create a line of particles in the z axis
	for(var p = 0; p < numberOfDots; p++) {
		
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

TRIPTYCH.BELVisualizer.prototype.updateEdge = function(edge){

	// if no main in displayList, make the edge
	var object = edge.displayList.main;

	if (object == null){
		object = this.makeEdgeObject(edge);
	}
	switch(edge.relationship.type)
		{
		case "increases":
			this.scaleAndRotateEdge(edge, object);
			break;
		case "decreases":
			this.scaleAndRotateEdge(edge, object);
			break;
		case "directlyIncreases":
			this.scaleAndRotateEdge(edge, object, true);
			break;
		case "directlyDecreases":
			this.scaleAndRotateEdge(edge, object, true);
			break;
		case "complexComponent":
			this.scaleAndRotateEdge(edge, object, true);
			break;

		default:
			var fromVertex = object.geometry.vertices[0];
			var toVertex = object.geometry.vertices[1];
			fromVertex.position.copy(edge.from.position);
			toVertex.position.copy(edge.to.position);
			object.geometry.__dirtyVertices = true;
		}
		
};

TRIPTYCH.BELVisualizer.prototype.makeEdgeObject = function(edge){
	var line;
	switch(edge.relationship.type)
		{
		case "increases":
			line = this.makeDotted(this.increaseParticleMaterial);
			break;
		case "decreases":
			line = this.makeDotted(this.decreaseParticleMaterial);
			break;
		case "directlyIncreases":
			line = this.makeDoubleBar(this.yellowMaterial);
			break;
		case "directlyDecreases":
			line = this.makeDoubleBar(this.blueMaterial);
			break;
		case "complexComponent":
			line = this.makeBar(this.greenMaterial);
			break;

		default:
			line = this.makeLine( edge.from.position, edge.to.position, this.lineMaterial );
		}

	this.scene.add( line );
	edge.displayList.main = line;
	return line;
};

TRIPTYCH.BELVisualizer.prototype.makeBar = function(material){
	var mesh = new THREE.Mesh( this.barGeometry, material );
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
	return mesh;
};

TRIPTYCH.BELVisualizer.prototype.makeDoubleBar = function(material){
	var mesh = new THREE.Mesh( this.barGeometry, material );
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
	return mesh;
};

TRIPTYCH.BELVisualizer.prototype.scaleAndRotateEdge = function(edge, object, useMidpoint){
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

TRIPTYCH.BELVisualizer.prototype.makeDotted = function(material){
	var particles = new THREE.ParticleSystem( this.dottedGeometry, material);
	particles.scale.x = particles.scale.y = particles.scale.z = 1;
	return particles;
};