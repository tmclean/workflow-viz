require.config({
	baseUrl: 'js/lib',
	paths: {
		app: '../app',
	},
	map: {
		'*': {
			'snap-svg': 'snap.svg',
			'jquery':   'jquery-1.11.3'
		}
	},
	shim: {
		'backbone' : {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'underscore' : {
			exports: '_'
		},
		'snap-svg' :{
			exports: 'Snap'
		},
		'jquery' :{
			exports: '$'
		}
	}
});

var runApp = function( Backbone, _, Snap, WorkflowView, WorkflowModel, SchemaCollection ){

	//
	// Load the collection of available Schemas and their locations
	//
	var schemaRegistry = new SchemaCollection();

	var schemaRegistryFetchDeferred = $.Deferred();

	schemaRegistry.fetch({
		success: function(){
			schemaRegistryFetchDeferred.resolve();
		}
	});

	//
	// Load the workflow model
	//
	var workflowModelDeferred = $.Deferred();

	var workflowModel = new WorkflowModel();
	
	workflowModel.fetch( { 
		url: '/data/data.json', 
		success: function(){
			workflowModelDeferred.resolve();
		} 
	});

	//
	// When both the workflow model and schema reigstry are loaded, render the workflow.
	//
	$.when( schemaRegistryFetchDeferred.promise(), workflowModelDeferred.promise() ).done( function(){

		var workflowView  = new WorkflowView({
			model: workflowModel, 
			el: $( '.svg' ), 
			schemaRegistry: schemaRegistry 
		});

		workflowView.render();
	})
};

require(
	[
		'backbone', 
		'underscore', 
		'snap-svg', 
		'app/views/workflowView', 
		'app/models/workflowModel',
		'app/collections/schemaCollection'
	], 
	runApp
);