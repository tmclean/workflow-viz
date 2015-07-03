define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var boxCornerRadius = 4;

	var portRadius = 4;
	var portRadiusHover = 6;
	var portHoverAnimateTime = 100;

	var offScreen = -100;

	var NodeView = SnapElementView.extend({

		isSelected: false,
		isDragging: false,

		initialize: function( options ){
			
			NodeView.__super__.initialize.apply( this, arguments );

			this.bind( 'port:drag:move',    this.portDragMove    );
			this.bind( 'port:drag:start',   this.portDragStart   );
			this.bind( 'port:drag:stop',    this.portDragStop    );

			this.bind( 'selected',   this.selected   );
			this.bind( 'deselected', this.deselected );

			this.figureComponents = {};
		},

		calcModelDims: function(){
			return {
				x:          this.model.get( 'x'      ),
				y:          this.model.get( 'y'      ),
				width:      this.model.get( 'width'  ),
				height:     this.model.get( 'height' ),
				halfWidth:  this.model.get( 'width'  ) / 2,
				halfHeight: this.model.get( 'height' ) / 2
			};
		},

		buildFigure: function( attrs ){

			var dims = this.calcModelDims();

			var nodeFigure = this.snap.group();

			this.drawBox(   nodeFigure, dims );
			this.drawTitle( nodeFigure, dims );
			this.drawPorts( nodeFigure, dims );

			nodeFigure.addClass( 'node' );

			return nodeFigure;
		},

		drawBox: function( nodeFigure, dims ){

			var box = this.snap.rect( dims.x, 
									  dims.y,
									  dims.width, 
									  dims.height );

			box.addClass( 'node-box' );

			box.hover(
				_.bind( function(){ this.trigger( 'node:hover',   this ); }, this ),
			   	_.bind( function(){ this.trigger( 'node:unhover', this ); }, this )
			);

			box.click( _.bind( function(){
				this.isSelected ? this.trigger( 'deselected' ) : this.trigger( 'selected' );
			}, this ));

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

			this.figureComponents.box = box;

			nodeFigure.add( box );
		},

		drawTitle: function( nodeFigure, dims ){

			var title = nodeFigure.text( offScreen, offScreen, this.model.get('name') );

			title.addClass( 'node-title' );

			this.updateTitlePosition( title, dims );

			this.figureComponents.title = title;

			nodeFigure.add( title );
		},

		updateTitlePosition: function( title, dims ){
			var titleBBox = title.getBBox();

			title.attr({
				x: dims.x + dims.halfWidth  - (titleBBox.width/2),
				y: dims.y + dims.halfHeight + (titleBBox.height/2)
			});
		},

		drawPorts: function( nodeFigure, dims ){

			var ports = {
				east:  this.snap.circle( dims.x + dims.width,      dims.y + dims.halfHeight, portRadius ),
				west:  this.snap.circle( dims.x,                   dims.y + dims.halfHeight, portRadius ),
				north: this.snap.circle( dims.x + dims.halfWidth,  dims.y,                   portRadius ),
				south: this.snap.circle( dims.x + dims.halfWidth,  dims.y + dims.height,     portRadius )
			};

			_.each( ports, function( port, dir ){
				
				port.addClass( 'node-port' );

				port.hover( 
					
					_.bind( function(){ 

						this.trigger( 'port:hover', this, dir );

						port.animate({
							r: portRadiusHover
						}, 
						portHoverAnimateTime ); 
					}, this ),

					_.bind( function(){ 

						this.trigger( 'port:unhover', this, dir );

						port.animate({
							r: portRadius
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

			_.each( ports, function( port ){
				nodeFigure.add( port );
			});

			this.figureComponents.ports = ports;
		},

		selected: function(){

			if( this.preventSelectChangeAfterDrag() ){
				return;
			}

			if( !this.isSelected ){
				
				this.isSelected = true;

				this.figure.addClass( 'node-selected' );

				this.trigger( 'node:selected', this );
			}
		},

		deselected: function(){

			if( this.preventSelectChangeAfterDrag() ){
				return;
			}

			if( this.isSelected ){

				this.isSelected = false;

				this.figure.removeClass( 'node-selected' );

				this.trigger( 'node:deselected', this );
			}
		},

		preventSelectChangeAfterDrag: function(){
			if( this.isDragging ){
				this.isDragging = false;
				return true;
			}

			return false;
		},

		dragStart: function( figure, x, y, e ){ 
			this.startDragFollow( figure, x, y ); 
		},

		dragMove: function( figure, dx, dy, x, y, e ){ 
			this.moveDragFollow( figure, dx, dy ); 
			this.isDragging = true;
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