/*
   Copyright 2012 Dexter Pratt

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


TRIPTYCH.ForceDirectedLayoutEngine = function(graph){
	this.averageForceUpdateThreshold = 0.001;
	this.repulsion = 1;
	this.springConstant = 0.4;
	this.maxForce = 40.0;
	this.edgeLength = 100;
	this.damping = 0.1;
	
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype = new TRIPTYCH.DynamicLayoutEngine();

TRIPTYCH.ForceDirectedLayoutEngine.prototype.constructor = TRIPTYCH.ForceDirectedLayoutEngine;

TRIPTYCH.ForceDirectedLayoutEngine.prototype.clearForces = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.force.set(0,0,0);
	}
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.randomNodePositions = function(){
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		node.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
		node.position.normalize();
		node.position.multiplyScalar( Math.random() * 10 + 200 );
	}
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.setGraph = function(graph){
	this.graph = graph;
	this.randomNodePositions();
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.getAverageForce = function(){
	var sum = 0;
	var nodes = this.graph.nodes;
	var len = nodes.length;
	for (var i = 0; i<len; i++){
		var node = nodes[i];
		sum += node.force.length();
	}
	return sum / len;
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.layoutStep = function(){
	
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
		this.addEdgeForces(edge);		
	}
	
	this.updateNodePositions();


};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.addForce = function(node, vector, scalar){
	node.force.x = node.force.x + vector.x * scalar;
	node.force.y = node.force.y + vector.y * scalar;
	node.force.z = node.force.z + vector.z * scalar;
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.addRepulsiveForces = function(node1, node2){
	var v = node1.getVector(node2);

	var scaledEdgeLength = v.length() / this.edgeLength;
	
	if (scaledEdgeLength < 0.01) scaledEdgeLength = 0.01

	var scale = this.repulsion/(scaledEdgeLength * scaledEdgeLength);
	this.addForce(node1, v, -1 * scale);	
	this.addForce(node2, v, scale);
	
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.addEdgeForces = function(edge){
		var fromNode = edge.from;
		var toNode = edge.to;
		var v = fromNode.getVector(toNode);
		var len = edge.defaultLength || this.edgeLength;
		var displacement = v.length() - len;
		if (displacement > 0.1){
			var scalar = this.springConstant * displacement;
			this.addForce(fromNode, v, scalar);
			this.addForce(toNode, v, -1 * scalar);
		}
};

TRIPTYCH.ForceDirectedLayoutEngine.prototype.updateNodePositions = function(){
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

