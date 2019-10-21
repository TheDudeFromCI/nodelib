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
		this.nodeSmoothing = 0.3;

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
		 * string of the name of the node.
		 */
		this.nodeWidth = 120;

		/*
		 * The smallest height a node should be rendered at. The height of a node
		 * is automatically increased to contain all connection plugs, as well as
		 * the name of the node.
		 */
		this.nodeMinHeight = 120;

		/*
		 * Determines the width of connection lines in number of pixels.
		 */
		this.connectionWidth = 3;

		/*
		 * Assigns the radius for how large a plug should be rendered on a node.
		 */
		this.plugRadius = 5;

		/*
		 * When laying out plugs on a node, this is used to determine how close
		 * or far they should be spaced out in pixels. This value is the smallest
		 * distance two plugs can be, counting from the center of one plug to the
		 * center of the other.
		 */
		this.plugSpacing = 8;
	}
}
