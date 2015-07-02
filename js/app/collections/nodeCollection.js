define( function( require ){

	var Backbone  = require( 'backbone' );
	var NodeModel = require( '../models/nodeModel' );

	var NodeCollection = Backbone.Collection.extend({
		
		model: NodeModel,

		sync: function( method, model, options ){
			return options.success.apply();
		}
	});

	return NodeCollection;
});