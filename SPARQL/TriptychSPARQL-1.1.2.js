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
------------------------------------
	GraphTranslator
------------------------------------
*/


TRIPTYCH.GraphTranslator = function(id){
	this.predicateRules = {};
	this.nodeTypeRules = {};
	this.nodeLabelRules = {};
	this.namespaces = {};

};

TRIPTYCH.GraphTranslator.prototype = {

	constructor : TRIPTYCH.GraphTranslator,
	
	getType : function (inputNode){
		return this.nodeTypeRules[inputNode.type];
	},
	
	getLabel : function (inputNode){
		var fn = this.nodeLabelRules[inputNode.type] || this.nodeLabelRules['default'];
		if (fn) return fn(inputNode);
		return inputNode.label;
	},
	
	getPredicate : function (inputPredicate){
		return this.predicateRules[inputPredicate];
	},
	
	addNodeTypeRule : function (inputNodeType, outputNodeType){
		var nt = this.getURI(inputNodeType);
		this.nodeTypeRules[nt] = outputNodeType;
	},
	
	addPredicateRule : function(inputPredicate, outputPredicate){
		this.predicateRules[inputPredicate] = outputPredicate;
	},
	
	addNodeLabelRule : function(inputNodeType, outputFunction){
		var nt = this.getURI(inputNodeType);
		this.nodeLabelRules[nt] = outputFunction;
	},
	
	getURI : function(nsValue){
		var components = nsValue.split(":");
		if (components.length > 1){
			var ns = this.namespaces[components[0]];
			if (ns){
				return ns + components[1];
			}
		}
		return nsValue;
	},
	
	// 
	// As of May 2012, the translation facility is limited
	// to substitution of edge and node types, but it is 
	// intended to handle more complex transformations, especially
	// the expansion or collapse of graph structure
	//
	translate : function(originalGraph){
		var tr = this;
		var translatedGraph = new TRIPTYCH.Graph();
		$.each(originalGraph.nodes, function(index, node){
			var mappedNode = tr.translateNode(node, translatedGraph);	
			if (mappedNode) mappedNode.mapsTo = node;
		});
		
		$.each(originalGraph.edges, function(index, edge){
			var mappedEdge = tr.translateEdge(edge, translatedGraph);
			if (mappedEdge) mappedEdge.mapsTo = edge;
		});
		
		translatedGraph.translatedFrom = originalGraph;
		
		return translatedGraph;
	
	},
	
	translateNode : function (externalNode, translatedGraph){
		// only translate nodes for which we have a translation of their type
	 	var type = this.getType(externalNode);
	 	if (type){
			var internalNode = translatedGraph.nodeByIdentifier(externalNode.identifier);
			if (internalNode) return internalNode;
			internalNode = new TRIPTYCH.Node(translatedGraph.maxId + 1);
			internalNode.identifier = externalNode.identifier;
			internalNode.type = type;
			internalNode.label = this.getLabel(externalNode);
			$.each(externalNode.literals, function(predicate, value){
				internalNode.setLiteral(predicate, value);
			});
			translatedGraph.addNode(internalNode);
			return internalNode;
		}
	},
	
	translateEdge : function(edge, translatedGraph){
		var predicate = this.getPredicate(edge.relationship.type);
		if (predicate){
			var rel = translatedGraph.findOrCreateRelationship(predicate);
			// only translate edges for which we can translate the predicate
			// and both node types.
			if (this.getType(edge.from) && this.getType(edge.to)){
				var from = this.translateNode(edge.from, translatedGraph);
				var to = this.translateNode(edge.to, translatedGraph);
				var internalEdge = translatedGraph.findEdge(from, rel, to);
				if (internalEdge) return internalEdge;
				internalEdge = new TRIPTYCH.Edge(from, rel, to);
				translatedGraph.addEdge(internalEdge);
				return internalEdge;
			}
		}
	}
}	


/*
------------------------------------
	SPARQLInterface
------------------------------------
*/

TRIPTYCH.SPARQLInterface = function(endpointURL){
	this.endpointURL = endpointURL;
	this.loader = new TRIPTYCH.RDFGraphLoader();
	this.namespaces = {};
};

/*
CONSTRUCT {
<http://www.edmcouncil.org/ontologies/omg-edmc/IRSwapTestIndividuals#Swap_Contract-SC1> ?p ?o . 
?o a ?type .
?o ?p2 ?lit
}
WHERE {
<http://www.edmcouncil.org/ontologies/omg-edmc/IRSwapTestIndividuals#Swap_Contract-SC1> ?p ?o . 
OPTIONAL {?o a ?type } .
OPTIONAL {?o ?p2 ?lit . FILTER isLiteral(?lit) }
}
*/

TRIPTYCH.SPARQLInterface.prototype = {

	constructor : TRIPTYCH.SPARQLInterface,
	
	browseIdentifier : function (identifier, callback){
		console.log("identifier = " + identifier);
		var construct = "CONSTRUCT {" + identifier + " ?p ?o . ?o a ?type . ?o ?p2 ?lit . ?o3 ?p3 " + identifier + " } ";
		var where = "WHERE {" + identifier + " ?p ?o . OPTIONAL { ?o3 ?p3 " + identifier + "} . OPTIONAL{ ?o a ?type} . OPTIONAL {?o ?p2 ?lit . FILTER isLiteral(?lit)} }";
		var query = "query=" + construct + where;
		console.log(query);
		var graphLoader = this.loader;
		$.ajax({
			type: "POST",
			url: this.endpointURL,
			data : query,
			dataType: "xml",
			success: function(returnedXML) {
				console.log("xml = " + returnedXML);
				var newGraph = graphLoader.loadRDF(returnedXML);
				callback(newGraph);
			}
		});
	},
	
	browseNode : function (node, callback){
		if (node.mapsTo){
			this.browseNode(node.mapsTo, callback);
		} else {
			var id;
			if (node.rdfURI) {
				id = node.rdfURI;
			} else if (node.rdfNodeId){
				id = node.rdfNodeId;
			} else {
				id = node.identifier;
			}
			this.browseIdentifier(id,callback);
		}
	},
	
	construct : function (construct, where, callback){
		var query = "query=" + this.makePrefixes() + construct + " " + where;
		console.log(query);
		var graphLoader = this.loader;
		$.ajax({
			type: "POST",
			url: this.endpointURL,
			data : query,
			dataType: "xml",
			success: function(returnedXML) {
				console.log("xml = " + returnedXML);
				var newGraph = graphLoader.loadRDF(returnedXML);
				callback(newGraph);
			}
		});
	},
	
	makePrefixes : function(){
		var prefixes = "";
		$.each(this.namespaces, function(prefix, ns){
			prefixes = prefixes + "PREFIX " + prefix + ":<" + ns + "> ";
		});
		return prefixes;
	
	},
	
	getAll : function (callback){
		var construct = "CONSTRUCT {?s ?p ?o } ";
		var where = "WHERE {?s ?p ?o}";
		var query = "query=" + construct + where;
		console.log(query);
		var graphLoader = this.loader;
		$.ajax({
			type: "POST",
			url: this.endpointURL,
			data : query,
			dataType: "xml",
			success: function(returnedXML) {
				console.log("xml = " + returnedXML);
				var newGraph = graphLoader.loadRDF(returnedXML);
				callback(newGraph);
			}
		});
	}
	
}

/*
------------------------------------
	SPARQLInterface
------------------------------------
*/

TRIPTYCH.RDFGraphLoader = function(){

	this.typeFilter = "none";

};

TRIPTYCH.RDFGraphLoader.prototype = new TRIPTYCH.GraphLoader();

TRIPTYCH.RDFGraphLoader.prototype.constructor = TRIPTYCH.RDFGraphLoader;

TRIPTYCH.RDFGraphLoader.prototype.loadRDF = function (data){
	var graph = new TRIPTYCH.Graph();
	var relationships = {};
	// The data elements in the schema are sections and
	// attributes. 
	// The semantics of a section are controlled by its 'name'
	// property, essentially its type. 
	
	$(data).find('"rdf\\:rdf"').each(function(){
		// The namespaces are held in the attributes of the RDF element
		//graph.nsMap = $(this).xmlns();
		
		$(this).find('"rdf\\:description"').each(function(){
			// for each description element, get the 'from' node (subject)
			// based either on the attributes
			var fromIdentifier, fromNode;
			if (fromIdentifier = $(this).attr('rdf:about')){
				// rdf:about identifies a node corresponding to an external resource by its uri
				fromNode = graph.findOrCreateNodeByIdentifier(fromIdentifier);
				fromNode.rdfURI = "<" + fromIdentifier + ">";
				fromNode.label = fromIdentifier;
			} else if (fromIdentifier = $(this).attr('rdf:nodeID')){
				// rdf:nodeId identifies a blank node in the graph
				fromNode = graph.findOrCreateNodeByIdentifier(fromIdentifier);
				fromNode.rdfNodeId = "_:" + fromIdentifier;
				fromNode.label = fromIdentifier;
			}
			// If we have successfully found / created the 'from' node (subject),
			// we can then find the predicate and the 'to' node (object)
			if (fromNode){
				$(this).find('*').each(function(){
					var tagName = $(this)[0].tagName;
					if (tagName == "rdf:type"){
						// treat type specially
						if (toIdentifier = $(this).attr('rdf:resource')){
							fromNode.type = toIdentifier;
						}
					} else {
						var predicate = graph.findOrCreateRelationship(tagName);
						var literalValue = $(this).text();
						var toNode, toIdentifier;
						if (literalValue){
							// if the element has a value, that is a literal value. 
							// We assign it to the node as a literalValue
							fromNode.setLiteral(tagName, literalValue);
						} else {
							if (toIdentifier = $(this).attr('rdf:nodeID')){
								// if the element has an rdf:nodeId attribute, 
								// that identifies a blank node in the graph
								toNode = graph.findOrCreateNodeByIdentifier(toIdentifier);
								toNode.rdfNodeId = "_:" + toIdentifier;
								toNode.label = toIdentifier;
							} else if (toIdentifier = $(this).attr('rdf:resource')){
								// if the element has an rdf:resource attribute, 
								// that identifies an graph node by an external resource
								toNode = graph.findOrCreateNodeByIdentifier(toIdentifier);
								toNode.rdfURI = "<" + toIdentifier + ">";
								toNode.label = toIdentifier;
							}			
							// Now we can find or create the graph edge
							if (fromNode && predicate && toNode){
								graph.findOrCreateEdge(fromNode, predicate, toNode);
							}
						}
					}
				
				});
			
			}	
		
		});


	});
	
	if (this.translator){
		return this.translator.translate(graph)
	} else {
		return graph;
	}
}
