define( function( require ){

	var Backbone = require( 'backbone' );

	var NodeCollection       = require( '../collections/nodeCollection' );
	var TransitionCollection = require( '../collections/nodeCollection' );

	var WorkflowModel = Backbone.Model.extend({

		initialize: function( options ){

			this.nodes = new NodeCollection();
			this.transitions = new TransitionCollection();

			this.listenTo( this.nodes, 'add', function( model, collection, options ){
				this.trigger( 'node-added', model, collection, options );
			});

			this.listenTo( this.transitions, 'add', function( model, collection, options ){
				this.trigger( 'transition-added', model, collection, options );
			});
		},

		addNode: function( nodeData ){
			this.nodes.add( nodeData );
		},

		addTransition: function( transitionData ){
			this.transitions.add( transitionData );
		}
	});
	
	return WorkflowModel;
});