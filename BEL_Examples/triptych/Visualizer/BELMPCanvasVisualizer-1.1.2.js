/*
	Copyright 2012 Dexter Pratt
	
	This file is proprietary to Dexter Pratt and is not covered under any public license
	
*/

TRIPTYCH.BELMPCanvasVisualizer = function(){
	this.planeZ = {mouse : -200, human : 0, rat : 200};
	this.showLabels = false;
	this.showEdgeLabels = false;
};

TRIPTYCH.BELMPCanvasVisualizer.prototype = new TRIPTYCH.CanvasVisualizer();

TRIPTYCH.BELMPCanvasVisualizer.prototype.constructor = TRIPTYCH.BELMPCanvasVisualizer;




//-------------------------------------------------------
//
// Displayers
//
//-------------------------------------------------------

//------------------------------------------
// Node Displayers

TRIPTYCH.MPNodeDisplayer = function(){
	this.plainMaterialName = "defaultNodeParticleMaterial";
	this.selectMaterialName = "defaultNodeSelectedParticleMaterial";
	this.highlightMaterialName = "defaultNodeHighlightedParticleMaterial";
	
	this.plainColor = 0xff0000;
	this.selectColor = 0xffff00;
	this.highlightColor = 0x00ffff;
	this.PI2 = Math.PI * 2;
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
		if (!node.displayList.particle) node.displayList.particle = {};
		if (!node.displayList.particle[plane]){
			node.displayList.particle[plane] = this.makeParticle(node);
			this.visualizer.addElement(node.displayList.particle[plane], node, 'particle');
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
		
		node.displayList.particle[plane].position.copy(node.position);
		node.displayList.particle[plane].position.z = this.visualizer.planeZ[plane];
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
		var connector = this.visualizer.makeLine(node.position, toPos, this.visualizer.resources.connectorLineMaterial);
		//connector.scale.z = toZ/this.visualizer.edgeReferenceLength;
		//connector.position.z = 0;
		return connector;
	},
	
	positionConnector : function(connector, node){
		var g = connector.geometry;
		g.vertices[0].x = node.position.x;
		g.vertices[1].x = node.position.x;
		g.vertices[0].y = node.position.y;
		g.vertices[1].y = node.position.y;
		g.verticesNeedUpdate = true;
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

	makeParticle : function(node, plane){
		var material = this.getNodePlainMaterial(node, plane);
		var particle = new THREE.Particle( material );
		particle.scale.set(0.1, 0.1);
		particle.visible = true;
		return particle;
	},
	
	programFill : function(context){
		
		context.beginPath();
		context.arc( 0, 0, 1, 0, this.PI2, true );
		context.closePath();
		context.fill();
	},

	makeMain : function(node, plane){
		var particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( { color: 0xffffff, program: this.programFill } ) );
		particle.scale.set(10, 10);
		particle.visible = true;
		return particle;
	},
	
	makeLabel : function(node){
 		 return this.visualizer.makeTextParticle(node.label, 18, "white");
	},
	
	highlight : function(node, plane){
		node.displayList.particle[plane].material = this.visualizer.resources[this.highlightMaterialName];		
	},
	
	select : function(node, plane){
		node.displayList.particle[plane].material = this.visualizer.resources[this.selectMaterialName];
		node.animated = true;
	},
	
	plain : function(node, plane){
		node.displayList.particle[plane].material = this.getNodePlainMaterial(node, plane);
		node.animated = false;
	},
	
	getNodePlainMaterial : function(node, plane){
		if (plane == "human") return this.visualizer.resources.darkGreenNodeMaterial;
		if (plane == "mouse") return this.visualizer.resources.darkRedNodeMaterial;
		if (plane == "rat") return this.visualizer.resources.darkBlueNodeMaterial;
		return this.visualizer.resources.greenMaterial;
	},
	
	animate : function(node, plane){
		var fraction = this.visualizer.timeLoop.stepFraction;
		var animationScale = 0.1;
		if (fraction < 0.1){
			animationScale = 0.1 + fraction;
		} else if (fraction < 0.5) {
			animationScale = 0.2 - ((fraction - 0.1) * 0.25);
		}
		var scale = node.displayList.particle[plane].scale;
		scale.x = scale.y = scale.z = animationScale;	
		if (plane == "human"){
			if (fraction < 0.2){
				if (node.displayList.connectorUp){
					node.displayList.connectorUp.material.opacity = 1;
					node.displayList.connectorUp.material.linewidth = 10;
					//node.displayList.connectorUp.material = this.visualizer.resources.bigParticleMaterial;
				}
				if (node.displayList.connectorDown){
					node.displayList.connectorDown.material.opacity = 1;
					node.displayList.connectorDown.material.linewidth = 10;
					//node.displayList.connectorDown.material = this.visualizer.resources.bigParticleMaterial;
				} 
			} else {
				if (node.displayList.connectorUp){
					node.displayList.connectorUp.material.opacity = 0.5;
					node.displayList.connectorUp.material.linewidth = 1;
					//node.displayList.connectorUp.material = this.visualizer.resources.smallParticleMaterial;
				}
				if (node.displayList.connectorDown){
					node.displayList.connectorDown.material.opacity = 0.5;
					node.displayList.connectorDown.material.linewidth = 1;
					//node.displayList.connectorDown.material = this.visualizer.resources.smallParticleMaterial;
				} 
			}
		}
	},
	
	stopAnimation : function(node, plane){
		var scale = node.displayList.main[plane].scale;
		scale.x = scale.y = scale.z = 5;
		if (node.displayList.connectorUp){
			node.displayList.connectorUp.material.opacity = 0.5;
			//node.displayList.connectorUp.material = this.visualizer.resources.smallParticleMaterial;
		}
		if (node.displayList.connectorDown){
			node.displayList.connectorDown.material.opacity = 0.5;
			//node.displayList.connectorDown.material = this.visualizer.resources.smallParticleMaterial;
		} 
	}
	
};


TRIPTYCH.MPTFActivityNodeDisplayer = function(){

};

TRIPTYCH.MPTFActivityNodeDisplayer.prototype = new TRIPTYCH.MPNodeDisplayer();

TRIPTYCH.MPTFActivityNodeDisplayer.prototype.constructor = TRIPTYCH.MPTFActivityNodeDisplayer;


//------------------------------------------
// Edge Displayers

TRIPTYCH.MPEdgeDisplayer = function(){
	this.plainMaterialName = "defaultMeshMaterial";
	this.selectMaterialName = "defaultSelectedMeshMaterial";
	this.highlightMaterialName = "defaultHighlightedMeshMaterial";
	
	this.edgeGeometryName = "thinArrowGeometry";
};

TRIPTYCH.MPEdgeDisplayer.prototype = new TRIPTYCH.ShapeEdgeDisplayer();

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
			this.visualizer.scaleAndRotateEdge(edge, edge.displayList.main[plane], false);
			edge.displayList.main[plane].position.z = this.visualizer.planeZ[plane];
	},
	
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
	
	updateAnimation : function(edge, plane){
		if (edge.animated){
			this.animate(edge, plane);
		} else {
			this.stopAnimation(edge, plane);
		}
	},

	// edge is rendered as an arrow
	makeMain : function(edge, plane){
		var shape = this.visualizer.makeShape( this.visualizer.resources[this.edgeGeometryName], this.getPlainMaterial(edge, plane));
		edge.animated = false;
		return shape;
	},

	makeLabel : function(edge){
		return this.visualizer.makeTextParticle(edge.relationship.type, 14, "yellow", null);
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
		if (plane == "human") return this.visualizer.resources.greenMeshMaterial;
		if (plane == "mouse") return this.visualizer.resources.redMeshMaterial;
		if (plane == "rat") return this.visualizer.resources.blueMeshMaterial;
		return this.visualizer.resources.greenMeshMaterial;
	},
		
	animate : function(edge, plane){
		
	},
	
	stopAnimation : function(edge, plane){
		
	}

};

//------------------------------------------
// Causal Edge

TRIPTYCH.MPCausalEdgeDisplayer = function(){

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

TRIPTYCH.BELMPCanvasVisualizer.prototype.initDefaultDisplayers = function(){
	this.defaultNodeDisplayer = new TRIPTYCH.MPNodeDisplayer();
	this.defaultNodeDisplayer.visualizer = this;
	this.defaultEdgeDisplayer = new TRIPTYCH.MPEdgeDisplayer();
	this.defaultEdgeDisplayer.visualizer = this;	
};

TRIPTYCH.BELMPCanvasVisualizer.prototype.initDisplayers = function(){
	var ced = new TRIPTYCH.MPEdgeDisplayer();
	
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


TRIPTYCH.BELMPCanvasVisualizer.prototype.initResources = function(){

	this.resources.blueMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x0099ff } ) ;
	this.resources.greenMeshMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff66 } ) ;
	this.resources.redMeshMaterial = new THREE.MeshBasicMaterial( { color: 0xff6600 } ) ;

	this.resources.darkBlueNodeMaterial = this.makeCircleParticleMaterial(100, '#22ffff');
	this.resources.darkGreenNodeMaterial = this.makeCircleParticleMaterial(100, '#00ff44');
	this.resources.darkRedNodeMaterial = this.makeCircleParticleMaterial(100, '#ff6600');

	this.resources.connectorLineMaterial = new THREE.LineBasicMaterial( { color: 0xFFFFFF, opacity: 0.5 } );

	this.resources.smallSphereGeometry = new THREE.SphereGeometry( 1, 0.32, 0.16 );
	
	this.resources.dottedGeometry = this.createDottedGeometry(20);
	
	this.resources.smallParticleMaterial = this.makeCircleParticleMaterial(6, '#FFFFFF');
	this.resources.bigParticleMaterial = this.makeCircleParticleMaterial(12, '#FFFFFF');
	
	this.resources.thinArrowGeometry = new TRIPTYCH.ThinArrowGeometry(this.edgeReferenceLength);


/*
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
*/
};

//-------------------------------------------------------
//
// Utilities
//
//-------------------------------------------------------


TRIPTYCH.BELMPCanvasVisualizer.prototype.makeSlider = function(edge, material){
	var particle = new THREE.Particle( material );
	particle.scale.set(0.05, 0.05);
	particle.visible = true;
	return particle;
};

TRIPTYCH.BELMPCanvasVisualizer.prototype.makeDotted = function(material){
	var particles = new THREE.ParticleSystem( this.resources.dottedGeometry, material);
	particles.scale.x = particles.scale.y = particles.scale.z = 5;
	return particles;
};

TRIPTYCH.BELMPCanvasVisualizer.prototype.createDottedGeometry = function(numberOfDots){
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






