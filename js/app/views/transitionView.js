define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var TransitionView = SnapElementView.extend({

		isSelected: false,

		initialize: function( options ){
			
			SnapElementView.prototype.initialize.apply( this, arguments );

			this.snap     = options.snap;
			this.typeDef  = options.typeDef;
			this.svgGroup = options.svgGroup;
			this.fromView = options.fromView;
			this.fromDir  = options.fromDir;
			this.toView   = options.toView;
			this.toDir    = options.toDir;

			this.bind( 'selected',   this.selected   );
			this.bind( 'deselected', this.deselected );

			this.bind( 'hover',   this.hover   );
			this.bind( 'unhover', this.unhover );
		},

		buildFigure: function( attrs ){

			var fromCoords = this.getFromCoords();
			var toCoords   = this.getToCoords();

			var line = this.svgGroup.line( fromCoords.x, fromCoords.y, toCoords.x, toCoords.y );

			line.addClass( this.typeDef.cssClass );

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


			this.drawToMarker( _.bind( function( marker ){
				line.attr({ 
					'marker-end': marker
				});
			}, this ));

			this.drawFromMarker(  _.bind( function( marker ){
				console.log( marker );
				line.attr({ 
					'marker-start': marker
				});
			}, this ));

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

		drawToMarker: function( callback ){

			var markerUrl = this.typeDef.toMarker.url;

			Snap.load( markerUrl, _.bind( function( fragment ){

				var markerConfig = this.typeDef.toMarker;

				var markerSvg = fragment.select( markerConfig.selector );

				markerSvg.addClass( markerConfig.cssClass );

				markerSvg.attr( { transform: 'r' + markerConfig.rotate + ',' + markerConfig.anchorX + ',' + markerConfig.anchorY + 's' + markerConfig.scale + ',' + markerConfig.anchorX + ',' + markerConfig.anchorY } );

				var marker = markerSvg.marker( 0, 0, markerConfig.width, markerConfig.height, markerConfig.anchorX, markerConfig.anchorY );

				this.snap.append( marker );

				callback( marker );

			}, this ));
		},

		drawFromMarker: function( callback ){

			var markerUrl = this.typeDef.fromMarker.url;

			Snap.load( markerUrl, _.bind( function( fragment ){

				var markerConfig = this.typeDef.fromMarker;

				var markerSvg = fragment.select( markerConfig.selector );

				markerSvg.addClass( markerConfig.cssClass );

				markerSvg.attr( { transform: 'r' + markerConfig.rotate + ',' + markerConfig.anchorX + ',' + markerConfig.anchorY + 's' + markerConfig.scale + ',' + markerConfig.anchorX + ',' + markerConfig.anchorY } );

				var marker = markerSvg.marker( 0, 0, markerConfig.width, markerConfig.height, markerConfig.anchorX, markerConfig.anchorY );

				this.snap.append( marker );

				callback( marker );

			}, this ));
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