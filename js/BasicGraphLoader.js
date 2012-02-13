TRIPTYCH.BasicGraphLoader = function(){

	this.typeFilter = "none";

};

TRIPTYCH.BasicGraphLoader.prototype = new TRIPTYCH.GraphLoader();

TRIPTYCH.BasicGraphLoader.prototype.constructor = TRIPTYCH.BasicGraphLoader;

TRIPTYCH.BasicGraphLoader.prototype.load = function(type, data){
	if (type == 'xgml') return this.loadXGML(data);
	if (type == 'xgmml') return this.loadXGMML(data);
	return false;
};

// XGMML is one of the formats exported by Cytoscape and is
// used by the BEL Framework from Selventa
//
// this basic loader creates relationships on the fly,
// does not enforce a schema of allowed relationships or node types
TRIPTYCH.BasicGraphLoader.prototype.loadXGMML = function (xgmml, existingGraph){
	var graph = new TRIPTYCH.Graph();
	var loader = this;
	
	$(xgmml).find('graph').each(function(){
		$(this).find('node').each(function(){
			var nodeId = $(this).attr('id');
			var node = graph.nodeById(nodeId);
			if (!node){
				
				var type;
				$(this).find('att').each(function(){
					var name = $(this).attr('name');
					if (name == "namespace"){
						type = $(this).attr('value');
					} else if (name == "taxid"){
						type = $(this).attr('value');
					}
				});
				
				if (loader.typeFilter == "none" || $.inArray(type, loader.typeFilter) != -1){
					node = new TRIPTYCH.Node(nodeId);
					node.type = type;
					node.label = $(this).attr('label');
					node.identifier = node.type + ":" + node.label;
				
					graph.addNode(node);
				}
			}
		});
		$(this).find('edge').each(function(){
			var fromId  = $(this).attr('source');
			var toId  = $(this).attr('target');
			var relType = "edge";
			
			var fromNode = graph.nodeById(fromId);
			var toNode = graph.nodeById(toId);
			
			if (fromNode && toNode){
				$(this).find('att').each(function(){
					var name = $(this).attr('name');
					if (name == "interaction"){
						relType = $(this).attr('value');
					}
				});
				
				var rel = graph.findOrCreateRelationship(relType);
				
				var edge = graph.findEdge(fromNode, rel, toNode);
				if (!edge){
					graph.addEdge(new TRIPTYCH.Edge(fromNode, rel, toNode));
				}
			}
		});
	});
	if (existingGraph) return existingGraph.addGraph(graph);
	return graph;
};

// XGML is one of the formats supported by yFiles / yEd
//
// this basic loader creates relationships on the fly,
// does not enforce a schema of allowed relationships or node types

TRIPTYCH.BasicGraphLoader.prototype.loadXGML = function (data){
	var graph = new TRIPTYCH.Graph();
	var relationships = {};
	// The data elements in the schema are sections and
	// attributes. 
	// The semantics of a section are controlled by its 'name'
	// property, essentially its type. 
	
	$(data).find('section').each(function(){
		// We expect one top section with name = 'xgml'
		if ($(this).attr('name') == 'xgml'){
			var xgmlSection = $(this);
			xgmlSection.find('section').each(function(){
				// within xgml, we expect one section named 'graph'
				if ($(this).attr('name') == 'graph'){
					var graphSection = $(this);
					graphSection.find('section').each(function(){
						// within the graph, we expect multiple
						// sections that may be either named 'node'
						// or 'edge'. We expect all nodes to 
						// be before any edges
						if ($(this).attr('name') == 'node'){
							var nodeSection = $(this);
							// within a node, we expect multiple
							// 'attribute' elements, one with key = 'label'
							// and one with key = 'id'
							var id, label;
							nodeSection.find('attribute').each(function(){
								if($(this).attr('key') == 'id'){
									id = $(this).text();
								} else if ($(this).attr('key') == 'label'){
									label = $(this).text();
								}
							});
							if (id && label){
								var node = new TRIPTYCH.Node(id);
								node.label = label;
								node.identifier = node.type + ":" + node.label;
								graph.addNode(node);
							}
				
						} else if ($(this).attr('name') == 'edge'){
							var edgeSection = $(this);
							// within an edge, we expect multiple
							// 'attribute' elements, one with key = 'label'
							// and one with key = 'source' and one with
							// key = 'target'
							var source, target, label;
							edgeSection.find('attribute').each(function(){
								if($(this).attr('key') == 'source'){
									source = $(this).text();
								} else if ($(this).attr('key') == 'target'){
									target = $(this).text();
								} else if ($(this).attr('key') == 'label'){
									label = $(this).text();
								}
							});
							if (source && target && label){
								var rel = graph.findOrCreateRelationship(label);
								var fromNode = graph.nodeById(source);
								var toNode = graph.nodeById(target);
								graph.addEdge(new TRIPTYCH.Edge(fromNode, rel, toNode));
							}
						}
						
					}); // close finding node and edge sections
				}
				
			}); // close finding graph section
		
		}

	}); // close finding xgml section
	return graph;
};


