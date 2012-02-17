TRIPTYCH.MultiplaneLayoutEngine = function(graph){

	this.linkageFactor = 0.1
};

TRIPTYCH.MultiplaneLayoutEngine.prototype = new TRIPTYCH.SpringForceLayoutEngine();

TRIPTYCH.MultiplaneLayoutEngine.prototype.constructor = TRIPTYCH.MultiplaneLayoutEngine;


// keeps all nodes in their original plane
TRIPTYCH.MultiplaneLayoutEngine.prototype.randomNodePositions = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, node.position.z);

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

TRIPTYCH.SpringForceLayoutEngine.prototype.updateNodePositions = function(){
	for (var i in this.graph.nodes){
		var node = this.graph.nodes[i];
		var len = node.force.length();
		var f = node.force.clone();
		if (len > this.maxForce) len = this.maxForce;
	
		f.normalize();
		f.multiplyScalar(len * this.damping);
		f.z = 0;
		
		node.position.addSelf(f);
		

	}	
};

