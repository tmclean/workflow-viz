define( function( require ){

	var SnapElementView = require( '../views/snapElementView' );

	var SelectableSnapElementView = SnapElementView.extend({

		isSelected: false,

		initialize: function( options ){
			SelectableSnapElementView.__super__.initialize.apply( this, arguments );
		},

		render: function(){
			SelectableSnapElementView.__super__.render.apply( this, arguments );

			this.figure.click( _.bind( function( e ){
				if( !this.isSelected ){
					this.isSelected = true;
					this.trigger( 'selected' );
				}
				else{
					this.isSelected = false;
					this.trigger( 'deselected' );
				}
			}, this ) );
		},
	});

	return SelectableSnapElementView;
});