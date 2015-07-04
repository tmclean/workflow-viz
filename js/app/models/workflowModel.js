define( function( require ){

	var Backbone = require( 'backbone' );

	var NodeCollection       = require( '../collections/nodeCollection'   );
	var TransitionCollection = require( '../collections/nodeCollection'   );
	var SchemaCollection     = require( '../collections/schemaCollection' );

	var WorkflowModel = Backbone.Model.extend({

		initialize: function( options ){

			this.nodes          = new NodeCollection();
			this.transitions    = new TransitionCollection();
			this.schemaRegistry = new SchemaCollection();

			this.listenTo( this.nodes, 'add', function( model, collection, options ){
				this.trigger( 'node:added', model, collection, options );
			});

			this.listenTo( this.transitions, 'add', function( model, collection, options ){
				this.trigger( 'transition:added', model, collection, options );
			});
		},

		parse: function( response, options ){

			this.schemas = response.schemas;

			_.each( response.nodes, function( node ){
				this.addNode( node );
			}, this);

			_.each( response.transitions, function( transition ){
				this.addTransition( transition );
			}, this);
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