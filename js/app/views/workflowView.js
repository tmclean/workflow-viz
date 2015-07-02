define( function( require ){

	var _               = require( 'underscore'               );
	var Backbone        = require( 'backbone'                 );
	var NodeView        = require( '../views/nodeView'        );
	var TransitionView  = require( '../views/transitionView'  );
	var NodeModel       = require( '../models/nodeModel'      );

	var WorkflowView = Backbone.View.extend({

		nodeViews: [],
		transitionViews: [],

		nodesSvg:       null,
		transitionsSvg: null,

		currentPortHover: null,
		dragLine: null,

		selectedTransition: null,
		selectedNode: null,

		initialize: function( options ){
			this.snap = Snap( '.' + $(this.el).attr( 'class' ) );

			this.snap.click( _.bind(function( e ){

				if( e.target != this.snap.node ){
					return;
				}

				if( this.selectedTransition ){
					this.selectedTransition.trigger( 'deselected' );
					this.selectedTransition = null;
				}

				if( this.selectedNode ){
					this.selectedNode.trigger( 'deselected' );
					this.selectedNode = null;
				}

			}, this ));

			this.nodesSvg       = this.snap.group();
			this.transitionsSvg = this.snap.group();

			this.listenTo( this.model, 'node-added',       this.nodeAdded       );
			this.listenTo( this.model, 'transition-added', this.transitionAdded );
		},

		render: function(){
			this.model.nodes.each( function( node ){
				this.nodeAdded( node, this.model.nodes, {} );
			}, this);

			this.model.transitions.each( function( transition ){
				this.transitionAdded( transition, this.model.nodes, {} );
			}, this);
		},

		nodeAdded: function( model, collection, options ){

			var nodeView = new NodeView({
				model:    model, 
				snap:     this.snap, 
				svgGroup: this.nodesSvg 
			});

			this.listenTo( nodeView, 'node:selected',   this.nodeSelected   );
			this.listenTo( nodeView, 'node:deselected', this.nodeDeselected );
			this.listenTo( nodeView, 'node:hover',      this.nodeHover      );
			this.listenTo( nodeView, 'node:unhover',    this.nodeUnhover    );

			this.listenTo( nodeView, 'port:drag:stop', this.portDragStop );
			this.listenTo( nodeView, 'port:drag:move', this.portDragMove );
			this.listenTo( nodeView, 'port:hover',     this.portHover    );
			this.listenTo( nodeView, 'port:unhover',   this.portUnhover  );

			this.listenTo( nodeView, 'drag:move', this.nodeDragMove );

			nodeView.render();

			this.nodeViews.push( nodeView );
		},


		nodeSelected: function( nodeView ){
			if( this.selectedNode ){
				this.selectedNode.trigger( 'deselected' );
				this.selectedNode = null;
			}

			this.selectedNode = nodeView;
		},

		nodeDeselected: function( nodeView ){
			if( this.selectedNode ){
				this.selectedNode = null;
			}
		},

		nodeHover: function( nodeView ){
			var nodeId = nodeView.model.get('id');

			_.each( this.transitionViews, function( t ){
				if( t.model.get('from').id === nodeId || t.model.get('to').id === nodeId ){
					t.trigger( 'hover' );
				}
			});
		},

		nodeUnhover: function( nodeView ){
			var nodeId = nodeView.model.get('id');

			_.each( this.transitionViews, function( t ){
				if( t.model.get('from').id === nodeId || t.model.get('to').id === nodeId ){
					t.trigger( 'unhover' );
				}
			});
		},

		transitionAdded: function( model, collection, options ){

			var fromView = null;
			var toView   = null;

			_.each( this.nodeViews, function( nodeView ){
				if( nodeView.model.get('id') === model.get('from').id ){
					fromView = nodeView;
				}
				
				if( nodeView.model.get('id') === model.get('to').id ){
					toView = nodeView;
				}
			});

			var view = new TransitionView({
				snap:     this.snap,
				svgGroup: this.transitionsSvg,
				fromView: fromView,
				fromDir:  model.get('from').dir,
				toView:   toView,
				toDir:    model.get('to').dir,
				model:    model
			});

			this.listenTo( view, 'transition:selected', this.transitionSelected );

			this.transitionViews.push( view );

			view.render();
		},

		transitionSelected: function( transitionView ){
			if( this.selectedTransition ){
				this.selectedTransition.trigger( 'deselected' );
				this.selectedTransition = null;
			}

			this.selectedTransition = transitionView;
		},

		transitionDeselected: function( transitionView ){
			if( this.selectedTransition ){
				this.selectedTransition = null;
			}
		},

		removeDragLine: function(){
			if( this.dragLine ){
				this.dragLine.remove();
				this.dragLine = null;
			}
		},

		nodeDragMove: function(){
			_.each( this.transitionViews, function( transition ){
				transition.updateLine();
			}, this);
		},

		portDragMove: function( nodeView, portFigure, dir, dx, dy, x, y, e )
		{
			var svgBBox = this.snap.node.getBoundingClientRect();

			if( !this.dragLine ){
				var startBBox = portFigure.node.getBoundingClientRect();

				var x1 = startBBox.left - svgBBox.left + (startBBox.width/2);
				var y1 = startBBox.top  - svgBBox.top  + (startBBox.height/2);

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

		portDragStop: function( nodeView, dir, e ){

			this.removeDragLine();

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

		portHover: function( nodeView, dir ){
			this.currentPortHover = {
				node: nodeView.model.get('id'),
				dir: dir,
				view: nodeView
			};
		},

		portUnhover: function( nodeView, dir ){
			this.currentPortHover = null;
		}
	});

	return WorkflowView;
});