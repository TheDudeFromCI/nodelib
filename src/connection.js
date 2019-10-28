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
	 * Gets the color of this connection. This color is determined by the
	 * "connectionColor" property of the output plug type, if defined. If
	 * not defined, the default color determined by the theme is returned.
	 */
	get connectionColor()
	{
		if (this.outputPlug.type == null
			|| this.outputPlug.type.connectionColor == null)
			return this.tree.theme.connectionColor;

		return this.outputPlug.type.connectionColor;
	}

	/*
	 * Gets the color of the end connection, if using a gradient connection.
	 * This color is determined by the "connectionEndColor(connection)"
	 * property of the output plug type, if defined. If not defined, or
	 * returns null, the "connnectionColor" property of this object is return;
	 */
	get connectionEndColor()
	{
		if (this.outputPlug.type == null
			|| this.outputPlug.type.connectionEndColor == null)
			return this.connectionColor;

		let col = this.outputPlug.type.connectionEndColor(this);

		if (col == null)
			return this.connectionColor;

		return col;
	}

	/*
	 * Renders this connection to a canvas. This function should only be
	 * called internally.
	 */
	render(ctx)
	{
		ctx.lineWidth = this.tree.theme.connectionWidth;

		let colA = this.connectionColor;
		let colB = this.connectionEndColor;

		if (colA == colB)
			ctx.strokeStyle = this.connectionColor;
		else
		{
			let pos1 = this.outputPlug.pos.toScreen(this.tree.camera);
			let pos2 = this.inputPlug.pos.toScreen(this.tree.camera);

			let grd = ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
			grd.addColorStop(0, colA);
			grd.addColorStop(1, colB);
			ctx.strokeStyle = grd;
		}

		this.tree.theme.connectionStyle(this.outputPlug, this.inputPlug, ctx,
			this.tree.camera);
	}
}
