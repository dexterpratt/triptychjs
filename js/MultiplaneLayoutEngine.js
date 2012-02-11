TRIPTYCH.MultiplaneLayoutEngine = function(graph){
	this.averageForceUpdateThreshold = 0.001;
	this.repulsion = 1;
	//this.repulsionLimit = 500;
	this.springConstant = 0.02;
	this.maxForce = 10.0;
	this.edgeLength = 50;
	this.damping = 0.01;
	this.updateCount = 0;
	this.linkageFactor = 0.1
};

TRIPTYCH.MultiplaneLayoutEngine.prototype = new TRIPTYCH.DynamicLayoutEngine();

TRIPTYCH.MultiplaneLayoutEngine.prototype.constructor = TRIPTYCH.MultiplaneLayoutEngine;

TRIPTYCH.MultiplaneLayoutEngine.prototype.clearForces = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.force.set(0,0,0);
	}
};

// keeps all nodes in their original plane
TRIPTYCH.MultiplaneLayoutEngine.prototype.randomNodePositions = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, node.position.z);
		node.position.normalize();
		node.position.multiplyScalar( Math.random() * 10 + 450 );
	}
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.setGraph = function(graph){
	this.graph = graph;
	this.randomNodePositions();
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.getAverageForce = function(){
	var sum = 0;
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		sum += node.force.length();
	}
	return sum / len;
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.layoutStep = function(){
	
	this.clearForces();
	
	var nodes = this.graph.nodes;
	var len = nodes.length;
	
	// Compute sum of repulsive forces on each node due to all other nodes
	// Repulsion is proportional to the square of the distance
	for (var i = 0; i<len; i++){
	
		var node1 = nodes[i];
		
		for (var n = i + 1; n<len; n++){
		
			var node2 = nodes[n];
			this.addRepulsiveForces(node1, node2);
			
		}
	}
	
	// Add net attractive force on each node due to links
	var edges = this.graph.edges;
	for (var i = 0; i<edges.length; i++){
	
		var edge = edges[i];
		this.addEdgeForces(edge.from, edge.to);
		
	}
	
	// Add attraction to the centerpoint to each node
	/*
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		var distanceToCenter = node.position.length();
		this.addForce(node, node.position, -0.0001);
	}
	*/
	
	this.updateNodePositions();
	
	// If the absoluteForceSum is less than the update threshold,
	// then stop updating
	/*	
	var avgForce = this.getAverageForce();
	

	if ( avgForce < this.averageForceUpdateThreshold){
	
		this.needsUpdate = false;
		
	}
	*/
	this.updateCount++;
	if (this.updateCount > 500) {
		this.needsUpdate = false;
	}

};

// in this layout engine, forces can only be applied in the x-y plane
TRIPTYCH.MultiplaneLayoutEngine.prototype.addForce = function(node, vector, scalar){
	node.force.x = node.force.x + vector.x * scalar;
	node.force.y = node.force.y + vector.y * scalar;
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.addRepulsiveForces = function(node1, node2){
	// if d > repulsionLimit then no force is added.  (prevents disjoint graph segments from flying away)
	var v = node1.getVector(node2);
	
	var deltaZ = v.z;
	v.z = 0;
	
	
	// set the z component to zero: we only care about 
	// the 2D separation

	var scaledEdgeLength = v.length() / this.edgeLength;
	
	if (scaledEdgeLength > 0.01){
		var r;
		if (deltaZ > 1){
			r = this.repulsion * this.linkageFactor;
		} else {
			r = this.repulsion;
		}
		var scale = r/(scaledEdgeLength * scaledEdgeLength);
		this.addForce(node1, v, -1 * scale);	
		this.addForce(node2, v, scale);
	}	
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.addEdgeForces = function(fromNode, toNode){
		var v = fromNode.getVector(toNode);
		var deltaZ = v.z;
		v.z = 0;
		var displacement = v.length() - this.edgeLength;
		if (displacement > 0.1){
			var scalar;
			if (deltaZ > 1){
				scalar = this.springConstant * displacement * this.linkageFactor;
			} else {
				scalar = this.springConstant * displacement;
			}
			this.addForce(fromNode, v, scalar);
			this.addForce(toNode, v, -1 * scalar);
		}
};

TRIPTYCH.MultiplaneLayoutEngine.prototype.updateNodePositions = function(){
	for (var i in this.graph.nodes){
		var node = this.graph.nodes[i];
		var net = node.force.length();
		
		if (net > this.maxForce){
			node.force.normalize();
			node.force.multiplyScalar( this.maxForce * 0.5 );
			node.force.z = 0;
			node.position.addSelf(node.force);
		} else if (net > 0.001){
			node.force.multiplyScalar(this.damping);
			node.force.z = 0;
			node.position.addSelf(node.force);
		}
	}	
};

