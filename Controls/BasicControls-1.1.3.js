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

Thanks to Eberhard Graether / http://egraether.com/ for TrackballControls.js 
which served as the starting point for the Basic Triptych controls

Controls Behavior:
 
Mouse move:
 
 	if mouse is down, we are dragging
 	
 		Default is that we are dragging to rotate the viewpoint
 		
 		(TODO) if control or command is down, we are dragging on the intersected node, if any
 		
 	if mouse is up, we update the state of the top intersected display object mapping to a node
 	
 		* intersectionStart and intersectionEnd methods are called for the mapped node
 		(with the event and the display object role)
 		
Mouse down:
  
Mouse up:

	if there is an top intersected display object mapping to a node, 
	call the mouseUp method for the mapped node with the event and the display object role
 
 
 */

TRIPTYCH.BasicControls = function ( camera, domElement, visualizer ) {

	var _this = this,
	MOUSEBUTTON = { NONE : -1, LEFT : 0, CENTER : 1, RIGHT : 2 };

	// API

	this.enabled = true;

	this.screen = { width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0 };
	this.radius = ( this.screen.width + this.screen.height ) / 4;

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.05;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;
	
	this.flyMode = false;
	this.flySpeed = 5;
	this.loiterSpeed = null;
	this.flyDestinations = [new THREE.Vector3( 500, 500, 500 ),
							new THREE.Vector3( -500, -500, 500 ),
							new THREE.Vector3( -500, -500, 100 ),
							new THREE.Vector3( 500, 500, 100 )];
	this.flyIndex = 0;
	this.initialFlight = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;
	
	this.mouse = { x: 0, y: 0 };
	this.mouseButtonState = MOUSEBUTTON.NONE;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];
	
	this.zoom = 0;

	// internals

	this.target = new THREE.Vector3( 0, 0, 0 );

	var _keyPressed = false,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();
	


	// methods
	
	this.init = function ( visualizer ) {
		this.visualizer = visualizer;
		this.camera = visualizer.camera;
		// when is this not the document?
		this.domElement = document;
		
		this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

		//this.domElement.addEventListener( 'mousemove', mousemove, false );
		//this.domElement.addEventListener( 'mousedown', mousedown, false );
		//this.domElement.addEventListener( 'mouseup', mouseup, false );
		$(document).mousemove(mousemove);
		$(document).mousedown(mousedown);
		$(document).mouseup(mouseup);
		
		$(document).bind("touchmove", function(e) {  
		  //Disable scrolling by preventing default touch behaviour  
		  e.preventDefault();  
		  var orig = e.originalEvent;  
		  var x = orig.changedTouches[0].clientX;  
		  var y = orig.changedTouches[0].clientY;  
		  _this.mouse.x = ( x / window.innerWidth ) * 2 - 1;
		  _this.mouse.y = - ( y / window.innerHeight ) * 2 + 1;
		  _rotateEnd = _this.getMouseProjectionOnBall( x, y );
		});  
		
		$(document).bind("touchend", function(e) {  
		  //Disable scrolling by preventing default touch behaviour  
		  e.preventDefault();  
		  mouseupinternal(); 
		}); 
		
		$(document).bind("touchstart", function(e) {  
		  //Disable scrolling by preventing default touch behaviour  
		  e.preventDefault();  
		  var orig = e.originalEvent;
		  _this.flyMode = false;
		   
		  var x = orig.changedTouches[0].clientX;  
		  var y = orig.changedTouches[0].clientY; 
		  _this.mouse.x = ( x / window.innerWidth ) * 2 - 1;
		  _this.mouse.y = - ( y / window.innerHeight ) * 2 + 1;
		  updateIntersectedElements()	
		  _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( x, y );	   
		});  
		
		//window.addEventListener( 'keydown', keydown, false );
		//window.addEventListener( 'keyup', keyup, false );
	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	this.getMouseOnScreen = function( clientX, clientY ) {

		return new THREE.Vector2(
			( clientX - _this.screen.offsetLeft ) / _this.radius * 0.5,
			( clientY - _this.screen.offsetTop ) / _this.radius * 0.5
		);

	};

	this.getMouseProjectionOnBall = function( clientX, clientY ) {

		var mouseOnBall = new THREE.Vector3(
			( clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft ) / _this.radius,
			( _this.screen.height * 0.5 + _this.screen.offsetTop - clientY ) / _this.radius,
			0.0
		);

		var length = mouseOnBall.length();

		if ( length > 1.0 ) {

			mouseOnBall.normalize();

		} else {

			mouseOnBall.z = Math.sqrt( 1.0 - length * length );

		}

		_eye.copy( _this.camera.position ).subSelf( _this.target );

		var projection = _this.camera.up.clone().setLength( mouseOnBall.y );
		projection.addSelf( _this.camera.up.clone().crossSelf( _eye ).setLength( mouseOnBall.x ) );
		projection.addSelf( _eye.setLength( mouseOnBall.z ) );

		return projection;

	};

	// operates on _rotateStart and _rotateEnd
	this.rotateCamera = function() {

		var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

		if ( angle ) {

			var axis = ( new THREE.Vector3() ).cross( _rotateStart, _rotateEnd ).normalize(),
				quaternion = new THREE.Quaternion();

			angle *= _this.rotateSpeed;

			quaternion.setFromAxisAngle( axis, -angle );

			quaternion.multiplyVector3( _eye );
			quaternion.multiplyVector3( _this.camera.up );

			quaternion.multiplyVector3( _rotateEnd );

			if ( _this.staticMoving ) {

				_rotateStart = _rotateEnd;

			} else {

				quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
				quaternion.multiplyVector3( _rotateStart );

			}

		}

	};

	this.zoomCamera = function() {

		if (_this.zoom == 0) return;
		
		var factor =  _this.zoom * _this.zoomSpeed;	
		
		if (_this.zoom > 0){
			factor = _this.zoomSpeed;
		} else {
			factor = 1 / _this.zoomSpeed;
		}

		_eye.multiplyScalar( factor );

	};

	this.panCamera = function() {

		var mouseChange = _panEnd.clone().subSelf( _panStart );

		if ( mouseChange.lengthSq() ) {

			mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

			var pan = _eye.clone().crossSelf( _this.camera.up ).setLength( mouseChange.x );
			pan.addSelf( _this.camera.up.clone().setLength( mouseChange.y ) );

			_this.camera.position.addSelf( pan );
			_this.target.addSelf( pan );

			if ( _this.staticMoving ) {

				_panStart = _panEnd;

			} else {

				_panStart.addSelf( mouseChange.sub( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

			}

		}

	};
	
	this.flyCamera = function() {
		if (_this.flyMode == true){
			var speed = _this.flySpeed;
			if (_this.loiterSpeed != null && _this.initialFlight == false) speed = _this.loiterSpeed;
			// check to see if we are within 1/2 of the destination
			var flyVector = _this.getVector(_this.flyDestinations[_this.flyIndex], _this.camera.position);
			var len = flyVector.length();
			if (len < speed / 2){
				_this.flyIndex++;
				_this.initialFlight = false;
				if(_this.flyIndex == _this.flyDestinations.length) _this.flyIndex = 0;
				flyVector = _this.getVector(_this.flyDestinations[_this.flyIndex], _this.camera.position);
				len = flyVector.length();
			}
			
			if (len < speed){
				_this.camera.position.copy(_this.flyDestinations[_this.flyIndex]);
			} else {
				flyVector.normalize();
				_this.camera.position.addSelf(flyVector.multiplyScalar(speed));
			}
		}
		
	};
	
	this.flyToAndLookAt = function(flyToPos, lookAtPos, flySpeed, loiterSpeed){
		
		this.flyMode = true;
		this.target.copy(lookAtPos);
		this.flyDestinations = [flyToPos.clone(),
							new THREE.Vector3( flyToPos.x + 20, flyToPos.y + 20, flyToPos.z + 5),
							new THREE.Vector3( flyToPos.x + 40, flyToPos.y, flyToPos.z),
							new THREE.Vector3( flyToPos.x + 20, flyToPos.y - 20, flyToPos.z - 5 )];
		this.camera.up.set(0,0,1);
		this.flySpeed = flySpeed;
		this.loiterSpeed = loiterSpeed;
		this.initialFlight = true;
	};
	
	this.getVector = function(pos1, pos2) {
		var v = pos1.clone();
		v.subSelf(pos2);
		return v;
	};
	
	this.checkDistances = function() {

		if ( !_this.noZoom || !_this.noPan ) {

			if ( _this.camera.position.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.camera.position.setLength( _this.maxDistance );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.camera.position.add( _this.target, _eye.setLength( _this.minDistance ) );

			}

		}

	};

	this.update = function() {

		var old_camera_pos = _this.camera.position.clone();
		
		_eye.copy( _this.camera.position ).subSelf( this.target );

		_this.rotateCamera();

		_this.zoomCamera();

		_this.panCamera();
		
		_this.camera.position.add( _this.target, _eye );
		
		_this.flyCamera();

		_this.checkDistances();

		_this.camera.lookAt( _this.target );
		
		if (old_camera_pos.x != _this.camera.position.x ||
			old_camera_pos.y != _this.camera.position.y ||
			old_camera_pos.z != _this.camera.position.z){
			return true;
		} 
		return false;

	};


	// listeners

	function keydown( event ) {
	
		//alert("event.keyCode = " + event.keyCode);

		if ( ! _this.enabled ) return;
		
		// left arrow
		if (event.keyCode == 37) { 
		   //handleBack();
		   return;
		}
		
		// presenter back / page up
		if (event.keyCode == 33) { 
		   //handleBack();
		   _this.zoom = 1;
		   return;
		}
		
		// right arrow
		if (event.keyCode == 39 ) { 
		   
		   return;
		}
		
		// presenter forward / page down
		if (event.keyCode == 34 || event.keyCode == 88) { 
		   _this.zoom = -1;
		   return;
		}
		
		// up arrow 
		if (event.keyCode == 38|| event.keyCode == 87) { 
		   _this.zoom = 1;
		   return;
		}
		
		// presenter up / alt
		if (event.keyCode == 18) { 
		   _this.zoom = 1;
		   return;
		}
		
		// down arrow
		if (event.keyCode == 40) { 
		   _this.zoom = -1;
		   return;
		}
		
		// presenter down / b
		if (event.keyCode == 66) { 
		   _this.zoom = -1;
		   return;
		}

	};

	function keyup( event ) {
		if ( ! _this.enabled ) return;
		_this.zoom = 0;
	};

	function mousedown( event ) {

		if ( ! _this.enabled ) return;
		_this.flyMode = false;
		event.preventDefault();
		event.stopPropagation();

		if ( _this.mouseButtonState == MOUSEBUTTON.NONE ) {

			_this.mouseButtonState = event.button;
		
			// reset the rotation parameters in case this is the start of a drag rotate
			_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );
		}
	};

	function mousemove( event ) {
		mousemovexy(event.clientX, event.clientY);
	};

	
	function mousemovexy( x, y ) {
		if ( ! _this.enabled ) return;
		
		_this.mouse.x = ( x / window.innerWidth ) * 2 - 1;
		_this.mouse.y = - ( y / window.innerHeight ) * 2 + 1;

		if (  _this.mouseButtonState == MOUSEBUTTON.NONE ) {
			updateIntersectedElements();			
		} else  {
			// the left button is down, so we are dragging to rotate
			_rotateEnd = _this.getMouseProjectionOnBall( x, y );
		}
	};
	
	function updateIntersectedElements(){
		// we check for intersected objects and generate intersectionStart and intersectionEnd events
		_this.visualizer.findClosestIntersectedElement(_this.mouse);
		var element = _this.visualizer.intersectedElement;
		var lastElement = _this.visualizer.lastIntersectedElement;
		if (element !== lastElement){
			if (lastElement !== null) lastElement.onIntersectedEnd(event, _this.visualizer.lastIntersectionRole);
			if (element !== null) element.onIntersectedStart(event, _this.visualizer.intersectionRole);
		}
	};

	function mouseup( event ) {

		if ( ! _this.enabled ) return;

		event.preventDefault();
		event.stopPropagation();
		mouseupinternal();
	
	};

	function mouseupinternal(){
		_this.flyMode = false;
		
		var role = _this.visualizer.intersectionRole;
		if (_this.visualizer.intersectedElement !== null) _this.visualizer.intersectedElement.onClick(event, role); 
		
		_this.mouseButtonState = MOUSEBUTTON.NONE;	
	};


};
