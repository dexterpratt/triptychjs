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

TRIPTYCH.BEL3DCanvasVisualizer = function(){
	this.displayValueBars = true;
};

TRIPTYCH.BEL3DCanvasVisualizer.prototype = new TRIPTYCH.CanvasVisualizer();

TRIPTYCH.BEL3DCanvasVisualizer.prototype.constructor = TRIPTYCH.BEL3DCanvasVisualizer;

//-------------------------------------------------------
//
// Displayers
//
//-------------------------------------------------------

TRIPTYCH.BEL3DCanvasNodeDisplayer = function(){
	this.plainMaterialName = "grayNodeMaterial";
};

TRIPTYCH.BEL3DCanvasNodeDisplayer.prototype = new TRIPTYCH.ParticleNodeDisplayer();

TRIPTYCH.BEL3DCanvasNodeDisplayer.prototype.constructor = TRIPTYCH.BEL3DCanvasNodeDisplayer;

TRIPTYCH.BEL3DCanvasNodeDisplayer.prototype.updateMain = function(node){
	if (!node.displayList.main){
		node.displayList.main = this.makeMain(node);
		this.visualizer.addElement(node.displayList.main, node, 'main');
	} 
	if (!node.displayList.particle){
			node.displayList.particle = this.makeParticle(node);
			this.visualizer.addElement(node.displayList.particle, node, 'particle');
	}
	if (!node.displayList.valueBar){
		node.displayList.valueBar = this.visualizer.makeValueBar(this.visualizer.resources[this.plainMaterialName]);
		this.visualizer.addElement(node.displayList.valueBar, node, 'valueBar');
	}
	var val = 0;
	if (node.perturbationStep != null && node.perturbationStep <= this.visualizer.timeLoop.step && node.values && node.values.length > 1){
		
		var firstIndex = this.visualizer.timeLoop.step;
		var delta;
		if (firstIndex == node.values.length -1){
			delta = node.values[0] - node.values[firstIndex];
		} else {
			delta = node.values[firstIndex + 1] - node.values[firstIndex];
		}
		val = node.values[firstIndex] + delta * this.visualizer.timeLoop.stepFraction;
		if (val > 0){		
			node.displayList.particle.material = this.visualizer.resources.redNodeMaterial;
		} else {
			node.displayList.particle.material = this.visualizer.resources.greenNodeMaterial;
		}		
	} else if (node.selected || node.perturbationStep != null){ 
		this.select(node);
	} else if (node.highlighted){
		this.highlight(node);
	} else {
		this.plain(node);
	}
	if (this.visualizer.displayValueBars && val && val != 0){
		node.displayList.valueBar.visible = true;
		node.displayList.valueBar.position.copy(node.position);
		var scale = Math.abs(val);
		node.displayList.valueBar.scale.z = scale;
		var barLength = scale * this.visualizer.edgeReferenceLength;
		if (val > 0){
			node.displayList.valueBar.position.z = node.position.z +  14;
			node.displayList.valueBar.material = this.visualizer.resources.redMeshMaterial;
		} else {
			node.displayList.valueBar.position.z = node.position.z - (14 + barLength);
			node.displayList.valueBar.material = this.visualizer.resources.greenMeshMaterial;
		}
	} else {
		node.displayList.valueBar.visible = false;
	}		
	node.displayList.main.position.copy(node.position);
	node.displayList.particle.position.copy(node.position);
};

TRIPTYCH.BEL3DCanvasNodeDisplayer.prototype.updateLabel = function(node){
	if (this.visualizer.showLabels == true || node.selected || node.highlighted || node.perturbationStep != null){
		if (!node.displayList.label) {
			node.displayList.label = this.makeLabel(node);
			this.visualizer.addElement(node.displayList.label, node, 'label');
		}
		
		// 1. start by adding a scaled clone of the camera up
		// 2. add a vector from that position to the camera
		var pos = node.displayList.label.position;
		pos.copy(node.position);
		pos.addSelf(this.visualizer.camera.up.clone().multiplyScalar(20));
		var vectorToCamera = this.visualizer.camera.position.clone().subSelf( pos );
		
		pos.addSelf(vectorToCamera.normalize().multiplyScalar(20));
		
		node.displayList.label.visible = true;
		
	} else if (node.displayList.label){
		node.displayList.label.visible = false;
	}
};

TRIPTYCH.BEL3DCanvasNodeDisplayer.prototype.stopAnimation = function(node){
	node.valueIndex = 0;
};


//------------------------------------------
// Causal Edge

TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer = function(){
	this.plainMaterialName = "grayMeshMaterial";
	this.selectMaterialName = "purpleMeshMaterial";
	this.highlightMaterialName = "defaultHighlightedMeshMaterial";
	
	this.edgeGeometryName = "thinArrowGeometry";
};

TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer.prototype = new TRIPTYCH.ShapeEdgeDisplayer();

TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer.prototype.constructor = TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer;


TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer.prototype.updateAnimation = function(edge){
	if (edge.animated && edge.from.perturbationStep != null){
		if (edge.from.perturbationStep <= this.visualizer.timeLoop.step){
			this.select(edge);
		} else {
			this.plain(edge);
		}
		if (edge.from.perturbationStep == this.visualizer.timeLoop.step){
			if (!edge.displayList.slider){
				edge.displayList.slider = this.visualizer.makeSlider(edge, this.visualizer.resources.yellowNodeMaterial);
				this.visualizer.addElement(edge.displayList.slider, edge, 'slider');
			}
			this.animate(edge);

		} else {
			this.stopAnimation(edge);
		}
	} else {
		this.stopAnimation(edge);
	}
};

// Animate by advancing slider based on main timeloop fraction
TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer.prototype.animate = function(edge){
	edge.displayList.slider.visible = true;
	
	var fraction = this.visualizer.timeLoop.stepFraction;
	var v = edge.getVector();
	edge.displayList.slider.position = edge.from.position.clone().addSelf(v.multiplyScalar(fraction));	
};

TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer.prototype.stopAnimation = function(edge){
	if (edge.displayList.slider) edge.displayList.slider.visible = false;
	
};

TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer = function(){
	this.plainMaterialName = "grayMeshMaterial";
	this.selectMaterialName = "defaultSelectedMeshMaterial";
	this.highlightMaterialName = "defaultHighlightedMeshMaterial";
	
	this.edgeGeometryName = "tArrowGeometry";
};

TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer.prototype = new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer();

TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer.prototype.constructor = TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer;


//------------------------------------------
// Non-Causal Edge

TRIPTYCH.BEL3DCanvasNonCausalEdgeDisplayer = function(){
	this.plainMaterialName = "grayLineMaterial";
	this.selectMaterialName = "defaultLineSelectedMaterial";
	this.highlightMaterialName = "defaultLineHighlightedMaterial";
};

TRIPTYCH.BEL3DCanvasNonCausalEdgeDisplayer.prototype = new TRIPTYCH.LineEdgeDisplayer();

TRIPTYCH.BEL3DCanvasNonCausalEdgeDisplayer.prototype.constructor = TRIPTYCH.BEL3DCanvasNonCausalEdgeDisplayer;

//-------------------------------------------------------
//
// Init the displayers, associate them with node and relationship types
//
//-------------------------------------------------------

TRIPTYCH.BEL3DCanvasVisualizer.prototype.initDefaultDisplayers = function(){
	this.defaultNodeDisplayer = new TRIPTYCH.BEL3DCanvasNodeDisplayer();
	this.defaultNodeDisplayer.visualizer = this;
	this.defaultEdgeDisplayer = new TRIPTYCH.BEL3DCanvasNonCausalEdgeDisplayer();
	this.defaultEdgeDisplayer.visualizer = this;
	
};

TRIPTYCH.BEL3DCanvasVisualizer.prototype.initDisplayers = function(){
	
	this.addEdgeDisplayer("increases", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("decreases", new TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("directlyIncreases", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("geneProduct", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("actsIn", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("directlyDecreases", new TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer());
	
	this.addEdgeDisplayer("INCREASES", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("DECREASES", new TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("DIRECTLY_INCREASES", new TRIPTYCH.BEL3DCanvasCausalEdgeDisplayer());
	this.addEdgeDisplayer("DIRECTLY_DECREASES", new TRIPTYCH.InverseBEL3DCanvasCausalEdgeDisplayer());
	
};

//-------------------------------------------------------
//
// Resources
//
//-------------------------------------------------------


TRIPTYCH.BEL3DCanvasVisualizer.prototype.initResources = function(){

	this.resources.blueMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x00ffff } ) ;
	this.resources.greenMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ;
	this.resources.redMeshMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } ) ;
	this.resources.grayMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x777788 } ) ;
	this.resources.purpleMeshMaterial = new THREE.MeshBasicMaterial( { color: 0xff00ff } ) ;

	this.resources.blueNodeMaterial = this.makeCircleParticleMaterial(100, '#00ffff');
	this.resources.greenNodeMaterial = this.makeCircleParticleMaterial(100, '#00ff00');
	this.resources.redNodeMaterial = this.makeCircleParticleMaterial(100, '#ff0000');
	this.resources.yellowNodeMaterial = this.makeCircleParticleMaterial(100, '#ffff00');

	this.resources.grayNodeMaterial = this.makeCircleParticleMaterial(100, '#777788');
	this.resources.purpleNodeMaterial = this.makeCircleParticleMaterial(100, '#FF00FF');

	this.resources.connectorLineMaterial = new THREE.LineBasicMaterial( { color: 0xFFFFFF, opacity: 0.5 } );
	this.resources.grayLineMaterial = new THREE.LineBasicMaterial( { color: 0x777788 } );

	
	this.resources.smallParticleMaterial = this.makeCircleParticleMaterial(6, '#FFFFFF');
	this.resources.bigParticleMaterial = this.makeCircleParticleMaterial(12, '#FFFFFF');
	
	this.resources.thinArrowGeometry = new TRIPTYCH.ThinArrowGeometry(this.edgeReferenceLength);

	this.resources.tArrowGeometry = new TRIPTYCH.ThinArrowGeometry(this.edgeReferenceLength);

	this.resources.barGeometry = new TRIPTYCH.BarGeometry(this.edgeReferenceLength);

};

//-------------------------------------------------------
//
// Utilities
//
//-------------------------------------------------------


TRIPTYCH.BEL3DCanvasVisualizer.prototype.makeSlider = function(edge, material){
	var particle = new THREE.Particle( material );
	particle.scale.set(0.15, 0.15);
	particle.visible = true;
	return particle;
};


TRIPTYCH.BEL3DCanvasVisualizer.prototype.makeValueBar = function(material){
	return this.makeShape( this.resources.barGeometry, material);
}