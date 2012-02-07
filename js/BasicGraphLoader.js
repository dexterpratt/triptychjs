TRIPTYCH.BasicGraphLoader = function(){

	// no initializations yet

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
TRIPTYCH.BasicGraphLoader.prototype.loadXGMML = function (xgmml){
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
								node.position.set(100,50,50);
								node.label = label;
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
								var rel = relationships[label];
								if (!rel){
									rel = new TRIPTYCH.Relationship(label);
									relationships[label] = rel;
								}
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


