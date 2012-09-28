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


TRIPTYCH.SECVisualizer = function(){
		this.showEdgeLabels = false;
		this.showLabels = true;
};

TRIPTYCH.SECVisualizer.prototype = new TRIPTYCH.WebGLVisualizer();

TRIPTYCH.SECVisualizer.prototype.constructor = TRIPTYCH.SECVisualizer;

//-------------------------------------------------------
//
// Displayers
//
//-------------------------------------------------------

//
// SEC nodes are displayed as sprites
// 
// They also show their labels when selected or highlighted, but not
// otherwise, unless ShowLabels is enabled for the visualizer
//
TRIPTYCH.SECNodeDisplayer = function(){

};

TRIPTYCH.SECNodeDisplayer.prototype = new TRIPTYCH.SpriteNodeDisplayer();

TRIPTYCH.SECNodeDisplayer.prototype.constructor = TRIPTYCH.SECNodeDisplayer;

TRIPTYCH.SECNodeDisplayer.prototype.update = function(node){
		this.updateMain(node);
		//if(node.selected || node.highlighted) this.updateLabel(node);
		//this.updateLabel(node);
		this.updateAnimation(node);
};

TRIPTYCH.SECNodeDisplayer.prototype.highlight = function(node){
		TRIPTYCH.SpriteNodeDisplayer.prototype.highlight.call(this, node);
		this.updateLabel(node);
};
	
TRIPTYCH.SECNodeDisplayer.prototype.select = function(node){
		TRIPTYCH.SpriteNodeDisplayer.prototype.select.call(this, node);
		this.updateLabel(node);
};

TRIPTYCH.SECNodeDisplayer.prototype.plain = function(node){
		TRIPTYCH.SpriteNodeDisplayer.prototype.plain.call(this, node);
		if (node.displayList.label) node.displayList.label.visible = false;
};


//
// Person Nodes - specialization of SEC nodes with person icons
//
TRIPTYCH.SECPersonNodeDisplayer = function(){
	this.plainMapName = "personIcon";
	this.selectMapName = "personIconSelected";
	this.highlightMapName = "personIconHighlighted";
};

TRIPTYCH.SECPersonNodeDisplayer.prototype = new TRIPTYCH.SECNodeDisplayer();

TRIPTYCH.SECPersonNodeDisplayer.prototype.constructor = TRIPTYCH.SECPersonNodeDisplayer;

//
// Company Nodes
//
TRIPTYCH.SECCompanyNodeDisplayer = function(){
	this.plainMapName = "companyIcon";
	this.selectMapName = "companyIconSelected";
	this.highlightMapName = "companyIconHighlighted";
};

TRIPTYCH.SECCompanyNodeDisplayer.prototype = new TRIPTYCH.SECNodeDisplayer();

TRIPTYCH.SECCompanyNodeDisplayer.prototype.constructor = TRIPTYCH.SECCompanyNodeDisplayer;

//
// SEC Edges
//
TRIPTYCH.SECEdgeDisplayer = function(){
	this.plainMaterialName = "greenSurfaceMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.SECEdgeDisplayer.prototype = new TRIPTYCH.WebGLEdgeDisplayer();

TRIPTYCH.SECEdgeDisplayer.prototype.constructor = TRIPTYCH.SECEdgeDisplayer;

// edge is rendered as a rectangular bar
TRIPTYCH.SECEdgeDisplayer.prototype.makeMain = function(edge){
	var geometry = new THREE.CubeGeometry( 1.5, 1.5, this.visualizer.edgeReferenceLength * 0.9 );
	var mesh = new THREE.Mesh( geometry, this.visualizer.resources[this.plainMaterialName]);
	mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
	//edge.animated = true;
	return mesh;
};

// Scale and rotate edge bar from midpoint
TRIPTYCH.SECEdgeDisplayer.prototype.positionMain = function(edge){
	this.visualizer.scaleAndRotateEdge(edge, edge.displayList.main, true);
};

TRIPTYCH.SECEdgeDisplayer.prototype.updateAnimation = function(edge){
	if (edge.animated){
		if (!edge.displayList.slider){
			edge.displayList.slider = this.visualizer.makeSlider(edge, edge.displayList.main.material);
			this.visualizer.addElement(edge.displayList.slider, edge, 'slider');
		}
		// animation is processed after the main edge object, so we can just use the same material
		//edge.displayList.slider.material = edge.displayList.main.material;
		this.animate(edge);
	} else {
		this.stopAnimation(edge);
	}
};

// Animate by advancing slider based on main timeloop fraction
TRIPTYCH.SECEdgeDisplayer.prototype.animate = function(edge){
	edge.displayList.slider.visible = true;
	var fraction = this.visualizer.timeLoop.fraction;
	var v = edge.getVector();
	edge.displayList.slider.position = edge.from.position.clone().addSelf(v.multiplyScalar(fraction));	
};

TRIPTYCH.SECEdgeDisplayer.prototype.stopAnimation = function(edge){
	if (edge.displayList.slider) edge.displayList.slider.visible = false;
};


//-------------------------------------------------------
//
// Init the displayers, associate them with node and relationship types
//
//-------------------------------------------------------

TRIPTYCH.SECVisualizer.prototype.initDisplayers = function(){
	this.addNodeDisplayer("person", new TRIPTYCH.SECPersonNodeDisplayer());
	this.addNodeDisplayer("company", new TRIPTYCH.SECCompanyNodeDisplayer());
	this.addEdgeDisplayer("hasPerson", new TRIPTYCH.SECEdgeDisplayer());
};


//-------------------------------------------------------
//
// Resources
//
//-------------------------------------------------------


TRIPTYCH.SECVisualizer.prototype.initResources = function(){
	this.resources.greenSurfaceMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
};

//-------------------------------------------------------
//
// Utilities
//
//-------------------------------------------------------


TRIPTYCH.SECVisualizer.prototype.makeSlider = function(edge, material){
	var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
	return this.makeMesh(edge.from.position, material, geometry, 6);
};





