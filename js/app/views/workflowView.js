define( function( require ){

	var _        = require( 'underscore' );
	var Backbone = require( 'backbone'   );

	var NodeView              = require( '../views/nodeView'               );
	var TransitionView        = require( '../views/transitionView'         );
	var NodeModel             = require( '../models/nodeModel'             );
	var SchemaDefinitionModel = require( '../models/schemaDefinitionModel' );

	var WorkflowView = Backbone.View.extend({

		//
		// Array of view objects for the nodes present in the workflow
		//
		nodeViews: [],

		//
		// Array of view objects for transitions present in the workflow
		//
		transitionViews: [],

		//
		// Map of schema name to detailed schema definition
		//
		schemaDefinitions: {},

		//
		// Master SVG Group for containing the node figures. Needed to render the nodes
		// behind the transitions layer.
		//
		nodesSvg:       null,

		//
		// Master SVG Group for containing the transition figures. Needed to render the transitions
		// on top of the nodes layer
		//
		transitionsSvg: null,

		//
		// Reference to the current port that is being hover over
		//
		currentPortHover: null,

		//
		// If the user is currently dragging the mouse from a port, this variable will reference the 
		// SVG figure for the line showing the source port and the current mouse position.
		//
		dragLine: null,

		//
		// The current selected transition. Null if none are selected
		//
		selectedTransition: null,

		//
		// The current selected node. Null if none are selected
		//
		selectedNode: null,

		//
		// Backbone initialize method
		// 
		initialize: function( options ){

			//
			// The registry of available schemas should be loaded separately and 
			// passed in via the options argument.
			//
			this.schemaRegistry = options.schemaRegistry;

			//
			// Setup the Snap wrapper for the given SVG element. Piggy-backs off of the 
			// Backbone el property
			//
			this.snap = Snap( this.el );

			//
			// Setup the click handler for the SVG background
			//
			this.snap.click( _.bind(function( e ){

				//
				// If the target of the click something other than the SVG element, then ignore this event.
				//
				if( e.target != this.snap.node ){ return; }

				//
				// Since the background was clicked, we are going to deselect any nodes or transitions that
				// may have been selected.
				//
				if( this.selectedTransition ){
					this.selectedTransition.trigger( 'deselected' );
					this.selectedTransition = null;
				}

				if( this.selectedNode ){
					this.selectedNode.trigger( 'deselected' );
					this.selectedNode = null;
				}

			}, this ));

			//
			// Construct the SVG groups for the nodes and transitions
			// 
			this.nodesSvg       = this.snap.group();
			this.transitionsSvg = this.snap.group();

			//
			// Listen for when new nodes are added to the workflow model.
			//
			// Passed parameters are identical to that of the Backbone.Collection 'add' event
			//
			this.listenTo( this.model, 'node:added', this.nodeAdded );

			//
			// Listen for when new transitions are added to the workflow model.
			//
			// Passed parameters are identical to that of the Backbone.Collection 'add' event
			// 
			this.listenTo( this.model, 'transition:added', this.transitionAdded );
		},

		render: function(){

			//
			// Load the schema definitions asociated with this workflow
			//
			this.loadSchemaDefinitions( this.model.schemas, _.bind( function(){

				var stylesheets = [];

				//
				// Merge the stylesheet arrays from each definition 
				//
				_.each( arguments, function( def ){
					_.each( def.get( 'stylesheets' ), function( stylesheet ){
						stylesheets.push( stylesheet );
					});
				});

				//
				// Load the CSS from the merged stylesheet array
				//
				this.loadCss( stylesheets, _.bind( function(){ 

					//
					// After the relevant CSS is loaded, render the workflow
					//
					this.renderWorkflow(); 

				}, this ) );

			}, this ) );
		},

		//
		// Fetches the detailed definitions for the given schemas, then on completion invokes the
		// given callback.
		//
		// Arguments to the callback will be the resulting schema definition models. The results will
		// not be in the form of an array, but as separate parameters, thus they must be accesed via
		// the implicit 'arguments' variable.
		//
		loadSchemaDefinitions: function( schemas, callback ){

			var schemaModelPromises = [];

			_.each( schemas, function( schemaName ){

				var schema = this.schemaRegistry.get( schemaName );
				var schemaDef = new SchemaDefinitionModel();

				var deferred = $.Deferred();

				schemaDef.fetch({ 
					url: schema.get( 'url' ),
					success: _.bind( function( def ){ 
						this.schemaDefinitions[ def.id ] = def;
						deferred.resolve( def ); 
					}, this )
				});

				schemaModelPromises.push( deferred.promise() );

			}, this );

			$.when.apply( $, schemaModelPromises ).done( callback );
		},

		//
		// Loads the given CSS stylesheets and invokes the given callback on completion
		//
		loadCss: function( stylesheets, callback ){

			var cssDeferreds = [];

			_.each( stylesheets, function( stylesheet ){
				var deferred = $.Deferred();
				this.addCssTag( stylesheet, function(){ deferred.resolve(); } );
				cssDeferreds.push( deferred );
			}, this );

			$.when.apply( $, cssDeferreds ).done( callback );
		},

		//
		// Constructs a new CSS tag with the given stylesheet URL and appends it to the
		// head element. After the stylesheet loads, the given callback will be invoked. This
		// callback takes no arguments.
		//
		addCssTag: function( stylesheet, callback ){

			var css = $( '<link></link' );

			css.attr( 'rel',  'stylesheet' );
			css.attr( 'type', 'text/css'   );
			css.attr( 'href', stylesheet   );

	        css.load( callback );

			$( 'head' ).append( css );
		},

		//
		// Renders the configuration contained within the workflow model to the SVG canvas.
		//
		renderWorkflow: function(){

			this.model.nodes.each( function( node ){
				this.nodeAdded( node, this.model.nodes, {} );
			}, this);

			this.model.transitions.each( function( transition ){
				this.transitionAdded( transition, this.model.nodes, {} );
			}, this);
		},

		//
		// Handles the 'node-added' event originating from the workflow model
		//
		nodeAdded: function( model, collection, options ){

			var schemaDef = this.schemaDefinitions[ model.get('type').schema ];
			var typeDef = schemaDef.get( 'nodeTypes' )[ model.get('type').type ];

			var nodeView = new NodeView({
				model:    model,
				typeDef:  typeDef,
				snap:     this.snap, 
				svgGroup: this.nodesSvg 
			});

			//
			// Register the node level event handlers. All handlers are invoked with the
			// related node's view object
			//
			this.listenTo( nodeView, 'node:selected',   this.nodeSelected   );
			this.listenTo( nodeView, 'node:deselected', this.nodeDeselected );
			this.listenTo( nodeView, 'node:hover',      this.nodeHover      );
			this.listenTo( nodeView, 'node:unhover',    this.nodeUnhover    );

			//
			// Register the port level event handlers for dragging. 
			//

			//
			// The port:drag:stop handler is invoked with the related ports's view object, followed by
			// the ports direction in the node, the delta x, the delta y, the current x, the current y, and the
			// event object that triggered the invocation
			//
			this.listenTo( nodeView, 'port:drag:stop', this.portDragStop );
			
			//
			// The port:drag:move handler is invoked with the related ports's view object, followed by
			// the ports direction in the node, and the event object that triggered the invocation
			//
			this.listenTo( nodeView, 'port:drag:move', this.portDragMove );
			
			//
			// Register the port level event handlers for hovering. 
			// All handlers are invoked with the related ports's view object
			//
			this.listenTo( nodeView, 'port:hover',     this.portHover    );
			this.listenTo( nodeView, 'port:unhover',   this.portUnhover  );

			//
			// Register the event for dragging a node.
			//
			this.listenTo( nodeView, 'drag:move', this.nodeDragMove );

			//
			// Render the SVG for the node
			//
			nodeView.render();

			//
			// Add the node to the list of currently displayed nodes
			//
			this.nodeViews.push( nodeView );
		},

		//
		// Event handler for node selection
		//
		nodeSelected: function( nodeView ){

			//
			// If we currently have a node selected deselect it
			//
			if( this.selectedNode ){
				this.selectedNode.trigger( 'deselected' );
				this.selectedNode = null;
			}

			//
			// Star tracking the new node
			//
			this.selectedNode = nodeView;
		},

		//
		// Event handler for node deselection
		//
		nodeDeselected: function( nodeView ){

			//
			// If there is currently a node selected, stop tracking it
			//
			if( this.selectedNode ){
				this.selectedNode = null;
			}
		},

		//
		// Event handler for hovering over a node
		//
		nodeHover: function( nodeView ){

			var nodeId = nodeView.model.get('id');

			//
			// Trigger a hover event on all transitions currently connected to/from this node
			//
			// To Do: Track transitions connected to a node in the node view and handle
			//        this internally withing the view.
			//
			_.each( this.transitionViews, function( t ){
				if( t.model.get('from').id === nodeId || t.model.get('to').id === nodeId ){
					t.trigger( 'hover' );
				}
			});
		},

		//
		// Event handler for moving the mouse off of a hovered node
		//
		//
		// To Do: Track transitions connected to a node in the node view and handle
		//        this internally withing the view.
		//
		nodeUnhover: function( nodeView ){
			var nodeId = nodeView.model.get('id');

			//
			// Trigger an unhover event on all transitions currently connected to/from this node
			//
			_.each( this.transitionViews, function( t ){
				if( t.model.get('from').id === nodeId || t.model.get('to').id === nodeId ){
					t.trigger( 'unhover' );
				}
			});
		},

		//
		// Event handler for a new transition being added to the workflow model.
		//
		transitionAdded: function( model, collection, options ){

			var fromView = null;
			var toView   = null;

			//
			// Resolve the to and from node views from the transition model
			//
			_.each( this.nodeViews, function( nodeView ){
				if( nodeView.model.get('id') === model.get('from').id ){
					fromView = nodeView;
				}
				
				if( nodeView.model.get('id') === model.get('to').id ){
					toView = nodeView;
				}
			});

			//
			// Ensure the transition model has a type associated with it
			//
			if( !model.get( 'type' ) ){
				model.set( 'type', this.model.defaultTransitionType );
			}

			var type = model.get( 'type' );

			var schemaDef = this.schemaDefinitions[ type.schema ];
			var typeDef = schemaDef.get( 'transitionTypes' )[ type.type ];

			var view = new TransitionView({
				snap:     this.snap,
				typeDef:  typeDef,
				svgGroup: this.transitionsSvg,
				fromView: fromView,
				fromDir:  model.get('from').dir,
				toView:   toView,
				toDir:    model.get('to').dir,
				model:    model
			});

			//
			// Listen for when the new transition is selected
			//
			this.listenTo( view, 'transition:selected', this.transitionSelected );

			//
			// Save the new view to the list of currently displayed views in the workflow
			//
			this.transitionViews.push( view );

			//
			// Render the new transition
			//
			view.render();
		},

		//
		// Event handler for a transition being selected
		//
		transitionSelected: function( transitionView ){

			//
			// Fire the deselected event on the old transition (if any),
			// and stop tracking it.
			//
			if( this.selectedTransition ){
				this.selectedTransition.trigger( 'deselected' );
				this.selectedTransition = null;
			}

			//
			// Start tracking the newly selected transition
			//
			this.selectedTransition = transitionView;
		},

		//
		// Event handler for a transition being deselected
		//
		transitionDeselected: function( transitionView ){
			if( this.selectedTransition ){
				this.selectedTransition = null;
			}
		},

		//
		// Destroys the current figure for the drag line
		//
		removeDragLine: function(){
			if( this.dragLine ){
				this.dragLine.remove();
				this.dragLine = null;
			}
		},

		//
		// Event handler for activley dragging a node
		//
		nodeDragMove: function(){

			//
			// Update the transition SVG figures to reflect the node's new coordinates
			//
			_.each( this.transitionViews, function( transition ){
				transition.updateLine();
			}, this);
		},

		//
		// Event handler for activley dragging a node port
		//
		portDragMove: function( nodeView, portFigure, dir, dx, dy, x, y, e )
		{
			//
			// Calculate the boudning box for the screen
			//
			var svgBBox = this.snap.node.getBoundingClientRect();

			//
			// If we do not have a drag line, create a new one, otherwise 
			// update the coordinates for its SVG figure
			//
			if( !this.dragLine ){

				//
				// Get the global coords for the dragged port
				//
				var startBBox = portFigure.node.getBoundingClientRect();

				//
				// Calculate the X and Y cooridnates taking into acount any 
				// offsets for the SVG canvas
				//
				var x1 = startBBox.left - svgBBox.left + (startBBox.width/2);
				var y1 = startBBox.top  - svgBBox.top  + (startBBox.height/2);

				//
				// Create and style the new drag line
				//
				this.dragLine = this.snap.line( x1, y1, x-svgBBox.left, y-svgBBox.top );

				this.dragLine.attr({
					strokeWidth: 1,
					stroke: '#555',
					'stroke-dasharray': '2, 2'
				});
			}
			else{
				this.dragLine.attr({ x2: x-svgBBox.left, y2: y-svgBBox.left });
			}
		},

		//
		// Event handler for stopping a drag on a node port
		//
		portDragStop: function( nodeView, dir, e ){

			//
			// Remove the current drag line regardless of drop point
			//
			this.removeDragLine();

			//
			// If we are dropping while hovering over a port make a new transition
			//
			if( this.currentPortHover ){

				//
				// Do not create a new transition with the same to and from port
				//
				if( nodeView.model.get('id') === this.currentPortHover.node && dir === this.currentPortHover.dir ){
					return;
				}

				var transitionData = {
					from:{
						id: nodeView.model.get('id'),
						dir: dir
					},
					to:{
						id: this.currentPortHover.node,
						dir: this.currentPortHover.dir
					}
				};

				this.model.addTransition( transitionData );
			}
		},

		//
		// Event handler for hover over a port
		//
		portHover: function( nodeView, dir ){

			//
			// Start tracking the node, port view, and direction we are hovering over
			//
			this.currentPortHover = {
				node: nodeView.model.get('id'),
				dir: dir,
				view: nodeView
			};
		},

		//
		// Event handler for moving the mouse off of a port
		//
		portUnhover: function( nodeView, dir ){

			//
			// Stop tracking the port as being hovered over
			//
			this.currentPortHover = null;
		}
	});

	return WorkflowView;
});