/*
 * A connection represents a relationship between two nodes, and two plugs
 * for those nodes. A connection may exist by connecting the output plug of
 * one node to the input plug of another node.
 */
NodeGraph.Connection = class
{
	/*
	 * Creates a new connection object. An error is thrown if the connection
	 * is considered invalid by the given plugs, or if either plug is null.
	 */
	constructor(tree, outputPlug, inputPlug)
	{
		if (outputPlug == null || inputPlug == null)
			throw "Cannot create a connection using null plugs!";

		if (!outputPlug.canConnectTo(inputPlug))
			throw "A connection is not valid here!";

		this.tree = tree;
		this.outputPlug = outputPlug;
		this.inputPlug = inputPlug;
	}

	/*
	 * Renders this connection to a canvas. This function should only be
	 * called internally.
	 */
	render(ctx)
	{
		ctx.lineWidth = this.tree.theme.connectionWidth;
		ctx.strokeStyle = this.tree.theme.connectionColor;
		
		this.tree.theme.connectionStyle(this.outputPlug, this.inputPlug, ctx,
			this.tree.camera);
	}
}
