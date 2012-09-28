/*
	
	Copyright 2012 Dexter Pratt
	
	This file is proprietary to Dexter Pratt and is not covered under any public license

*/

// each edge is assigned to one or more planes
// each node is assigned to all of the planes in which it has an edge
// all nodes have a z coordinate of 0.  The visualizer is responsible 
// for rendering nodes and edges in multiple planes

TRIPTYCH.MP2LayoutEngine = function(graph){

};

TRIPTYCH.MP2LayoutEngine.prototype = new TRIPTYCH.ForceDirectedLayoutEngine();

TRIPTYCH.MP2LayoutEngine.prototype.constructor = TRIPTYCH.MP2LayoutEngine;

// random 2d positions in the z=0 plane
TRIPTYCH.MP2LayoutEngine.prototype.randomNodePositions = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
		node.position.normalize();
		node.position.multiplyScalar( Math.random() * 10 + 200 );
	}
};


// in this layout engine, forces can only be applied in the x-y plane
TRIPTYCH.MP2LayoutEngine.prototype.addForce = function(node, vector, scalar){
	if (node.force && vector){
		node.force.x = node.force.x + vector.x * scalar;
		node.force.y = node.force.y + vector.y * scalar;
		node.force.z = 0;
	} else {
		console.log("undefined force or vector");
	}
};

// repulsive forces are only applied between nodes that share a plane
TRIPTYCH.MP2LayoutEngine.prototype.addRepulsiveForces = function(node1, node2){
	if (this.nodesSharePlane(node1, node2)){
		var v = node1.getVector(node2);
		v.z = 0;
		var scaledEdgeLength = v.length() / this.edgeLength;
		
		if (scaledEdgeLength < 0.1) scaledEdgeLength = 0.1
	
		var scale = this.repulsion/(scaledEdgeLength * scaledEdgeLength);
		this.addForce(node1, v, -1 * scale);	
		this.addForce(node2, v, scale);
	}
};

TRIPTYCH.MP2LayoutEngine.prototype.nodesSharePlane = function(node1, node2){
	if (node1.planes && node2.planes){
		for (var i = 0; i < node1.planes.length; i++){
			var p = node1.planes[i];
			if (node2.planes.lastIndexOf(p) != -1) return true;
		}
		return false;
	}
	return true; // if either doesn't have any planes, treat it as being in all planes
}

TRIPTYCH.MP2LayoutEngine.prototype.addEdgeForces = function(edge){
		var fromNode = edge.from;
		var toNode = edge.to;
		var v = fromNode.getVector(toNode);
		v.z = 0;
		var len = edge.defaultLength || this.edgeLength;
		var displacement = v.length() - len;
		if (displacement > 0.1){
			var scalar = this.springConstant * displacement;
			this.addForce(fromNode, v, scalar);
			this.addForce(toNode, v, -1 * scalar);
		}
};

TRIPTYCH.MP2LayoutEngine.prototype.updateNodePositions = function(){
	for (var i in this.graph.nodes){
		var node = this.graph.nodes[i];
		var len = node.force.length();
		var f = node.force.clone();
		f.z = 0;
		if (len > this.maxForce) len = this.maxForce;
	
		f.normalize();
		f.multiplyScalar(len * this.damping);
		
		node.position.addSelf(f);
		node.position.z = 0;

	}	
};
