TRIPTYCH.SpringForceLayoutEngine = function(graph){
	this.averageForceUpdateThreshold = 0.001;
	this.repulsion = 10;
	this.repulsionLimit = 500;
	this.attraction = 0.01;
	this.maxForce = 500.0;
};

TRIPTYCH.SpringForceLayoutEngine.prototype = new TRIPTYCH.DynamicLayoutEngine();

TRIPTYCH.SpringForceLayoutEngine.prototype.constructor = TRIPTYCH.SpringForceLayoutEngine;

TRIPTYCH.SpringForceLayoutEngine.prototype.clearForces = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.force.set(0,0,0);
	}
};

TRIPTYCH.SpringForceLayoutEngine.prototype.randomNodePositions = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
		node.position.normalize();
		node.position.multiplyScalar( Math.random() * 10 + 450 );
	}
};

TRIPTYCH.SpringForceLayoutEngine.prototype.setGraph = function(graph){
	this.graph = graph;
	this.randomNodePositions();
};

TRIPTYCH.SpringForceLayoutEngine.prototype.getAverageForce = function(){
	var sum = 0;
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		sum += node.force.length();
	}
	return sum / len;
};

TRIPTYCH.SpringForceLayoutEngine.prototype.layoutStep = function(){
	
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
		this.addForce(node, node.position, -0.01);
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

};

TRIPTYCH.SpringForceLayoutEngine.prototype.addForce = function(node, vector, scalar){
	node.force.x = node.force.x + vector.x * scalar;
	node.force.y = node.force.y + vector.y * scalar;
	node.force.z = node.force.z + vector.z * scalar;
};

TRIPTYCH.SpringForceLayoutEngine.prototype.addRepulsiveForces = function(node1, node2){
	// if d > repulsionLimit then no force is added.  (prevents disjoint graph segments from flying away)
	var v = node1.getVector(node2);

	var d = v.length();
	
	if (d == 0){
		// nodes are on top of each other, so the vector is (0,0,0)
		node1.force.x = node1.force.x + 1;
		node2.force.x = node2.force.x -1;
		node1.force.y = node1.force.y + 1;
		node2.force.y = node2.force.y -1;
		node1.force.z = node1.force.z + 1;
		node2.force.z = node2.force.z -1;
		
	} else {
		if (d < 1) d = 1;
		var scale = Math.min(1000, this.repulsion/(d * d));
		this.addForce(node1, v, -1 * scale);	
		this.addForce(node2, v, scale);
	}	
};

TRIPTYCH.SpringForceLayoutEngine.prototype.addEdgeForces = function(fromNode, toNode){
		var v = fromNode.getVector(toNode);
		var len = Math.max(0, v.length() - 300);
		if (len != 0){
			var scalar = this.attraction * len;
			this.addForce(fromNode, v, scalar);
			this.addForce(toNode, v, -1 * scalar);
		}
};

TRIPTYCH.SpringForceLayoutEngine.prototype.updateNodePositions = function(){
	for (var i in this.graph.nodes){
		var node = this.graph.nodes[i];
		var netForce = node.force.length();
		var scale = Math.min(0.1 , (10 / netForce));
		//var scale = 0.1;
		node.position.addSelf(node.force.multiplyScalar(scale));
	}	
};

