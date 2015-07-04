define( function( require ){

	var Backbone = require( 'backbone' );

	var NodeModel = Backbone.Model.extend({
		defaults: function(){
			this.id   = null;
			this.name = null;
			this.x    = null;
			this.y    = null;		}
	});

	return NodeModel;
});