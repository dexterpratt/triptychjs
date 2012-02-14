/*

In Triptych, 
	Graphs represent nodes linked by edges
	Nodes have logical types and 3D positions
	Edges have relationship types 

	Graphs are rendered in conjunction with a GraphStyle object that controls the visualization of the graph
	
	This version of Triptych is explictly designed to be visualized via THREE.js, and so when the
	Triptych graph is modified (as in incremental layout algorithms) the controlled THREE.js 
	objects are updated (includes managing cached states). The THREE.js objects are simply
	graphic objects - lines, shapes, etc. - and do not express the graph relationships.
	
*/

var TRIPTYCH = {};

/*
------------------------------------
	Graph
------------------------------------
*/

TRIPTYCH.Graph = function(){
	this.nodes = [];
	this.edges = [];
	this.nodeIdMap = {};
	this.nodeIdentifierMap = {};
	this.relationships = {};
	this.maxId = 0;
};

TRIPTYCH.Graph.prototype = {

	constructor : TRIPTYCH.Graph,
	
	addNode : function (node){
		this.nodes.push(node);
		this.nodeIdMap[node.id] = node;
		if (node.identifier) this.nodeIdentifierMap[node.identifier] = node;
		node.graph = this;
		this.maxId = Math.max(this.maxId, node.id);
	},
	
	copyExternalNode : function (externalNode){
		var internalNode = this.nodeByIdentifier(externalNode.identifier);
		if (internalNode) return internalNode;
		internalNode = new TRIPTYCH.Node(graph.maxId + 1);
		internalNode.identifier = externalNode.identifier;
		internalNode.type = externalNode.type;
		internalNode.label = externalNode.label;
		internalNode.needsUpdate = true;
		this.addNode(internalNode);
		return internalNode;
	
	},
	
	addEdge : function (edge){
		this.edges.push(edge);
		edge.graph = this;
	},
	
	relationshipByType : function (type){
		return this.relationships[type];
	},
	
	findOrCreateRelationship : function (type){
		var rel = this.relationshipByType(type);
		if (rel) return rel;
		rel = new TRIPTYCH.Relationship(type);
		this.relationships[type] = rel;
		return rel;
	},
	
	// id within the graph
	nodeById : function (id){
		return this.nodeIdMap[id];
	},
	
	// id across graphs 
	// (a given application is responsible for assigning unique identifiers
	// for nodes in the graphs that it loads)
	nodeByIdentifier : function(identifier){
		if (identifier) return this.nodeIdentifierMap[identifier];
		return false;
	},
	
	findEdge : function (fromNode, relationship, toNode){
		for (var i = 0; i < this.edges.length; i++){
			var edge = this.edges[i];
			if (fromNode == edge.from && toNode == edge.to && relationship == edge.relationship){
				
				return edge;
			}
		}
		return false;
	},
	
	copyExternalEdge : function(edge){
		var rel = this.findOrCreateRelationship(edge.type);
		var from = this.copyExternalNode(edge.from);
		var to = this.copyExternalNode(edge.to);
		var internalEdge = this.findEdge(from, rel, to);
		if (internalEdge) return internalEdge;
		internalEdge = new TRIPTYCH.Edge(from, rel, to);
		this.addEdge(internalEdge);
		return internalEdge;
	},
	
	addGraph : function (graph){
		var internalGraph = this;
		$.each(graph.nodes, function(index, node){
			internalGraph.copyExternalNode(node);	
		});
		
		$.each(graph.edges, function(index, edge){
			var internalEdge = internalGraph.copyExternalEdge(edge);
			internalEdge.initNodePositions();
		});
		
		return internalGraph;
	
	}

};

/*
------------------------------------
	Node
------------------------------------
*/

TRIPTYCH.Node = function(id){

	this.position = new THREE.Vector3(0, 0, 0);
	this.force = new THREE.Vector3(0, 0, 0);
	this.modified = true;
	this.id = id;
	this.identifier = null;
	this.label = "node";
	this.type = "node";
	this.displayList = {};
	this.selected = false;
	this.graph = null;
	this.needsUpdate = false;
	
};

TRIPTYCH.Node.prototype = {

	constructor : TRIPTYCH.Node,
	
	getVector : function (node){
		var v = node.position.clone();
		v.subSelf(this.position);
		return v;
	},
	
	onClick : function (event, role){
		if (this.selected){
			this.selected = false;
		} else {
			this.selected = true;
		}
		this.needsUpdate = true;
	},
	
	onIntersectedStart : function (event, role){
		this.highlighted = true;
		this.needsUpdate = true;
	},
	
	onIntersectedEnd : function (event, role){
		this.highlighted = false;
		this.needsUpdate = true;
	},
	
	atOrigin : function(){
		return this.position.x == 0 && this.position.y == 0 && this.position.z == 0;
	}
	
	
};

/*
------------------------------------
	Edge
------------------------------------
*/

TRIPTYCH.Edge = function(fromNode, relationship, toNode){

	this.from = fromNode;
	this.to = toNode;
	this.relationship = relationship;
	this.displayList = {};

};

TRIPTYCH.Edge.prototype = {

	constructor : TRIPTYCH.Edge,

	getVector : function(){
		var v = this.to.position.clone();
		v.subSelf(this.from.position);
		return v;
	},
	
	initNodePositions : function(){
		// if one of the two nodes position isn't initialized,
		// copy its position from the other.
		// this will start nodes in the layout next to a neighbor
		if (this.to.atOrigin() && !this.from.atOrigin()){
			this.to.position.set(Math.random() + this.from.position.x, 
								Math.random() + this.from.position.y,
								Math.random() + this.from.position.z);
			//this.to.position.copy(this.from.position);
		} else if (this.from.atOrigin() && !this.to.atOrigin()){
			this.from.position.set(Math.random() + this.to.position.x, 
								Math.random() + this.to.position.y,
								Math.random() + this.to.position.z);
			//this.from.position.copy(this.to.position);
		}
	}
	
};

/*
------------------------------------
	Relationship
------------------------------------
*/

TRIPTYCH.Relationship = function(type, causal, inverting){

	this.type = type;
	if (causal){
		this.causal = causal;
	} else {
		this.causal = false;
	}
	if (inverting){
		this.inverting = inverting;
	} else {
		this.inverting = false;
	}
};

TRIPTYCH.Relationship.prototype = {

	constructor : TRIPTYCH.Relationship

};


/*
------------------------------------
	Graph Loader
------------------------------------
*/

TRIPTYCH.GraphLoader = function(){

};

TRIPTYCH.Relationship.prototype = {

	constructor : TRIPTYCH.Relationship,
	
	// returns a graph or false if a serious problem is encountered
	// TODO: deal with appropriate exception handling and 
	// reporting of errors
	load : function(type, data){
	}

};


/*
------------------------------------
	Visualizer
------------------------------------
*/

TRIPTYCH.Visualizer = function(){

	this.scene = new THREE.Scene();
	this.displayObjectToElementMap = {};
	this.intersectedElement = null;
	this.intersectionRole = null;
	this.lastIntersectedElement = null;
	this.lastIntersectionRole = null;

};

TRIPTYCH.Visualizer.prototype = {

	constructor : TRIPTYCH.Visualizer,
	
	init : function(){
		
	},
	
	render : function(){
		this.renderer.clear();
		this.renderer.render( this.scene, this.camera );
	},
	
	update : function(graph){
	
		this.updateLights();

		for (var i = 0; i<graph.nodes.length; i++){
			var node = graph.nodes[i];
			this.updateNode(node);
		}
		
		for (var i = 0; i<graph.edges.length; i++){
			var edge = graph.edges[i];
			this.updateEdge(edge);
		}
		
		// later, determine if rendering is needed
		return true;
	
	},
	
	// These methods could be regarded as redundant,
	// but they are used to make the code especially clear
	// in an area where confusion is easy
	//
	mapDisplayObjectToElement : function (displayObject, element, role){
		this.displayObjectToElementMap[displayObject.id] = [element, role];
	},
	
	unmapDisplayObject : function(displayObject){
		delete this.displayObjectToElementMap[displayObject.id];
	},
	
	getElementAndRoleByDisplayObject : function(displayObject){
		if (!displayObject) return null;
		if (!displayObject.id) return null;
		return this.displayObjectToElementMap[displayObject.id];
	},
	
	updateLights : function(){
	
	}

};

/*
------------------------------------
	LayoutEngine
------------------------------------
*/

TRIPTYCH.LayoutEngine = function(){

};

TRIPTYCH.LayoutEngine.prototype = {

	constructor : TRIPTYCH.LayoutEngine
	
//	setGraph : function(graph){
//		this.graph = graph;
//	}

};


TRIPTYCH.DynamicLayoutEngine = function(graph){

	this.needsUpdate = true;
	this.updateCount = 200;
	
};

TRIPTYCH.DynamicLayoutEngine.prototype = new TRIPTYCH.LayoutEngine();

TRIPTYCH.DynamicLayoutEngine.prototype.constructor = TRIPTYCH.DynamicLayoutEngine;

TRIPTYCH.DynamicLayoutEngine.prototype.update = function(){

	if (this.updateCount <= 0){
		this.needsUpdate = false;
	}
	if (this.needsUpdate){
		this.layoutStep();
		this.updateCount--;
	}
	return this.needsUpdate;
	
};

TRIPTYCH.DynamicLayoutEngine.prototype.startUpdating = function(max){

	this.needsUpdate = true;
	this.updateCount = max || 200;
	
};

TRIPTYCH.DynamicLayoutEngine.prototype.stopUpdating = function(){

	this.needsUpdate = false;
	this.updateCount = 0;
	
};

/*
------------------------------------
	Space
------------------------------------
*/

TRIPTYCH.Space = function(graph, visualizer, layoutEngine, controls, container){
	
	this.graph = graph;
	this.visualizer = visualizer;
	this.layoutEngine = layoutEngine;
	this.container = container;
	this.controls = controls;
	this.cameraInitialZ = 300;
	
};

TRIPTYCH.Space.prototype = {

	constructor : TRIPTYCH.Space,	
	
	init : function(){
	
		// if no container is provided, then create one
		if (!this.container) this.container = document.createElement('div');
		
		document.body.appendChild(this.container);
		
		this.layoutEngine.setGraph(this.graph);
		
		this.initCamera();
		
		this.visualizer.init(window.innerWidth, window.innerHeight, this.camera);
		
		this.controls.init(this.visualizer);
		
		this.container.appendChild( this.visualizer.renderer.domElement );
		
	},
	
	initCamera : function(){
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
		this.camera.position.z = this.cameraInitialZ;
	},
	
	clearStatus : function(){
		this.layoutChanged = false;
		this.viewChanged = false;
		this.displayChanged = false;
	},
	
	update : function(){
	
		this.clearStatus();
		
		this.layoutChanged = this.layoutEngine.update();
		
		this.controlsChanged = this.controls.update();
		
		this.displayChanged = this.visualizer.update(this.graph);
		
		if (this.layoutChanged || this.controlsChanged || this.displayChanged) this.visualizer.render();
			
	}


};