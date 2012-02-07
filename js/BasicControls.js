/**
 * @author Dexter Pratt
 *
 * Thanks to Eberhard Graether / http://egraether.com/ for TrackballControls.js 
 * which served as the starting point for the Basic Triptych controls
 *
 */
 
 
 /*
 
 Behavior:
 
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
	
		(TODO) if alt/option key is down, zoom / rotate camera to look at the object
		
		* otherwise, call the mouseUp method for the mapped node with the event and the display object role
 
Key down:

		(TODO)
		zoom in
		zoom out
		pan left
		pan right
 
Key up:
 
 */

TRIPTYCH.BasicControls = function ( camera, domElement, visualizer ) {

	var _this = this,
	MOUSEBUTTON = { NONE : -1, LEFT : 0, CENTER : 1, RIGHT : 2 };

	// API

	this.enabled = true;

	this.screen = { width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0 };
	this.radius = ( this.screen.width + this.screen.height ) / 4;

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;
	
	this.mouse = { x: 0, y: 0 };
	this.mouseButtonState = MOUSEBUTTON.NONE;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

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

		this.domElement.addEventListener( 'mousemove', mousemove, false );
		this.domElement.addEventListener( 'mousedown', mousedown, false );
		this.domElement.addEventListener( 'mouseup', mouseup, false );
	
		window.addEventListener( 'keydown', keydown, false );
		window.addEventListener( 'keyup', keyup, false );
	}

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

		var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

		if ( factor !== 1.0 && factor > 0.0 ) {

			_eye.multiplyScalar( factor );

			if ( _this.staticMoving ) {

				_zoomStart = _zoomEnd;

			} else {

				_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

			}

		}

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

		_eye.copy( _this.camera.position ).subSelf( this.target );

		_this.rotateCamera();

		_this.zoomCamera();

		_this.panCamera();

		_this.camera.position.add( _this.target, _eye );

		_this.checkDistances();

		_this.camera.lookAt( _this.target );
		
		// later, this should test to see if any changes were made and only return true if redraw is needed
		return true;

	};


	// listeners

	function keydown( event ) {

		if ( ! _this.enabled ) return;

	};

	function keyup( event ) {

		if ( ! _this.enabled ) return;

	};

	function mousedown( event ) {

		if ( ! _this.enabled ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _this.mouseButtonState == MOUSEBUTTON.NONE ) {

			_this.mouseButtonState = event.button;

			
			// reset the rotation parameters in case this is the start of a drag rotate
			_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

 
		}

	};

	function mousemove( event ) {

		if ( ! _this.enabled ) return;
		
		_this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		_this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		if (  _this.mouseButtonState == MOUSEBUTTON.NONE ) {
		
			// we check for intersected objects and generate intersectionStart and intersectionEnd events
			_this.visualizer.findClosestIntersectedElement(_this.mouse);
			var element = _this.visualizer.intersectedElement;
			var lastElement = _this.visualizer.lastIntersectedElement;
			if (element !== lastElement){
				if (lastElement !== null) lastElement.onIntersectedEnd(event, _this.visualizer.lastIntersectionRole);
				if (element !== null) element.onIntersectedStart(event, _this.visualizer.intersectionRole);
			}
			
		} else  {

			// the left button is down, so we are dragging to rotate
			_rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

		}

	};

	function mouseup( event ) {

		if ( ! _this.enabled ) return;

		event.preventDefault();
		event.stopPropagation();

		var role = _this.visualizer.intersectionRole;
		if (_this.visualizer.intersectedElement !== null) _this.visualizer.intersectedElement.onClick(event, role); 
		
		_this.mouseButtonState = MOUSEBUTTON.NONE;
		
	};



};
