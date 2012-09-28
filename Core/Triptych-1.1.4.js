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

/*

Triptych.js

	In this version of Triptych.js, visualization has been built around THREE.js, and so there
	are dependencies on that library. But the underlying design of Triptych is to encourage
	separation of the visualization and layout layers from the abstract graph, so in the
	future Triptych is intended to evolve to work with other graphics layers.
	
	One of the key points of that separation is that the nodes and edges of the
	abstract graph layer are not the objects displayed by the visualizer.  When 
	the abstract graph is modified, it is the responsibility of visualizer to manage
	any graphic objects that it uses to render that abstract graph.

	
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
	this.startingPosition = new THREE.Vector3(0,0,0);
	this.changed = false;
};

TRIPTYCH.Graph.prototype = {

	constructor : TRIPTYCH.Graph,
	
	addNode : function (node){
		this.nodes.push(node);
		this.nodeIdMap[node.id] = node;
		if (node.identifier) this.nodeIdentifierMap[node.identifier] = node;
		node.graph = this;
		this.maxId = Math.max(this.maxId, node.id);
		this.changed = true;
	},
	
	copyExternalNode : function (externalNode){
		var internalNode = this.nodeByIdentifier(externalNode.identifier);
		if (internalNode) return internalNode;
		internalNode = new TRIPTYCH.Node(graph.maxId + 1);
		internalNode.identifier = externalNode.identifier;
		internalNode.type = externalNode.type;
		internalNode.label = externalNode.label;
		$.each(externalNode.literals, function(predicate, value){
			internalNode.setLiteral(predicate, value);
		});
		this.addNode(internalNode);
		return internalNode;
	
	},
	
	addEdge : function (edge){
		this.edges.push(edge);
		edge.graph = this;
		this.changed = true;
		return edge;
	},
	
	relationshipByType : function (type){
		return this.relationships[type];
	},
	
	findOrCreateRelationship : function (type){
		var rel = this.relationshipByType(type);
		if (rel) return rel;
		console.log("creating relationship from " + type);
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
	
	nodesByLiteral : function(predicate, value){
		var foundNodes = [];
		$.each(graph.nodes, function(index, node){
			if (node.getLiteral(predicate) == value){
				foundNodes.push(node);
			}	
		});
		return foundNodes;
	},
	
	findOrCreateNodeByIdentifier : function(identifier){
		var node = this.nodeByIdentifier(identifier);
		if (node) return node;
		node = new TRIPTYCH.Node(this.maxId++);
		node.identifier = identifier;
		this.addNode(node)
		return node;
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
	
	findOrCreateEdge : function(fromNode, rel, toNode){
		var edge = this.findEdge(fromNode, rel, toNode);
		if (edge) return edge;
		edge = new TRIPTYCH.Edge(fromNode, rel, toNode);
		this.addEdge(edge);
		return edge;
	},
	
	copyExternalEdge : function(edge){
		var rel = this.findOrCreateRelationship(edge.relationship.type);
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
			internalEdge.initNodePositions(graph.startingPosition);
		});
		
		return internalGraph;
	
	},
	
	markSubgraphs : function(){
		var subgraph_num = 0;
		var subgraphMap = {};
		$.each(graph.edges, function(index, edge){

			if (!edge.from.subgraph){
				if (!edge.to.subgraph){
					// neither node has been marked yet, assign both the next subgraph number
					subgraph_num++;
					edge.to.subgraph = subgraph_num;
					edge.from.subgraph = subgraph_num;
				} else {
					// to_node is marked, but from is not, so assign from_node the to_node subgraph number
					edge.from.subgraph = edge.to.subgraph;
				}
			} else {
				// from_node is marked
				if (!edge.to.subgraph){
					// but to_node is not, so assign to_node the from_node subgraph number
					edge.to.subgraph = edge.from.subgraph;
				} else {
					// both nodes already marked
					// note that their subgraph numbers are equivalent
				}
			}
		});
		
		$.each(graph.nodes, function(index, node){
			lowestSubgraph = subgraphMap[node.subgraph];
			if (lowestSubgraph) node.subgraph = lowestSubgraph;
		});
	
	},
	
	mappedClone : function(){
		var originalGraph = this;
		var mappedGraph = new TRIPTYCH.Graph();
		$.each(originalGraph.nodes, function(index, node){
			var mappedNode = mappedGraph.copyExternalNode(node);	
			mappedNode.mapsTo = node;
		});
		
		$.each(originalGraph.edges, function(index, edge){
			var mappedEdge = mappedGraph.copyExternalEdge(edge);
			mappedEdge.mapsTo = edge;
		});
		
		return mappedGraph;
	
	},
	
	getOutgoing : function(node){
		var outgoing = [];
		$.each(this.edges, function(index, edge){
			if(edge.from == node && outgoing.indexOf(edge) == -1){
				outgoing.push(edge);
			}
		});
		return outgoing;
	},
	
	getIncoming : function(node){
		var incoming = [];
		$.each(this.edges, function(index, edge){
			if(edge.to == node && incoming.indexOf(edge) == -1){
				incoming.push(edge);
			}
		});
		return incoming;
	},
	
	getEdges : function(node){
		var allEdges = [];
		$.each(this.edges, function(index, edge){
			if((edge.from == node || edge.to == node) && allEdges.indexOf(edge) == -1){
				allEdges.push(edge);
			}
		});
		return allEdges;
	},
	
	getSinks : function(){
		var sinks = [];
		$.each(this.nodes, function(index, node){
			if (node.isSink()){
				sinks.push(node);
			}
		});
		return sinks;
	},

	getSources : function(){
		var sources = [];
		$.each(this.nodes, function(index, node){
			if (node.isSource(node)){
				sources.push(node);
			}
		});
		return sources;
	},
	
	isSink : function(node){
		var isSink = true;
		$.each(this.edges, function(index, edge){
			if (node == edge.from){
				isSink = false;
				return;
			}
		});
		return isSink;
	},
	
	isSource : function(node){
		var isSource = true;
		$.each(this.edges, function(index, edge){
			if (node == edge.to){
				isSource = false;
				return;
			}
		});
		return isSource;
	}

};


/*
------------------------------------
	Node
------------------------------------
*/

TRIPTYCH.Node = function(id){

	this.literals = {};
	this.position = new THREE.Vector3(0, 0, 0);
	this.force = new THREE.Vector3(0, 0, 0);
	this.modified = true;
	this.id = id; 					// id within the graph
	this.identifier = null; 		// external identifier
	this.ns = null;					// namespace for external identifier
	this.label = "node";  			// label to display
	this.type = "node";				// primary type of node
	this.displayList = {};
	this.selected = false;
	this.graph = null;
	this.planes = [];
	this.subGraphs = {};				// marked subsets - typically disjoint graphs
	
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
			this.setSelected(false);
		} else {
			this.setSelected(true);
		}
	},
	
	onIntersectedStart : function (event, role){
		this.setHighlighted(true);
	},
	
	onIntersectedEnd : function (event, role){
		this.setHighlighted(false);
	},
	
	setHighlighted : function(boolean){
		this.highlighted = boolean;
		this.graph.changed = true;
	},
	
	setSelected : function(boolean){
		this.selected = boolean;
		this.graph.changed = true;
	},
	
	atOrigin : function(){
		return this.position.x == 0 && this.position.y == 0 && this.position.z == 0;
	},
	
	getOutgoing : function(){
		return this.graph.getOutgoing(this);
	},
	
	getIncoming : function(){
		return this.graph.getIncoming(this);
	},
	
	getEdges : function(){
		return this.graph.getEdges(this);
	},
	
	getChildren : function(){
		var children = [];
		$.each(this.getOutgoing(), function(index, edge){
			if (children.indexOf(edge.to) == -1){
				children.push(edge.to);
			}
		});
		return children;
	},
	
	getParents : function(){
		var parents = [];
		$.each(this.getIncoming(), function(index, edge){
			var parent = edge.from;
			if (parents.indexOf(parent) == -1){
				parents.push(parent);
			}
		});
		return parents;
	
	},
	
	isSource : function(){
		return this.graph.isSource(this); 
	},
	
	isSink : function(){
		return this.graph.isSink(this); 
	},
	
	setLiteral : function(predicate, string){
		this.literals[predicate] = string;
	},
	
	getLiteral : function(predicate){
		return this.literals[predicate];
	},
	
	addSubGraph : function(id, text){
		if (!text) text = "subgraph " + id;
		if (!this.subGraphs.id){
			this.subGraphs.id = text;
		}
	},
	
	addPlane : function(id){
		if (this.planes.lastIndexOf(id) == -1) this.planes.push(id);
		this.graph.changed = true;
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
	this.subGraphs = {};
	this.planes = [];

};

TRIPTYCH.Edge.prototype = {

	constructor : TRIPTYCH.Edge,

	getVector : function(){
		var v = this.to.position.clone();
		v.subSelf(this.from.position);
		return v;
	},

	onClick : function (event, role){
		if (this.selected){
			this.setSelected(false);
		} else {
			this.setSelected(true);
		}
	},
	
	onIntersectedStart : function (event, role){
		this.setHighlighted(true);
	},
	
	onIntersectedEnd : function (event, role){
		this.setHighlighted(false);
	},
	
	setHighlighted : function(boolean){
		this.highlighted = boolean;
		this.graph.changed = true;
	},
	
	setSelected : function(boolean){
		this.selected = boolean;
		this.graph.changed = true;
	},
		
	initNodePositions : function(startingPosition){
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
		} else if (startingPosition) {
			this.from.position.set(startingPosition.x, startingPosition.y, startingPosition.z);
			this.to.position.set(startingPosition.x, startingPosition.y, startingPosition.z)
		}
		this.graph.changed = true;
	},
	
	reverse : function(){
		var temp = this.from;
		this.from = this.to;
		this.to = temp;
	},
	
	addSubGraph : function(id, text){
		if (!text) text = "subgraph " + id;
		if (!this.subGraphs.id){
			this.subGraphs.id = text;
		}
	},
	
	addPlane : function(id){
		this.planes.push(id);
		this.graph.changed = true;
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
	this.edgeReferenceLength = 100;
	this.resources = {};

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
	
		visualizer.needsRender = false;
	
		this.updateTimeLoops();
		
		this.updateLights();
		
		for (var i = 0; i<graph.nodes.length; i++){
			var node = graph.nodes[i];
			this.updateNode(node);
		}
		
		for (var i = 0; i<graph.edges.length; i++){
			var edge = graph.edges[i];
			this.updateEdge(edge);
		}
	
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
	
	addElement : function (object, element, role){
		this.scene.add( object );
		this.mapDisplayObjectToElement( object, element, role);
	},
	
	updateLights : function(){
	
	},
	
	updateTimeLoops : function(){
	
	},
	
	addTexture : function(resourceName, url){
		this.resources[resourceName] = THREE.ImageUtils.loadTexture(url);
	}

};

/*
------------------------------------
	NodeDisplayer
------------------------------------
*/

TRIPTYCH.NodeDisplayer = function(node){
	this.node = node;

};

TRIPTYCH.NodeDisplayer.prototype.constructor = TRIPTYCH.NodeDisplayer;


/*
------------------------------------
	EdgeDisplayer
------------------------------------
*/

TRIPTYCH.EdgeDisplayer = function(edge){
	this.edge = edge;

};

TRIPTYCH.EdgeDisplayer.prototype.constructor = TRIPTYCH.EdgeDisplayer;

/*
------------------------------------
	LayoutEngine
------------------------------------
*/

TRIPTYCH.LayoutEngine = function(){

};

TRIPTYCH.LayoutEngine.prototype = {

	constructor : TRIPTYCH.LayoutEngine,
	
	setGraph : function(graph){
		this.graph = graph;
		this.graph.changed = true;
	},
	
	update : function(){
	
	}

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
		// doing 2 layout steps is a workaround for 
		// a "jitter" problem in the dynamic layout engines
		this.layoutStep();
		this.layoutStep();
		this.graph.changed = true;
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
	this.visualizer.space = this;
	this.layoutEngine = layoutEngine;
	this.layoutEngine.space = this;
	this.container = container;
	this.controls = controls;
	this.controls.space = this;
	this.cameraInitialZ = 300;
	this.alwaysUpdate = false;
	
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
		this.camera.position.z = this.cameraInitialZ;
	},

	
	update : function(){
		
		this.layoutEngine.update();
		
		var controlsChanged = this.controls.update();		
		
		// 
		// Update the visualization and render if the graph has changed
		// or if the controls change
		//
		if (controlsChanged || this.graph.changed || this.alwaysUpdate){ 
			this.visualizer.update(this.graph);		

			this.visualizer.render();
		}
		
		//
		// Clear the state of the graph 
		//
		this.graph.changed = false;
	}


};

//
//  Adapted from the THREE.js Detector
//

TRIPTYCH.EnvironmentDetector = {

	canvas : !! window.CanvasRenderingContext2D,
	webgl : ( function () 
				{ try 
					{ 
						return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); 
					} 
				catch( e ) 
					{ return false; } 
				} )(),
	workers : !! window.Worker,
	fileapi : window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage : function () {

		var domElement = document.createElement( 'div' );

		domElement.style.fontFamily = 'helvetica neue, helvetica, arial, sans-serif';
		domElement.style.fontSize = '200%';
		domElement.style.textAlign = 'center';
		domElement.style.background = '#000000';
		domElement.style.color = '#FFFFFF';
		domElement.style.padding = '1em';
		domElement.style.width = '50%';
		//domElement.style.margin = '5em auto 0';
		domElement.style.left = '50%';
		domElement.style.marginLeft = '-25%';
		domElement.style.top = '100px';
		domElement.style.zIndex = 2000;
		domElement.style.position = 'absolute';

		if ( ! this.webgl ) {

			domElement.innerHTML = window.WebGLRenderingContext ? [
				'This Triptych.js application requires a graphics system that supports WebGL - a WebGL-compatible graphics card or built-in GPU, plus a browser such as a recent version of Chrome or Firefox. Safari will work if WebGL is enabled.'
			].join( '\n' ) : [
				'This Triptych.js-based application requires a browser that supports WebGL, such as recent versions of Chrome or Firefox. Safari will work if WebGL is enabled.'
			].join( '\n' );

		}

		return domElement;

	},

	addGetWebGLMessage : function ( parameters ) {

		var parent, id, domElement;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		domElement = this.getWebGLErrorMessage();
		domElement.id = id;

		parent.appendChild( domElement );

	}

};
