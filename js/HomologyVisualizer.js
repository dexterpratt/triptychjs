TRIPTYCH.HomologyVisualizer = function(){

};

TRIPTYCH.HomologyVisualizer.prototype = new TRIPTYCH.BasicVisualizer();

TRIPTYCH.HomologyVisualizer.prototype.constructor = TRIPTYCH.HomologyVisualizer;

TRIPTYCH.HomologyVisualizer.prototype.updateNode = function(node){
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

TRIPTYCH.HomologyVisualizer.prototype.makeNodeObject = function(node){
	var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
	var nodeSphere = this.makeMesh(node.position, this.getNodeNormalMaterial(node), geometry, 10);
	this.scene.add( nodeSphere );
	node.displayList.main = nodeSphere;
	this.mapDisplayObjectToElement( nodeSphere, node, "main");
};

TRIPTYCH.HomologyVisualizer.prototype.initNodeResources = function(node){

	this.nodeSelectedMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, shading: THREE.SmoothShading } );
	this.nodeHighlightedMaterial = new THREE.MeshPhongMaterial( { color: 0x00ffff, shading: THREE.SmoothShading } );

	// human nodes are bright red
	this.redMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	
	// mouse nodes are green
	this.greenMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00, specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );

	// everything else is very light gray
	this.nodeMaterial = new THREE.MeshPhongMaterial( { color: 0xc3c3c3, shading: THREE.SmoothShading } );

};

TRIPTYCH.HomologyVisualizer.prototype.getNodeNormalMaterial = function(node){
	switch(node.type)
		{
		case "HUGO":
		  return this.redMaterial;
		case "MGI":
		  return this.greenMaterial;
		default:
		  return this.nodeMaterial;
		}
};

TRIPTYCH.HomologyVisualizer.prototype.getNodeHighlightedMaterial = function(node){
	return this.nodeHighlightedMaterial;
};

TRIPTYCH.HomologyVisualizer.prototype.getNodeSelectedMaterial = function(node){
	return this.nodeSelectedMaterial;
};


TRIPTYCH.HomologyVisualizer.prototype.initEdgeResources = function(node){

	this.edgeReferenceLength = 100;
	//this.barGeometry = new THREE.CubeGeometry( 2, 2, this.edgeReferenceLength );
	this.dottedGeometry = this.createDottedGeometry(30);
	var homologyMap = THREE.ImageUtils.loadTexture("../../../textures/increaseDot.png");

	this.homologyParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: homologyMap,
			size: 4,
			transparent: true
		});
		
	this.selectedParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: homologyMap,
			size: 8,
			transparent: true
		});

	this.lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1 } );
	
	this.redLineMaterial = new THREE.LineBasicMaterial( { color: 0xff2222, opacity: 1 } );
	
	this.greenLineMaterial = new THREE.LineBasicMaterial( { color: 0x22ff22, opacity: 1 } );
	
	this.thickRedLineMaterial = new THREE.LineBasicMaterial( { color: 0xffff00, opacity: 1 , linewidth: 2} );
	
	this.thickGreenLineMaterial = new THREE.LineBasicMaterial( { color: 0x00ffff, opacity: 1, linewidth: 2 } );
};

TRIPTYCH.BasicVisualizer.prototype.createDottedGeometry = function(numberOfDots){
	var geometry = new THREE.Geometry();
	var zSpacing = this.edgeReferenceLength / numberOfDots;
	var particleZ = 0;
	// create a line of particles in the z axis
	for(var p = 0; p < numberOfDots; p++) {
		
		var pVertex = new THREE.Vertex(new THREE.Vector3(0, 0, particleZ));
		
		// add it to the geometry
		geometry.vertices.push(pVertex);
		
		// increment particleZ
		particleZ += zSpacing;
	}
	return geometry;
};

TRIPTYCH.BasicVisualizer.prototype.updateEdge = function(edge){

	// if no main in displayList, make the edge
	var object = edge.displayList.main;

	if (object == null){
		object = this.makeEdgeObject(edge);
	}
	switch(edge.relationship.type)
		{
		case "homology":
			this.scaleAndRotateEdge(edge, object);
			if (edge.from.selected || edge.to.selected){
				object.material = this.selectedParticleMaterial;
			} else {
				object.material = this.homologyParticleMaterial;
			}
			break;

		default:
			var fromVertex = object.geometry.vertices[0];
			var toVertex = object.geometry.vertices[1];
			fromVertex.position.copy(edge.from.position);
			toVertex.position.copy(edge.to.position);
			if (edge.from.selected || edge.to.selected){
				if (edge.from.type == "HUGO"){
					object.material = this.thickRedLineMaterial;
				} else {
					object.material = this.thickGreenLineMaterial;
				}
			} else {
				if (edge.from.type == "HUGO"){
					object.material = this.redLineMaterial;
				} else {
					object.material = this.greenLineMaterial;
				}
			}
			object.geometry.__dirtyVertices = true;
		}
		
};

TRIPTYCH.HomologyVisualizer.prototype.makeEdgeObject = function(edge){
	var line;
	switch(edge.relationship.type)
		{
		
		case "homology":
			line = this.makeDotted(this.homologyParticleMaterial);
			break;
			
		case "interacts":
			if (edge.from.type == "HUGO"){
				line = this.makeLine( edge.from.position, edge.to.position, this.redLineMaterial );
			
			} else {
				line = this.makeLine( edge.from.position, edge.to.position, this.greenLineMaterial );
			}
			break;

		default:
			line = this.makeLine( edge.from.position, edge.to.position, this.lineMaterial );
		}

	this.scene.add( line );
	edge.displayList.main = line;
	return line;
};

TRIPTYCH.HomologyVisualizer.prototype.makeBar = function(material){
	var mesh = new THREE.Mesh( this.barGeometry, material );
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
	return mesh;
};

TRIPTYCH.HomologyVisualizer.prototype.scaleAndRotateEdge = function(edge, object, useMidpoint){
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

TRIPTYCH.HomologyVisualizer.prototype.makeDotted = function(material){
	var particles = new THREE.ParticleSystem( this.dottedGeometry, material);
	particles.scale.x = particles.scale.y = particles.scale.z = 1;
	return particles;
};