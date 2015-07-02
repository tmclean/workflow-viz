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

var data = {
	nodes: [{
		id: 1,
		name: 'Node 1',
		x: 10,
		y: 50,
		width: 200,
		height: 50
	},
	{
		id: 2,
		name: 'Node 2',
		x: 100,
		y: 150,
		width: 150,
		height: 50
	},
	{
		id: 3,
		name: 'Node 3',
		x: 325,
		y: 275,
		width: 200,
		height: 50
	},
	{
		id: 4,
		name: 'Node 4',
		x: 300,
		y: 400,
		width: 150,
		height: 150
	},
	{
		id: 5,
		name: 'Node 5',
		x: 500,
		y: 200,
		width: 150,
		height: 50
	}],
	transitions:[
	{
		from: { id: 1, dir: 'south' },
		to:   { id: 2, dir: 'north' }
	},
	{
		from: { id: 1, dir: 'south' },
		to:   { id: 2, dir: 'west' } 
	},
	{
		from: { id: 2, dir: 'south' },
		to:   { id: 3, dir: 'north' }
	},
	{
		from: { id: 2, dir: 'south' },
		to:   { id: 4, dir: 'north' }
	},
	{
		from: { id: 3, dir: 'south' },
		to:   { id: 4, dir: 'north' }
	},
	{
		from: { id: 2, dir: 'east' },
		to:   { id: 5, dir: 'west' }
	},
	{
		from: { id: 5, dir: 'south' },
		to:   { id: 4, dir: 'east' }
	}]
};

var runApp = function( Backbone, _, Snap, WorkflowView, WorkflowModel ){

	var workflowModel = new WorkflowModel();

	_.each( data.nodes, function( node ){
		workflowModel.addNode( node );
	});

	_.each( data.transitions, function( transition ){
		workflowModel.addTransition( transition );
	})

	var workflowView  = new WorkflowView( {model: workflowModel, el: $( '.svg' ) } );
	workflowView.render();
};

require(
	[
		'backbone', 
		'underscore', 
		'snap-svg', 
		'app/views/workflowView', 
		'app/models/workflowModel'
	], 
	runApp
);