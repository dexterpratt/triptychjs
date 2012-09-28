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



TRIPTYCH.BasicGraphLoader = function(){

	this.typeFilter = "none";

};

TRIPTYCH.BasicGraphLoader.prototype = new TRIPTYCH.GraphLoader();

TRIPTYCH.BasicGraphLoader.prototype.constructor = TRIPTYCH.BasicGraphLoader;

TRIPTYCH.BasicGraphLoader.prototype.load = function(type, data){
	var graph = false;
	if (type == 'xgml') graph = this.loadXGML(data);
	if (type == 'xgmml') graph = this.loadXGMML(data);
	//graph.markSubgraphs();
	return graph;
};

// XGMML is one of the formats exported by Cytoscape and is
// used by the BEL Framework from Selventa
//
// this basic loader creates relationships on the fly,
// does not enforce a schema of allowed relationships or node types
TRIPTYCH.BasicGraphLoader.prototype.loadXGMML = function (xgmml, existingGraph, startingPosition){
	var graph = new TRIPTYCH.Graph();
	if (startingPosition){
		graph.startingPosition = startingPosition;
	}
	var loader = this;
	
	$(xgmml).find('graph').each(function(){
	
	
/*
BEL-Cytoscape XGMML

  <node label="p(HGNC:CTTN,pmod(P,Y,482))" id="-379">
    <att type="string" name="KAM_NODE_FUNCTION" value="PROTEIN_ABUNDANCE" cy:editable="false"/>
    <att type="string" name="KAM_NODE_ID" value="NAAAACwAADus" cy:hidden="true" cy:editable="false"/>
    <att type="string" name="KAM_NODE_LABEL" value="p(HGNC:CTTN,pmod(P,Y,482))"/>
    <att type="string" name="canonicalName" value="p(HGNC:CTTN,pmod(P,Y,482))"/>
    <graphics type="ROUNDED_RECTANGLE" h="30.0" w="75.0" x="619.0247192382812" y="1442.685302734375" fill="#55ffff" width="1" outline="#000000" cy:nodeTransparency="1.0" cy:nodeLabelFont="Default-0-12" cy:nodeLabel="p(HGNC:CTTN,pmod(P,Y,482))" cy:borderLineType="solid"/>
  </node>
*/

		$(this).find('node').each(function(){
			var nodeId = $(this).attr('id');
			var node = graph.nodeById(nodeId);
			if (!node){
				
				var type, identifier, label;
				$(this).find('att').each(function(){
					var name = $(this).attr('name');
					if (name == "namespace" || name == "KAM_NODE_FUNCTION"){
						type = $(this).attr('value');
					} else if (name == "taxid"){
						type = $(this).attr('value');
					} else if (name == "KAM_NODE_LABEL"){
						label = $(this).attr('value');
					} else if (name == "KAM_NODE_ID"){
						identifier = $(this).attr('value');
					}
				});
				
				if (loader.typeFilter == "none" || $.inArray(type, loader.typeFilter) != -1){
					node = new TRIPTYCH.Node(nodeId);
					node.type = type || "unknown";
					node.label = label || $(this).attr('label');
					node.identifier = identifier || node.label;
				
					graph.addNode(node);
				}
			}
		});
		
/*
BEL-Cytoscape XGMML

  <edge label="p(HGNC:ATF2,pmod(P,T,71)) (DIRECTLY_INCREASES) tscript(p(HGNC:ATF2))" source="-357" target="-350">
    <att type="string" name="KAM_EDGE_ID" value="EAAAACwAABOk" cy:hidden="true" cy:editable="false"/>
    <att type="string" name="canonicalName" value="p(HGNC:ATF2,pmod(P,T,71)) (DIRECTLY_INCREASES) tscript(p(HGNC:ATF2))"/>
    <att type="string" name="interaction" value="DIRECTLY_INCREASES" cy:editable="false"/>
    <graphics width="3" fill="#000000" cy:sourceArrow="0" cy:targetArrow="6" cy:sourceArrowColor="#000000" cy:targetArrowColor="#000000" cy:edgeLabelFont="SanSerif-0-10" cy:edgeLabel="" cy:edgeLineType="SOLID" cy:curved="STRAIGHT_LINES"/>
  </edge>
*/
		$(this).find('edge').each(function(){
			var fromId  = $(this).attr('source');
			var toId  = $(this).attr('target');
			var relType = "edge";
			var description, edgeId;
			
			var fromNode = graph.nodeById(fromId);
			var toNode = graph.nodeById(toId);
			
			if (fromNode && toNode){
				$(this).find('att').each(function(){
					var name = $(this).attr('name');
					if (name == "interaction" || name == "edgeTypeId"){
						relType = $(this).attr('value');
					} else if (name == "KAM_EDGE_ID"){
						edgeId = $(this).attr('value');
					} else if (name == "cannonicalName"){
						description = $(this).attr('value');
					}
				});
				
				var rel = graph.findOrCreateRelationship(relType);
				
				var edge = graph.findEdge(fromNode, rel, toNode);
				if (!edge){
					edge = graph.addEdge(new TRIPTYCH.Edge(fromNode, rel, toNode));
					edge.description = description;
					edge.edgeId = edgeId;
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
							if (id){
								var node = new TRIPTYCH.Node(id);
								if(label){
									node.label = label;
								} else {
									node.label = "blank"
								}
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
							if (source && target){
								var rel;
								
								if (label) {
									 rel = graph.findOrCreateRelationship(label);
								} else {
									rel = graph.findOrCreateRelationship("edge");
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
