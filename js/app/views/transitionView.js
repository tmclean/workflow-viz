define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var TransitionView = SnapElementView.extend({

		isSelected: false,

		initialize: function( options ){
			
			SnapElementView.prototype.initialize.apply( this, arguments );

			this.snap     = options.snap;
			this.svgGroup = options.svgGroup;
			this.fromView = options.fromView;
			this.fromDir  = options.fromDir;
			this.toView   = options.toView;
			this.toDir    = options.toDir;
			this.toMarker = null;

			this.bind( 'selected',   this.selected   );
			this.bind( 'deselected', this.deselected );

			this.bind( 'hover',   this.hover   );
			this.bind( 'unhover', this.unhover );
		},

		buildFigure: function( attrs ){

			var fromCoords = this.getFromCoords();
			var toCoords   = this.getToCoords();

			var toMarker = this.drawToMarker();

			var line = this.svgGroup.line( fromCoords.x, fromCoords.y, toCoords.x, toCoords.y );

			line.addClass( 'transition' );

			line.hover(
				_.bind( this.hover,   this ),
				_.bind( this.unhover, this )
			);

			line.click( _.bind( function(){
				if( !this.isSelected ){
					this.trigger( 'selected' );
				}
				else{
					this.trigger( 'deselected' );
				}
			}, this ));

			line.attr({ 
				'marker-end': toMarker
			});

			return line;
		},

		hover: function(){
			this.figure.addClass( 'transition-hover' ); 
		},

		unhover: function(){ 
			this.figure.removeClass( 'transition-hover' ); 
		},

		selected: function(){
			if( !this.isSelected ){
				this.isSelected = true;
				this.figure.addClass( 'transition-selected' ); 
				this.trigger( 'transition:selected', this );
			}
		},

		deselected: function(){
			if( this.isSelected ){
				this.isSelected = false;
				this.figure.removeClass( 'transition-selected' ); 
				this.trigger( 'transition:deselected', this );
			}
		},

		drawToMarker: function(){
			var marker = this.snap.polygon( 0,0, 0,6, 3,3 );

			marker.attr({
				fill: '#555',
			});

			return marker.marker( 0,0, 3,6, 3,3 );
		},

		updateLine: function(){

			var fromCoords = this.getFromCoords();
			var toCoords   = this.getToCoords();

			this.figure.attr({
				x1: fromCoords.x,
				y1: fromCoords.y,
				x2: toCoords.x,
				y2: toCoords.y
			});
		},

		getFromCoords: function(){ return this.fromView.getPortCoordinates( this.fromDir ); },
		getToCoords:   function(){ return this.toView.getPortCoordinates( this.toDir );     }
	});

	return TransitionView;
});