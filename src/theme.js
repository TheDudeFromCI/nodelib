/*
 * The theme class is used to determine how the graph should look and feel.
 */
NodeGraph.Theme = class
{
	/*
	 * Creates a new theme object.
	 */
	constructor()
	{
		/*
		 * How smooth to make camera panning and zooming. Smaller values are more
		 * responsive but jittery, while larger values are slower and smoother.
		 */
		this.cameraSmoothing = 0.08;

		/*
		 * How smooth to make node dragging. Smaller values are more responsive
		 * but jittery, while larger values are slower and smoother.
		 */
		this.nodeSmoothing = 0.08;

		/*
		 * The font size, in world space, to render the header with.
		 */
		this.headerFontSize = 16;

		/*
		 * The font size, in world space, to render plug names with.
		 */
		this.plugFontSize = 8;

		/*
		 * The font to use when rendering the header name for nodes.
		 */
		this.headerFontFamily = "Calibri";

		/*
		 * The font to use when rendering the plug names for nodes.
		 */
		this.plugFontFamily = "Calibri";

		/*
		 * The color of header name text for nodes.
		 */
		this.headerFontColor = '#CCCCCC';

		/*
		 * The color of plug name text for nodes.
		 */
		this.plugFontColor = '#AAAAAA';

		/*
		 * How wide nodes should be rendered. All nodes have a constant width. If
		 * set to 0, the width, of a node is determined based on the length of
		 * string of the name of the node. This value is in world space. The
		 * width of a node is rounded up to the next grid size, if grids are
		 * enabled.
		 */
		this.nodeWidth = 150;

		/*
		 * The smallest height a node should be rendered at. The height of a node
		 * is automatically increased to contain all connection plugs, as well as
		 * the name of the node. this value is in world space. The height of a
		 * node is increased to the next grid size, if grid behavior is enabled.
		 */
		this.nodeMinHeight = 150;

		/*
		 * Determines the width of connection lines in number of pixels. This
		 * value is in world space.
		 */
		this.connectionWidth = 2;

		/*
		 * The default color to use for rendering connections. The default value
		 * can be overriden per connection by assigning the "connectionColor"
		 * property of the output plug type for the connection.
		 */
		this.connectionColor = '#FF7F50';

		/*
		 * The shape style to use when rendering the connection.
		 */
		this.connectionStyle = NodeGraph.ConnectionStyle.SoftBezier;

		/*
		 * Assigns the radius for how large a plug should be rendered on a node.
		 * This value is in world space.
		 */
		this.plugRadius = 8;

		/*
		 * When laying out plugs on a node, this is used to determine how close
		 * or far they should be spaced out in pixels. This value is the smallest
		 * distance two plugs can be, counting from the center of one plug to the
		 * center of the other. This value is in world space.
		 */
		this.plugSpacing = 20;

		/*
		 * The size, in pixels, of the border for each plug. This value is in
		 * world space.
		 */
		this.plugBorderSize = 1.5;

		/*
		 * The default background color for plugs. Can be overriden per plug by
		 * assigning the "plugColor" property of a plug type.
		 */
		this.plugColor = '#777777';

		/*
		 * The default border color for plugs. Can be overriden per plug by
		 * assigning the "plugBorderColor" property of a plug type.
		 */
		this.plugBorderColor = '#555555';

		/*
		 * The default border color for plugs when moused over. Can be overriden
		 * per plug by assigning the "borderColorHighlight" property of a plug
		 * type.
		 */
		this.plugBorderHighlight = '#999999';

		/*
		 * The fillstyle for the background. Note, using transparent colors has
		 * been known to sometimes ignore mouse events and pass events to under
		 * lying elements.
		 */
		this.backgroundColor = '#121212';

		/*
		 * The default background color for nodes. Can be overriden per node by
		 * assigning the "nodeColor" property of a specific node.
		 */
		this.nodeColor = '#552222';

		/*
		 * The default border color for nodes. Can be overriden per node by
		 * assigning the "bordercolor" property of a specific node.
		 */
		this.nodeBorderColor = '#555555';

		/*
		 * The default border color for nodes when moused over. Can be overriden
		 * per node by assigning the "borderColorHighlight" property of a
		 * specific node.
		 */
		this.nodeBorderHighlight = '#777777';

		/*
		 * The border color for nodes which are selected.
		 */
		this.nodeBorderSelect = '#999955';

		/*
		 * The default background color of the header for a node. Can be
		 * overriden per node by assigning the "nodeColor" property of a
		 * specific node.
		 */
		this.nodeHeaderColor = '#441111';

		/*
		 * The number of pixels, in world space, of the height of the header
		 * for nodes.
		 */
		this.nodeHeaderSize = 37;

		/*
		 * The thickness, in pixels of the borders for each node. This value is
		 * in world space.
		 */
		this.nodeBorderThickness = 2;

		/*
		 * Sets, in world space pixels, how round the corners of the nodes should
		 * be. If 0, corners are rectangular.
		 */
		this.nodeBorderRadius = 16;

		/*
		 * The size of the grid to use when moving nodes. Nodes are snapped to
		 * the nearest grid block. When set to 0, the grid is disabled.
		 */
		this.gridSize = 50;

		/*
		 * If true, grids are only rendered and have no effect on behavior.
		 */
		this.gridRenderOnly = false;

		/*
		 * The number of grid segements before rendering it as a major grid line.
		 * If set to 0, major grid segments are disabled. These have no effect,
		 * and are visual only. These do not render if gridSize is set to 0.
		 */
		this.gridMajorSegments = 4;

		/*
		 * The color of the grid to render.
		 */
		this.gridColor = '#242424';

		/*
		 * The color of major grid segments to render.
		 */
		this.gridMajorColor = '#363636';

		/*
		 * The smallest number of pixels, in screen space, to render a grid
		 * segement at. If a grid is determined to be rendered smaller than
		 * this value, such as by zooming out, the grid will be rendered at
		 * the scale of the grid major segements, and grid major segements
		 * are scaled up to the new grid size. If set to 0, grid outward
		 * resizing is disabled.
		 */
		this.gridMinRenderSize = 25;

		/*
		 * This value is similar to gridMinRenderSize, however, using the reverse
		 * effect. I.e., zooming in instead of zooming out. If set to 0, grid
		 * inward resizing is disabled.
		 */
		this.gridMaxRenderSize = 100;
	}

	/*
	 * Returns true if grids should be rendered.
	 */
	get shouldRenderGrid()
	{
		return this.gridSize > 0;
	}

	/*
	 * Returns true if grid snapping behavior should be emulated.
	 */
	get hasGridBehavior()
	{
		return this.gridSize > 0 && !this.gridRenderOnly;
	}

	/*
	 * Returns true if major grid segements should be rendered.
	 */
	get hasMajorGrid()
	{
		return this.shouldRenderGrid && this.gridMajorSegments > 0;
	}

	/*
	 * Returns true if zooming in to a grid makes segements render
	 * smaller.
	 */
	get shouldZoomInGrid()
	{
		return this.hasMajorGrid && this.gridMaxRenderSize > 0;
	}

	/*
	 * Returns true if zooming out of a grid makes segements render
	 * larger.
	 */
	get shouldZoomOutGrid()
	{
		return this.hasMajorGrid && this.gridMinRenderSize > 0;
	}
}
