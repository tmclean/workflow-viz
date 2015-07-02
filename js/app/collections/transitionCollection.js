define( function( require ){

	var Backbone  = require( 'backbone' );
	var NodeModel = require( '../models/transitionModel' );

	var TransitionCollection = Backbone.Collection.extend({
		
		model: NodeModel,

		sync: function( method, model, options ){
			return options.success.apply();
		}
	});

	return TransitionCollection;
});