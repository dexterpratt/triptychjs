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
	Animation 
*/

var start = Date.now();
var rate = 30; // Hz
var lastFrameNumber;

var visualizer, graph, layoutEngine, space, controls, loader;

function animate() {
	requestAnimationFrame( animate );
	var elapsed = Date.now() - start;
	var frameNumber = Math.round(elapsed/(1000/rate));
	//
	// Check to see if it is time for the next update
	//
	if (frameNumber == lastFrameNumber) return;
	lastFrameNumber = frameNumber;
	space.update();	
}


/*
	BEL Graph Setup
*/


function assignSinglePlane(){
	// single plane
	$.each(graph.edges, function(i, edge){
		edge.addPlane("main");
	});
	
	$.each(graph.nodes, function(i, node){
		node.animated = true;
		$.each(node.getEdges(), function(j, edge){
			$.each(edge.planes, function(n, plane){
				node.addPlane(plane);
			});
		});
		if (node.planes.length == 0) node.addPlane("main");
	});
};

function assignNodeValues(n){
	// Random normalized values: -1 to 1
	if (n < 3) n = 3;
	var start, end;
	$.each(graph.nodes, function(i, node){
		node.values = [];
		start = (Math.random() * 2) - 1;
		end = (Math.random() * 2) - 1;
		node.values.push(start);
		delta = (end - start)/n-1;
		for (var i = 0; i < n-2; i++){
			var val = start + (delta * i) + ((Math.random() * 0.2) - 0.1);
			node.values.push(val);
		}
		node.values.push(end);
		node.values.reverse();
	});
	
};

function setNodeTypes (){
	for (var i = 0; i < graph.nodes.length; i++){
		var node = graph.nodes[i];
		node.type = "proteinAbundance";
		if (node.label.indexOf("exp") >= 0) node.type = "rnaAbundance";
		if (node.label.indexOf("kaof") >= 0) node.type = "kinaseActivity";
		if (node.label.indexOf("paof") >= 0) node.type = "phosphataseActivity";
		if (node.label.indexOf("sec") >= 0) node.type = "secretionActivity";
		if (node.label.indexOf("taof") >= 0) node.type = "transcriptionalActivity";
	}
};

function setEdgeTypes (){
	// translate old BEL relationship ids
	$.each(graph.relationships, function(index, rel){
		var r = rel.type;
		switch (r) {
			case "137": rel.type = 'decreases'; break;
			case "134": rel.type = 'increases'; break;
			case "334": rel.type = 'directlyIncreases'; break;
			case "337": rel.type = 'directlyDecreases'; break;
			case "79": rel.type = 'complexComponent'; break;
			case "176": rel.type = 'subprocessOf'; break;
			case "115": rel.type = 'geneProduct'; break;
			case "166": rel.type = 'actsIn'; break;
			case "177": rel.type = 'modificationOf'; break;
			case "150": rel.type = 'translocates'; break;
			case "142": rel.type = 'actsIn'; break;
			case "1636408": rel.type = 'mutationOf'; break;
			case "153": rel.type = 'translocatesTo'; break;
			case "152": rel.type = 'translocatesFrom'; break;

		}
	});

};

function setCameraPosition(){

};


TRIPTYCH.Node.prototype.onClick = function(event, role){
	if (this.selected){
		this.setSelected(false);
	} else {
		this.setSelected(true);
	}
	displayDetails(this);
};

//-------------------------------------
// Details 
//-------------------------------------

$("#details").hide();

var detailsDisplayed = false;

function displayDetails(node){
	if (!detailsDisplayed){

		$("#details").fadeIn(400);
		detailsDisplayed = true;
	}
	detail_node = node;
	
	$("#detailsContent").html("<p>" + node.label + "<ul>");
	
	$.each(node.literals, function (predicate, value){
		$("#detailsContent").append("<li>" + predicate + " : " + value + "</li>");
	});
	
	$("#detailsContent").append("</ul></p>");
	
}

function hideDetails(){
	$("#details").fadeOut(400);
	detailsDisplayed = false;
	detail_node = null;
}

$("#hide_details").on("click", function(event){
	hideDetails();
});

$("#expand").on("click", function(event){
	perturbationAnimation(detail_node);
	hideDetails();
});

function perturbationAnimation(node){
	var vantagePoint = new THREE.Vector3(node.position.x + 500, node.position.y + 500, node.position.z + 100);
	controls.flyToAndLookAt(vantagePoint, node.position, 5, 0.1);
	perturb(node, 1.0, 5);
};

function perturb(perturbedNode, val, max_steps){
	$.each(graph.nodes, function(index, node){
		node.values = null;
		node.animated = false;
		node.selected = false;
		node.perturbationStep = null;
	});
	$.each(graph.edges, function(index, edge){
		edge.animated = false;
	});
	visualizer.timeLoop.numberOfSteps = max_steps+2;
	perturbStep(perturbedNode, val, max_steps, 0);
};

function perturbStep(node, val, max_steps, index){
	if (index >= max_steps) return;
	if (node.values) return;
	node.values = new Array(max_steps + 2);
	node.animated = true;
	node.perturbationStep = index;
	for (var i = 0; i < max_steps + 2; i++){
		if (i < index + 1) {
			node.values[i] = 0;
		} else {
			node.values[i] = val;
		}
	}
	console.log(node.label + " " + node.perturbationStep +  " [ " + nodeValueString(node) + "]");
	//node.values[index] = val;
	$.each(node.getOutgoing(), function(i, edge){
		if (isCausal(edge)){
			edge.animated = true;
			if (isInverse(edge)){
				perturbStep(edge.to, -val, max_steps, index + 1);
			} else {
				perturbStep(edge.to, val, max_steps, index + 1);
			}
		}
	});
};

function nodeValueString(node){
	var string = "";
	$.each(node.values, function(i, v){
		string = string + v + " ";
	});
	return string;
};

function isCausal(edge){
	var type = edge.relationship.type;
	if (type == "increases") return true;
	if (type == "decreases") return true;
	if (type == "directlyIncreases") return true;
	if (type == "directlyDecreases") return true;
	if (type == "actsIn") return true;
	if (type == "geneProduct") return true;
	return false;
};

function isInverse(edge){
	var type = edge.relationship.type;
	if (type == "decreases") return true;
	if (type == "directlyDecreases") return true;
	return false;
};
	
//-------------------------------------
// Top Right Controls 
//-------------------------------------

function handleFlyMode(){
	if (controls.flyMode == true){
		controls.flyMode = false;
	} else {
		controls.flyDestinations = [new THREE.Vector3( 500, 500, 100 ),
							new THREE.Vector3( -500, 500, 100),
							new THREE.Vector3( -500, -500, 100 ),
							new THREE.Vector3( 500, -500, 100 )];
		controls.flyMode = true;
		controls.flySpeed = 5;
		controls.loiterSpeed = null;
	}
}

$("#fly").on("click", function(event){
	//console.log("fly!");
	handleFlyMode();
});

$("#zoom_in").mousedown(function(event){
	//console.log("zooming in");
	controls.zoom = -1;
});

$("#zoom_in").mouseleave(function(event){
	//console.log("stop zooming in");
	controls.zoom = 0;
});

$("#zoom_in").mouseup(function(event){
	//console.log("stop zooming in");
	controls.zoom = 0;
});

$("#zoom_out").mousedown(function(event){
	//console.log("zooming out");
	controls.zoom = 1;
});

$("#zoom_out").mouseleave(function(event){
	//console.log("stop zooming out");
	controls.zoom = 0;
});

$("#zoom_out").mouseup(function(event){
	console.log("stop zooming out");
	controls.zoom = 0;
});

function run(){
	$.ajax({
			type: "GET",
			url: sourceURL,
			dataType: "xml",
			success: function(data) {
				console.log("got data");
				
				loaderSetup();
				graph = loader.loadXGMML(data);
				belSetup();
				console.log("loaded graph");
				
				visualizerSetup();
				
				layoutEngineSetup();
				
				controlsSetup();

				space = new TRIPTYCH.Space(graph, visualizer, layoutEngine, controls);
				space.init();
				
				setCameraPosition();
				
				setFlyParameters();
				
				console.log("space initialized");
				animate();

			}
		});	
};
