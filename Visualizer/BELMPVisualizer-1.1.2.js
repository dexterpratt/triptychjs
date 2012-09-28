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

TRIPTYCH.BELMPVisualizer = function(){
	this.planeZ = {mouse : -200, human : 0, rat : 200};
	this.showLabels = false;
	this.showEdgeLabels = false;
};

TRIPTYCH.BELMPVisualizer.prototype = new TRIPTYCH.WebGLVisualizer();

TRIPTYCH.BELMPVisualizer.prototype.constructor = TRIPTYCH.BELMPVisualizer;

//-------------------------------------------------------
//
// Displayers
//
//-------------------------------------------------------

//------------------------------------------
// Node Displayers

TRIPTYCH.MPNodeDisplayer = function(){
	this.plainMaterialName = "defaultSurfaceMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.MPNodeDisplayer.prototype = {

	constructor : TRIPTYCH.MPNodeDisplayer,

	update : function(node){
		var displayer = this;
		$.each(node.planes, function(i, plane){
			displayer.updateMain(node, plane);
		});
		displayer.updateConnectors(node);
		$.each(node.planes, function(i, plane){
			displayer.updateLabel(node, plane);
		});
		$.each(node.planes, function(i, plane){
			displayer.updateAnimation(node, plane);
		});
	},
	
	updateMain : function(node, plane){
		if (!node.displayList.main) node.displayList.main = {};
		if (!node.displayList.main[plane]){
			node.displayList.main[plane] = this.makeMain(node);
			this.visualizer.addElement(node.displayList.main[plane], node, 'main');
		} 
		if (node.selected){
			this.select(node, plane);
		} else if (node.highlighted){
			this.highlight(node, plane);
		} else {
			this.plain(node, plane);
		}	
		node.displayList.main[plane].position.copy(node.position);
		node.displayList.main[plane].position.z = this.visualizer.planeZ[plane];
	},
	
	updateConnectors : function(node){
		// this is a temporary hack that assumes 3 planes
		if (!node.displayList.connectorUp){
			 node.displayList.connectorUp = this.makeConnector(node, 200);
			 this.visualizer.addElement(node.displayList.connectorUp, node, 'connectorUp');
		}
		if (!node.displayList.connectorDown) {
			node.displayList.connectorDown = this.makeConnector(node, -200);
			this.visualizer.addElement(node.displayList.connectorDown, node, 'connectorDown');
		}
		if (node.selected || node.highlighted){
			if (node.planes.lastIndexOf("rat") != -1){
				node.displayList.connectorUp.visible = true;
			}
			if (node.planes.lastIndexOf("mouse") != -1){
				node.displayList.connectorDown.visible = true;
			}
			this.positionConnector(node.displayList.connectorUp, node);
			this.positionConnector(node.displayList.connectorDown, node);
		} else {
			node.displayList.connectorUp.visible = false;
			node.displayList.connectorDown.visible = false;
		}
	},
	
	makeConnector : function(node, toZ){
		var toPos = node.position.clone();
		toPos.z = toZ;
		var connector = this.visualizer.makeDotted(this.visualizer.resources.smallParticleMaterial);
		connector.scale.z = toZ/this.visualizer.edgeReferenceLength;
		connector.position.z = 0;
		return connector;
	},
	
	positionConnector : function(connector, node){
		connector.position.x = node.position.x;
		connector.position.y = node.position.y;
	},
	
	updateLabel : function(node, plane){
		if (this.visualizer.showLabels || node.selected || node.highlighted){
			if (!node.displayList.label) node.displayList.label = {};
			if (!node.displayList.label[plane]) {
				node.displayList.label[plane] = this.makeLabel(node);
				this.visualizer.addElement(node.displayList.label[plane], node, 'label');
			}
			var lbl = node.displayList.label[plane];
			lbl.position.x = node.position.x + 20;
			lbl.position.y = node.position.y + 20;
			lbl.position.z = this.visualizer.planeZ[plane] + 10;
			lbl.visible = true

		} else if (node.displayList.label && node.displayList.label[plane]){
			node.displayList.label[plane].visible = false;
		}
	},
	
	updateAnimation : function(node, plane){
		if (node.animated){
			this.animate(node, plane);
		} else {
			this.stopAnimation(node, plane);
		}
	},
	
	makeMain : function(node, plane){
		var geometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
		return this.visualizer.makeMesh(node.position, this.getNodePlainMaterial(node, plane), geometry, 5);
	},
	
	makeLabel : function(node){
 		 return this.visualizer.makeTextSprite(node.label, 36, "white");
	},
	
	highlight : function(node, plane){
		node.displayList.main[plane].material = this.visualizer.resources[this.highlightMaterialName];
		
	},
	
	select : function(node, plane){
		node.displayList.main[plane].material = this.visualizer.resources[this.selectMaterialName];
		node.animated = true;
	},
	
	plain : function(node, plane){
		node.displayList.main[plane].material = this.getNodePlainMaterial(node, plane);
		node.animated = false;
	},
	
	getNodePlainMaterial : function(node, plane){
		if (plane == "human") return this.visualizer.resources.darkGreenMaterial;
		if (plane == "mouse") return this.visualizer.resources.darkRedMaterial;
		if (plane == "rat") return this.visualizer.resources.darkBlueMaterial;
		return this.visualizer.resources.greenMaterial;
	},
	
	animate : function(node, plane){
		var fraction = this.visualizer.timeLoop.stepFraction;
		var animationScale = 10;
		if (fraction < 0.1){
			animationScale = 1.0 + fraction * 100;
		} else if (fraction < 0.5) {
			animationScale = 20 - (fraction - 0.1) * 25;
		}
		var scale = node.displayList.main[plane].scale;
		scale.x = scale.y = scale.z = animationScale;	
		if (plane == "human"){
			if (fraction < 0.2){
				if (node.displayList.connectorUp){
					node.displayList.connectorUp.material = this.visualizer.resources.bigParticleMaterial;
				}
				if (node.displayList.connectorDown){
					node.displayList.connectorDown.material = this.visualizer.resources.bigParticleMaterial;
				} 
			} else {
				if (node.displayList.connectorUp){
					node.displayList.connectorUp.material = this.visualizer.resources.smallParticleMaterial;
				}
				if (node.displayList.connectorDown){
					node.displayList.connectorDown.material = this.visualizer.resources.smallParticleMaterial;
				} 
			}
		}
	},
	
	stopAnimation : function(node, plane){
		var scale = node.displayList.main[plane].scale;
		scale.x = scale.y = scale.z = 5;
		if (node.displayList.connectorUp){
			node.displayList.connectorUp.material = this.visualizer.resources.smallParticleMaterial;
		}
		if (node.displayList.connectorDown){
			node.displayList.connectorDown.material = this.visualizer.resources.smallParticleMaterial;
		} 
	}
	
};


TRIPTYCH.MPTFActivityNodeDisplayer = function(){
	this.plainMaterialName = "greenMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.MPTFActivityNodeDisplayer.prototype = new TRIPTYCH.MPNodeDisplayer();

TRIPTYCH.MPTFActivityNodeDisplayer.prototype.constructor = TRIPTYCH.MPTFActivityNodeDisplayer;


//------------------------------------------
// Edge Displayers

TRIPTYCH.MPEdgeDisplayer = function(){
	this.plainMaterialName = "defaultSurfaceMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.MPEdgeDisplayer.prototype = new TRIPTYCH.EdgeDisplayer();

// For the multiplane, the edge has display objects for each plane
TRIPTYCH.MPEdgeDisplayer.prototype = {

	constructor : TRIPTYCH.MPEdgeDisplayer,

	update : function(edge){
		var displayer = this;
		$.each(edge.planes, function(i, plane){
			displayer.updateMain(edge, plane);
		});
		$.each(edge.planes, function(i, plane){
			displayer.updateLabel(edge, plane);
		});
		$.each(edge.planes, function(i, plane){
			displayer.updateAnimation(edge, plane);
		});
	},

	updateMain : function(edge,plane){
		if (!edge.displayList.main) edge.displayList.main = {};
		if (!edge.displayList.main[plane]){
			edge.displayList.main[plane] = this.makeMain(edge, plane);
			this.visualizer.addElement(edge.displayList.main[plane], edge, 'main_' + plane);
		} 
		if (edge.to.selected && edge.from.selected){
			this.select(edge, plane);
		} else if (edge.to.highlighted || edge.from.highlighted){
			this.highlight(edge, plane);
		} else {
			this.plain(edge, plane);
		}
		this.positionMain(edge, plane);		
	},

	// Scale and rotate edge bar from midpoint
	positionMain : function(edge, plane){
			this.visualizer.scaleAndRotateEdge(edge, edge.displayList.main[plane], true);
			edge.displayList.main[plane].position.z = this.visualizer.planeZ[plane];
	},

/*	positionMain : function(edge, plane){
		var z = this.visualizer.planeZ[plane];
		var geometry = edge.displayList.main[plane].geometry;
		var fromVector3 = geometry.vertices[0];
		var toVector3 = geometry.vertices[1];
		fromVector3.set(edge.from.position.x,edge.from.position.y, z);
		toVector3.set(edge.to.position.x,edge.to.position.y, z);
		geometry.verticesNeedUpdate = true;
	},
*/
	
	updateLabel : function(edge, plane){
		if (this.visualizer.showEdgeLabels || edge.showEdgeLabel || edge.animated){
			if (!edge.displayList.label) edge.displayList.label = {};
			if (!edge.displayList.label[plane]) {
				edge.displayList.label[plane] = this.makeLabel(edge);
				this.visualizer.addElement(edge.displayList.label[plane], edge, 'label_' + plane);
			}
			var v = edge.getVector();
			var lbl = edge.displayList.label[plane];
			lbl.position = edge.from.position.clone().addSelf(v.multiplyScalar(0.5));
			lbl.position.z = this.visualizer.planeZ[plane] + 15;
			//lbl.matrix.lookAt( this.visualizer.camera.position, edge.displayList.label.position, this.visualizer.camera.up );
			lbl.visible = true;
		} else if (edge.displayList.label && edge.displayList.label[plane]){
			edge.displayList.label[plane].visible = false;
		}
	},
	
	updateAnimation : function(edge){
		if (edge.animated){
			this.animate(edge);
		} else {
			this.stopAnimation(edge);
		}
	},

	// edge is rendered as a rectangular bar
	makeMain : function(edge, plane){
		var mesh = new THREE.Mesh( this.visualizer.resources.barGeometry, this.getPlainMaterial(edge, plane));
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
		edge.animated = false;
		return mesh;
	},

/*
	makeMain : function(edge, plane){
		return this.visualizer.makeLine( edge.from.position, edge.to.position, this.visualizer.resources[this.plainMaterialName]);
	},
*/	
	makeLabel : function(edge){
		return this.visualizer.makeTextSprite(edge.relationship.type, 28, "yellow", null);
	},
	
	highlight : function(edge, plane){
		edge.displayList.main[plane].material = this.visualizer.resources[this.highlightMaterialName];
	},
	
	select : function(edge, plane){
		edge.animated = true;
		edge.displayList.main[plane].material = this.visualizer.resources[this.selectMaterialName];
	},
	
	plain : function(edge, plane){
		edge.animated = false;
		edge.displayList.main[plane].material = this.getPlainMaterial(edge, plane);
	},
	
	getPlainMaterial : function(edge, plane){
		if (plane == "human") return this.visualizer.resources.greenMaterial;
		if (plane == "mouse") return this.visualizer.resources.redMaterial;
		if (plane == "rat") return this.visualizer.resources.blueMaterial;
		return this.visualizer.resources.greenMaterial;
	},
		
	animate : function(edge, plane){
		
	},
	
	stopAnimation : function(edge, plane){
		
	}

};

//------------------------------------------
// Causal Edge

TRIPTYCH.MPCausalEdgeDisplayer = function(){
	this.plainMaterialName = "greenMaterial";
	this.selectMaterialName = "defaultSurfaceSelectedMaterial";
	this.highlightMaterialName = "defaultSurfaceHighlightedMaterial";
};

TRIPTYCH.MPCausalEdgeDisplayer.prototype = new TRIPTYCH.MPEdgeDisplayer();

TRIPTYCH.MPCausalEdgeDisplayer.prototype.constructor = TRIPTYCH.MPCausalEdgeDisplayer;


TRIPTYCH.MPCausalEdgeDisplayer.prototype.updateAnimation = function(edge, plane){
	if (edge.animated){
		if (!edge.displayList.slider) edge.displayList.slider = {};
		if (!edge.displayList.slider[plane]){
			edge.displayList.slider[plane] = this.visualizer.makeSlider(edge, edge.displayList.main[plane].material);
			this.visualizer.addElement(edge.displayList.slider[plane], edge, 'slider_' + plane);
		}
		// animation is processed after the main edge object, so we can just use the same material
		//edge.displayList.slider.material = edge.displayList.main.material;
		this.animate(edge, plane);
	} else {
		this.stopAnimation(edge, plane);
	}
};

// Animate by advancing slider based on main timeloop fraction
TRIPTYCH.MPCausalEdgeDisplayer.prototype.animate = function(edge, plane){
	edge.displayList.slider[plane].visible = true;
	var fraction = this.visualizer.timeLoop.stepFraction;
	if (fraction < 0.01) fraction = 0.01;
	var deltaX = (edge.to.position.x - edge.from.position.x) * fraction;
	var deltaY = (edge.to.position.y - edge.from.position.y) * fraction;
	var pos = edge.displayList.slider[plane].position;
	pos.x = edge.from.position.x + deltaX;
	pos.y = edge.from.position.y + deltaY;
	pos.z = this.visualizer.planeZ[plane];
};

TRIPTYCH.MPCausalEdgeDisplayer.prototype.stopAnimation = function(edge, plane){
	if (edge.displayList.slider && edge.displayList.slider[plane]) edge.displayList.slider[plane].visible = false;
};


//-------------------------------------------------------
//
// Init the displayers, associate them with node and relationship types
//
//-------------------------------------------------------

TRIPTYCH.BELMPVisualizer.prototype.initDefaultDisplayers = function(){
	this.defaultNodeDisplayer = new TRIPTYCH.MPNodeDisplayer();
	this.defaultNodeDisplayer.visualizer = this;
	this.defaultEdgeDisplayer = new TRIPTYCH.MPEdgeDisplayer();
	this.defaultEdgeDisplayer.visualizer = this;
	
};

TRIPTYCH.BELMPVisualizer.prototype.initDisplayers = function(){
	var ced = new TRIPTYCH.MPCausalEdgeDisplayer();
	
	this.addEdgeDisplayer("increases", ced);
	this.addEdgeDisplayer("decreases", ced);
	this.addEdgeDisplayer("directlyIncreases", ced);
	this.addEdgeDisplayer("directlyDecreases", ced);
	
	this.addEdgeDisplayer("INCREASES", ced);
	this.addEdgeDisplayer("DECREASES", ced);
	this.addEdgeDisplayer("DIRECTLY_INCREASES", ced);
	this.addEdgeDisplayer("DIRECTLY_DECREASES", ced);
	this.addEdgeDisplayer("ACTS_IN", ced);
	
	this.addNodeDisplayer("transcriptionalActivity", new TRIPTYCH.MPTFActivityNodeDisplayer());
	this.addNodeDisplayer("TRANSCRIPTIONAL_ACTIVITY", new TRIPTYCH.MPTFActivityNodeDisplayer());
};


//-------------------------------------------------------
//
// Resources
//
//-------------------------------------------------------


TRIPTYCH.BELMPVisualizer.prototype.initResources = function(){
	this.resources.greenMaterial = new THREE.MeshPhongMaterial( { color: 0x22ff22,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.redMaterial = new THREE.MeshPhongMaterial( { color: 0xff3311,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.blueMaterial = new THREE.MeshPhongMaterial( { color: 0x33ccff,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.darkGreenMaterial = new THREE.MeshPhongMaterial( { color: 0x009900,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.darkRedMaterial = new THREE.MeshPhongMaterial( { color: 0x991100,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.darkBlueMaterial = new THREE.MeshPhongMaterial( { color: 0x1133cc,  specular:0xbbaa99, shininess:50, shading: THREE.SmoothShading } );
	this.resources.transparentGreenMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00,  specular:0xbbaa99, shininess:50, opacity: 0.4, shading: THREE.SmoothShading } );

	this.resources.connectorLineMaterial = new THREE.LineBasicMaterial( { color: 0xFF33FF, opacity: 0.5 } );

	this.resources.barGeometry = new THREE.CubeGeometry( 2, 2, this.edgeReferenceLength );
	this.resources.smallSphereGeometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
/*
	var sparkMap = THREE.ImageUtils.loadTexture("../../../textures/sliderSpark.png");
	this.resources.sparkParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: sparkMap,
			size: 10,
			blending: THREE.AdditiveBlending,
			//vertexColors: true,
			transparent: true
		});
*/		
	this.resources.dottedGeometry = this.createDottedGeometry(20);

	this.resources.smallParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: this.resources.increaseMap,
			size: 6,
			transparent: true
		});
		
	this.resources.bigParticleMaterial = new THREE.ParticleBasicMaterial({
			color: 0xFFFFFF,
			map: this.resources.increaseMap,
			size: 12,
			transparent: true
		});
};

//-------------------------------------------------------
//
// Utilities
//
//-------------------------------------------------------


TRIPTYCH.BELMPVisualizer.prototype.makeSlider = function(edge, material){
	return this.makeMesh(edge.from.position, material, new THREE.SphereGeometry( 1, 0.32, 0.16 ), 6);
};

/*
TRIPTYCH.BELMPVisualizer.prototype.makeParticleSlider = function(edge){
	return this.makeParticleSphere(this.resources.sparkParticleMaterial);
};
*/

TRIPTYCH.BELMPVisualizer.prototype.makeDotted = function(material){
	var particles = new THREE.ParticleSystem( this.resources.dottedGeometry, material);
	particles.scale.x = particles.scale.y = particles.scale.z = 5;
	return particles;
};

/*
TRIPTYCH.BELMPVisualizer.prototype.makeParticleSphere = function(material){
	var particles = new THREE.ParticleSystem( this.resources.smallSphereGeometry, material);
	particles.scale.x = particles.scale.y = particles.scale.z = 2;
	return particles;
};
*/

TRIPTYCH.BELMPVisualizer.prototype.createDottedGeometry = function(numberOfDots){
	var geometry = new THREE.Geometry();
	var zSpacing = this.edgeReferenceLength / numberOfDots;
	var particleZ = 0;
	// create a line of particles in the z axis
	for(var p = 0; p < numberOfDots; p++) {
		
		var pVertex = new THREE.Vector3(0, 0, particleZ);
		
		// add it to the geometry
		geometry.vertices.push(pVertex);
		
		// increment particleZ
		particleZ += zSpacing;
	}
	return geometry;
};




