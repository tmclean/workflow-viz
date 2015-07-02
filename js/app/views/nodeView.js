define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var boxCornerRadius = 4;
	var boxFill = '#acf';
	var boxHoverFill = '#afc';
	var boxHoverAnimateTime = 100;
	var boxStrokeWidth = 0.5;
	var boxHoverStrokeWidth = 2;
	var boxSelectedStrokeWidth = 3;

	var portRadius = 4;
	var portRadiusHover = 6;
	var portHoverAnimateTime = 100;
	var portFill = '#ccc';
	var portHoverFill = '#aaa';

	var offScreen = -100;

	var NodeView = SnapElementView.extend({

		isSelected: false,

		initialize: function( options ){
			
			NodeView.__super__.initialize.apply( this, arguments );

			this.bind( 'port:drag:move',    this.portDragMove    );
			this.bind( 'port:drag:start',   this.portDragStart   );
			this.bind( 'port:drag:stop',    this.portDragStop    );

			this.bind( 'selected',   this.selected   );
			this.bind( 'deselected', this.deselected );

			this.figureComponents = {};
		},

		buildFigure: function( attrs ){
			
			var modelX      = this.model.get( 'x'      );
			var modelY      = this.model.get( 'y'      );
			var modelWidth  = this.model.get( 'width'  );
			var modelHeight = this.model.get( 'height' );

			var halfWidth  = modelWidth  / 2;
			var halfHeight = modelHeight / 2;

			var box = this.snap.rect( modelX, modelY, modelWidth, modelHeight, boxCornerRadius );

			box.attr({
				fill: boxFill,
				stroke: '#000',
				strokeWidth: 0.5,
				opacity: 0.9
			});

			box.hover(
				_.bind( function(){ 
					if( !this.isSelected ){
						box.animate({ strokeWidth: boxHoverStrokeWidth }, boxHoverAnimateTime );
					} 
					box.animate({ fill: boxHoverFill }, boxHoverAnimateTime );
					this.trigger( 'node:hover', this );
				}, this ),
			   _.bind( function(){ 
					if( !this.isSelected ){
						box.animate({ strokeWidth: boxStrokeWidth }, boxHoverAnimateTime );
					} 
					box.animate({ fill: boxFill }, boxHoverAnimateTime );
					this.trigger( 'node:unhover', this );
			   	}, this )
			);

			box.click( _.bind( function(){
				if( !this.isSelected ){
					this.isSelected = true;
					this.trigger( 'selected' );
				}
				else{
					this.isSelected = false;
					this.trigger( 'deselected' );
				}
			}, this ));

			var title = this.snap.text( offScreen, offScreen, this.model.get('name') );

			var titleBBox = title.getBBox();

			title.attr({
				x: modelX + halfWidth  - (titleBBox.width/2),
				y: modelY + halfHeight + (titleBBox.height/2),
				'pointer-events': 'none',
				'font-family': 'sans-serif'
			});

			var ports = {
				east:  this.snap.circle( modelX + modelWidth, modelY + halfHeight,  portRadius ),
				west:  this.snap.circle( modelX,              modelY + halfHeight,  portRadius ),
				north: this.snap.circle( modelX + halfWidth,  modelY,               portRadius ),
				south: this.snap.circle( modelX + halfWidth,  modelY + modelHeight, portRadius )
			};

			_.each( ports, function( port, dir ){
				
				port.attr({
					fill: portFill,
					stroke: '#555',
					strokeWidth: 0.5,
					opacity: 0.9
				});

				port.hover( 
					
					_.bind( function(){ 

						this.trigger( 'port:hover', this, dir );

						port.animate({
							r: portRadiusHover, 
							fill: portHoverFill 
						}, 
						portHoverAnimateTime ); 
					}, this ),

					_.bind( function(){ 

						this.trigger( 'port:unhover', this, dir );

						port.animate({
							r: portRadius, 
							fill: portFill 
						}, 
						portHoverAnimateTime ); 
					}, this )
				);

				port.drag(
					_.bind( function( dx, dy, x, y, e ) {
						this.trigger( 'port:drag:move', this, port, dir, dx, dy, x, y, e );
					}, this ), 

					_.bind( function( x, y,e ) {
						this.trigger( 'port:drag:start', this, dir, x, y, e );
					}, this ),

					_.bind( function( e ){
						this.trigger( 'port:drag:stop', this, dir, e );
					}, this )
				);

			}, this);

			this.figureComponents.box = box;
			this.figureComponents.title = title;
			this.figureComponents.ports = ports;

			box.drag(
				_.bind( function( dx, dy, x, y, e ) {
					this.trigger( 'drag:move', nodeFigure, dx, dy, x, y, e );
				}, this ), 

				_.bind( function( x, y,e ) {
					this.trigger( 'drag:start', nodeFigure, x, y, e );
				}, this ),

				_.bind( function( e ){
					this.trigger( 'drag:stop', nodeFigure, e );
				}, this )
			);

			var nodeFigure = this.snap.group();

			nodeFigure.add( box );
			nodeFigure.add( title );

			_.each( ports, function( port ){
				nodeFigure.add( port );
			});

			return nodeFigure;
		},

		selected: function(){
			this.figureComponents.box.attr({
				strokeWidth: boxSelectedStrokeWidth
			});

			this.figureComponents.title.attr({
				fontWeight: 'bold'
			});

			this.trigger( 'node:selected', this );
		},

		deselected: function(){
			this.isSelected = false;
			this.figureComponents.box.attr({
				strokeWidth: boxStrokeWidth
			});

			this.figureComponents.title.attr({
				fontWeight: null
			});

			this.trigger( 'node:deselected', this );
		},

		dragStart: function( figure, x, y, e ){ this.startDragFollow( figure, x, y ); },

		dragMove: function( figure, dx, dy, x, y, e ){ 
			this.moveDragFollow( figure, dx, dy ); 
		},

		dragStop: function( figure ){
			var bbox = figure.getBBox();
			this.model.set( 'x', bbox.x );
			this.model.set( 'y', bbox.y );
		},

		portDragStart: function( portFigure, dir, x, y, e ){},

		portDragMove: function( portFigure, dir, dx, dy, x, y, e ){},

		portDragStop: function( portFigure, dir, e ){},

		getPortCoordinates: function( dir ){

			var port = this.figureComponents.ports[dir];
			var bBox = port.node.getBoundingClientRect();

			var canvasBBox = this.snap.node.getBoundingClientRect();

			var offset = { x: 0, y: 0 };

			if( dir === 'north' ){
				offset.y = -portRadius;
			}
			else if( dir === 'south' ){
				offset.y = portRadius;
			}
			else if( dir === 'east' ){
				offset.x = portRadius;
			}
			else if( dir === 'west' ){
				offset.x = -portRadius
			}

			var coords = {
				x: bBox.left - canvasBBox.left + (bBox.width/2)  + offset.x,
				y: bBox.top  - canvasBBox.top  + (bBox.height/2) + offset.y
			};

			return coords;
		}
	});	

	return NodeView;
});