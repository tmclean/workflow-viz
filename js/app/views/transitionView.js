define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var lineWidth = 2;
	var lineSelectedOrHoverWidth = 3;

	var TransitionView = SnapElementView.extend({

		isSelected: false,

		initialize: function( options ){
			TransitionView.__super__.initialize.apply( this, arguments );

			this.snap     = options.snap;
			this.svgGroup = options.svgGroup;
			this.fromView = options.fromView;
			this.fromDir  = options.fromDir;
			this.toView   = options.toView;
			this.toDir    = options.toDir;
			this.line     = null;
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

			line.hover(
				_.bind( this.hover, this ),
				_.bind( this.unhover, this )
			);

			line.click( _.bind( function(){
				if( !this.isSelected ){
					this.isSelected = true;
					this.trigger( 'selected' );
				}
				else{
					this.isSelected = false;
					this.trigger( 'deselected' );
				}
			}, this ));

			line.attr({ 
				strokeWidth: lineWidth, 
				stroke: '#555',
				'marker-end': toMarker
			});

			this.line = line;

			return line;
		},

		hover: function(){ 

			if( this.isSelected ){ return; }

			this.line.attr({ strokeWidth: lineSelectedOrHoverWidth });
		},

		unhover: function(){ 

			if( this.isSelected ){ return; }

			this.line.attr({  strokeWidth: lineWidth }); 
		},

		selected: function(){
			this.line.attr({
				strokeWidth: lineSelectedOrHoverWidth,
				stroke: '#00f'
			});
			this.trigger( 'transition:selected', this );
		},

		deselected: function(){
			this.isSelected = false;
			this.line.attr({
				strokeWidth: lineWidth,
				stroke: '#555',
			});
			this.trigger( 'transition:deselected', this );
		},

		drawToMarker: function(){
			var marker = this.snap.polygon( 0,0, 0,6, 3,3 );
			marker.attr({
				fill: '#555',
			});

			var m = marker.marker( 0,0, 3,6, 3,3 );

			m.hover(
				function(){ this.attr({ fill: '#f00' }); },
				function(){ this.attr({ fill: '#555' }); }
			);

			return m;
		},

		angle: function( cx, cy, ex, ey ) {
  			var dy = ey - cy;
  			var dx = ex - cx;
  			var theta = Math.atan2(dy, dx);
  			theta *= 180 / Math.PI;
  			return theta;
		},

		updateLine: function(){

			var fromCoords = this.getFromCoords();
			var toCoords   = this.getToCoords();

			this.line.attr({
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