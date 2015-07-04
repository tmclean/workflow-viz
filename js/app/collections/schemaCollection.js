define( function( require ){

	var Backbone = require( 'backbone' );

	var SchemaModel = require( '../models/schemaModel' );

	var SchemaCollection = Backbone.Collection.extend({

		model: SchemaModel,

		url: '/data/schemas.json',
		urlRoot: '/data/schemas'
	});

	return SchemaCollection;
});