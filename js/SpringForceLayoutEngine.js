TRIPTYCH.SpringForceLayoutEngine = function(graph){
	this.averageForceUpdateThreshold = 0.001;
	this.repulsion = 1;
	this.springConstant = 0.4;
	this.maxForce = 40.0;
	this.edgeLength = 100;
	this.damping = 0.1;
	
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
		node.position.multiplyScalar( Math.random() * 10 + 200 );
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
		this.addForce(node, node.position, -0.0001);
	}
	*/
	
	this.updateNodePositions();


};

TRIPTYCH.SpringForceLayoutEngine.prototype.addForce = function(node, vector, scalar){
	node.force.x = node.force.x + vector.x * scalar;
	node.force.y = node.force.y + vector.y * scalar;
	node.force.z = node.force.z + vector.z * scalar;
};

TRIPTYCH.SpringForceLayoutEngine.prototype.addRepulsiveForces = function(node1, node2){
	var v = node1.getVector(node2);

	var scaledEdgeLength = v.length() / this.edgeLength;
	
	if (scaledEdgeLength < 0.1) scaledEdgeLength = 0.1

	var scale = this.repulsion/(scaledEdgeLength * scaledEdgeLength);
	this.addForce(node1, v, -1 * scale);	
	this.addForce(node2, v, scale);
	
};

TRIPTYCH.SpringForceLayoutEngine.prototype.addEdgeForces = function(fromNode, toNode){
		var v = fromNode.getVector(toNode);
		var displacement = v.length() - this.edgeLength;
		if (displacement > 0.1){
			var scalar = this.springConstant * displacement;
			this.addForce(fromNode, v, scalar);
			this.addForce(toNode, v, -1 * scalar);
		}
};

TRIPTYCH.SpringForceLayoutEngine.prototype.updateNodePositions = function(){
	for (var i in this.graph.nodes){
		var node = this.graph.nodes[i];
		var len = node.force.length();
		var f = node.force.clone();
		if (len > this.maxForce) len = this.maxForce;
	
		f.normalize();
		f.multiplyScalar(len * this.damping);
		
		node.position.addSelf(f);
		

	}	
};

