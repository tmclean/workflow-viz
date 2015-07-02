define( function( require ){

	var Backbone = require( 'backbone' );

	Backbone.$ = $;

	var SnapElementView = Backbone.View.extend({

		initialize: function( options ){

			this.snap     = options.snap;
			this.svgGroup = options.svgGroup;
			this.model    = options.model;
			this.attrs    = options.attrs;
			this.figure   = null;
			
			this.origTransform = {};

			this.bind( 'drag:move',    this.dragMove    );
			this.bind( 'drag:start',   this.dragStart   );
			this.bind( 'drag:stop',    this.dragStop    );
			this.bind( 'click:double', this.doubleClick );
		},

		render: function(){
			this.figure = this.buildFigure( this.attrs );

			if( this.svgGroup ){
				this.svgGroup.add( this.figure );
			}
			
			this.bindFigureEvents( this.figure );
		},

		buildFigure: function( attrs ){},

		bindFigureEvents: function( figure ){

			figure.dblclick( _.bind( function( e ){ this.trigger( 'click:double', e ); }, this ) );

			if( this.attrs && this.attrs.draggable )
			{
				figure.drag(
					_.bind( function( dx, dy, x, y, e ) {
						this.trigger( 'drag:move', figure, dx, dy, x, y, e );
					}, this ), 

					_.bind( function( x, y,e ) {
						this.trigger( 'drag:start', figure, x, y, e );
					}, this ),

					_.bind( function( e ){
						this.trigger( 'drag:stop', figure, e );
					}, this )
				);
			}
		},

		startDragFollow: function( figure ){
			this.origTransform = figure.transform().global;
		},

		moveDragFollow: function( figure, dx, dy ){
			figure.attr({ transform: this.origTransform + (this.origTransform ? "T" : "t") + [dx, dy] });
		},

		stopDragFollow: function( figure, e ){
			this.dragContext = null;
		}
	});

	return SnapElementView;
});