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
		this.nodeSmoothing = 0.1;

		/*
		 * When rendering the name of the node, how large should the font be?
		 */
		this.fontSize = 24;

		/*
		 * When rendering the name of the node, what font should be used?
		 */
		this.fontFamily = "Calibri";

		/*
		 * How wide nodes should be rendered. All nodes have a constant width. If
		 * set to 0, the width, of a node is determined based on the length of
		 * string of the name of the node. This value is in world space.
		 */
		this.nodeWidth = 120;

		/*
		 * The smallest height a node should be rendered at. The height of a node
		 * is automatically increased to contain all connection plugs, as well as
		 * the name of the node. this value is in world space.
		 */
		this.nodeMinHeight = 120;

		/*
		 * Determines the width of connection lines in number of pixels. This
		 * value is in world space.
		 */
		this.connectionWidth = 3;

		/*
		 * The default color to use for rendering connections. The default value
		 * can be overriden per connection by assigning the "connectionColor"
		 * property of the output plug type for the connection.
		 */
		this.connectionColor = '#FF7F50';

		/*
		 * The shape style to use when rendering the connection.
		 */
		this.connectionStyle = NodeGraph.ConnectionStyle.Linear;

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
		this.plugBorderSize = 3;

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
		this.backgroundColor = '#777777';

		/*
		 * The default background color for nodes. Can be overriden per node by
		 * assigning the "nodeColor" property of a specific node.
		 */
		this.nodeColor = '#550000';

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
		this.nodeBorderHighlight = '#888888';

		/*
		 * The border color for nodes which are selected.
		 */
		this.nodeBorderSelect = '#FFFF00';

		/*
		 * The thickness, in pixels of the borders for each node. This value is
		 * in world space.
		 */
		this.nodeBorderThickness = 5;
	}
}
