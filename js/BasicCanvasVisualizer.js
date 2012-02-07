TRIPTYCH.BasicCanvasVisualizer = function(){
	this.PI2 = Math.PI * 2;
	this.particleMaterial = new THREE.ParticleCanvasMaterial( {

			color: 0x33ffff,
			program: function ( context ) {
	
				context.beginPath();
				context.arc( 0, 0, 1, 0, this.PI2, true );
				context.closePath();
				context.fill();
	
			}
		} 
	);
	this.lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5 } );

};

TRIPTYCH.BasicCanvasVisualizer.prototype = new TRIPTYCH.GraphStyle();

TRIPTYCH.BasicCanvasVisualizer.prototype.constructor = TRIPTYCH.BasicCanvasVisualizer;

TRIPTYCH.BasicCanvasVisualizer.prototype.init = function(width, height){
	this.renderer = new THREE.CanvasRenderer();
	this.renderer.setSize( width, height); 
	var vert1 = new THREE.Vector3(300, 0, 0);
	var origin = new THREE.Vector3(0, 0, 0);
	var lineRedMaterial = new THREE.LineBasicMaterial( { color: 0xff3333, opacity: 0.5 } );
	this.scene.add(this.makeLine(origin, vert1, lineRedMaterial));
	
	var PI2 = Math.PI * 2;
	var nodeBlueMaterial = new THREE.ParticleCanvasMaterial( {

					color: 0x3333ff,
					program: function ( context ) {

						context.beginPath();
						context.arc( 0, 0, 1, 0, PI2, true );
						context.closePath();
						context.fill();

					}

				} );
	var particle = this.makeParticle(origin, nodeBlueMaterial);
	this.scene.add( particle );
};

TRIPTYCH.BasicCanvasVisualizer.prototype.updateNode = function(node, camera){
	var particle = node.displayList.main;
	if (particle == null){
		this.makeNodeObject(node);
	} else {
		particle.position.copy(node.position);
	}
};

TRIPTYCH.BasicCanvasVisualizer.prototype.makeNodeObject = function(node){
	var PI2 = Math.PI * 2;
	var nodeBlueMaterial = new THREE.ParticleCanvasMaterial( {

				color: 0x3333ff,
				program: function ( context ) {

					context.beginPath();
					context.arc( 0, 0, 1, 0, PI2, true );
					context.closePath();
					context.fill();

				}

			} );
	var particle = this.makeParticle(node.position, nodeBlueMaterial);
	this.scene.add( particle );
	node.displayList.main = particle;
};

TRIPTYCH.BasicCanvasVisualizer.prototype.makeParticle = function (position, particleMaterial){
	var particle = new THREE.Particle( particleMaterial );
	particle.position.copy(position);
	particle.scale.x = particle.scale.y = 5;
	return particle;
};

TRIPTYCH.BasicCanvasVisualizer.prototype.updateEdge = function(edge, camera){
	// if no main in displayList, make the edge
	var line = edge.displayList.main;
	if (line == null){
		this.makeEdgeObject(edge);
	} else {
		var fromVertex = line.geometry.vertices[0];
		var toVertex = line.geometry.vertices[1];
		fromVertex.position.copy(edge.from.position);
		toVertex.position.copy(edge.to.position);
		line.geometry._dirtyVertices = true;
	}
};

TRIPTYCH.BasicCanvasVisualizer.prototype.makeEdgeObject = function(edge){
	var line = this.makeLine( edge.from.position, edge.to.position, this.lineMaterial );
	this.scene.add( line );
	edge.displayList.main = line;
};

TRIPTYCH.BasicCanvasVisualizer.prototype.makeLine = function (v1, v2, lineMaterial){
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push( new THREE.Vertex( v1 ) );
	lineGeometry.vertices.push( new THREE.Vertex( v2 ) );
	return new THREE.Line( lineGeometry, lineMaterial);
};