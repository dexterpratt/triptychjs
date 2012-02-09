TRIPTYCH.TextVisualizer = function(){

};

TRIPTYCH.TextVisualizer.prototype = new TRIPTYCH.BasicVisualizer();

TRIPTYCH.TextVisualizer.prototype.constructor = TRIPTYCH.TextVisualizer;

TRIPTYCH.TextVisualizer.prototype.updateNode = function(node){
	var nodeObject = node.displayList.main;
	if (nodeObject == null){
		this.makeNodeObject(node);
	} else {
		if (node.needsUpdate){
			if (node.selected){
				nodeObject.color = 0xffff00;
			} else if (node.highlighted){
				nodeObject.color = 0x00ffff;
			} else {
				nodeObject.color = 0xffffff;
			}
		}
				
		nodeObject.position.copy(node.position);
		nodeObject.matrix.lookAt( this.camera.position, nodeObject.position, this.camera.up );
		node.needsUpdate = false;
	}

};

TRIPTYCH.TextVisualizer.prototype.makeNodeObject = function(node){
 	var text = node.label;
 	
 	var textObject = this.makeTextSprite(text, 36, "white");
 	
 	textObject.position.copy(node.position);
	
	textObject.matrix.lookAt( this.camera.position, textObject.position, this.camera.up );
	
	this.scene.add( textObject );
	node.displayList.main = textObject;
	this.mapDisplayObjectToElement( textObject, node, "main");

	return textObject;
};



