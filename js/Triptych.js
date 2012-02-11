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
};

TRIPTYCH.Graph.prototype = {

	constructor : TRIPTYCH.Graph,
	
	addNode : function (node){
		this.nodes.push(node);
		this.nodeIdMap[node.id] = node;
		node.graph = this;
	},
	
	addEdge : function (edge){
		this.edges.push(edge);
		edge.graph = this;
	},
	
	nodeById : function (id){
		return this.nodeIdMap[id];
	}
	
	findEdge : function (fromNode, relationship, toNode){
		for (var i = 0; i < this.edges.size(); i++){
			var edge = this.edges[i];
			if (fromNode == edge.from && toNode == edge.to && relationship == edge.relationship){
				
				return edge;
			}
		}
		return false;
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

TRIPTYCH.Rel = {

	"DEFAULT" : new TRIPTYCH.Relationship("DEFAULT"),
	"PLUS" : new TRIPTYCH.Relationship("PLUS", true),
	"MINUS" : new TRIPTYCH.Relationship("MINUS", true, true)

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


TRIPTYCH.graphFromXGMML = function (xgmml){
	var graph = new TRIPTYCH.Graph();
	var relationships = {};
	$(xgmml).find('graph').each(function(){
		$(this).find('node').each(function(){
			var nodeId = $(this).attr('id');
			var node = new TRIPTYCH.Node(nodeId);
			node.position.set(100,50,50);
			node.label = $(this).attr('label');
			graph.addNode(node);
		});
		$(this).find('edge').each(function(){
			var fromId  = $(this).attr('source');
			var toId  = $(this).attr('target');
			var relType = "edge";
			$(this).find('att').each(function(){
				var name = $(this).attr('name');
				if (name == "interaction"){
					relType = $(this).attr('value');
				}
			});
			var rel = relationships[relType];
			if (rel == null){
				rel = new TRIPTYCH.Relationship(relType);
				relationships[relType] = rel;
			}
			var fromNode = graph.nodeById(fromId);
			var toNode = graph.nodeById(toId);
			graph.addEdge(new TRIPTYCH.Edge(fromNode, rel, toNode));
		});
	});
	return graph;
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
	
};

TRIPTYCH.DynamicLayoutEngine.prototype = new TRIPTYCH.LayoutEngine();

TRIPTYCH.DynamicLayoutEngine.prototype.constructor = TRIPTYCH.DynamicLayoutEngine;

TRIPTYCH.DynamicLayoutEngine.prototype.update = function(){

	if (this.needsUpdate){
		this.layoutStep();
	}
	return this.needsUpdate;
	
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
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		this.camera.position.z = 500;
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