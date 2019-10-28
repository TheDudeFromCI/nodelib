/*
 * A plug is a port, either incoming or outgoing, for a node to connect to
 * another node. Generally, an incomming port can only have a single connection
 * while an outgoing port can have any number of connections.
 */
NodeGraph.Plug = class
{
	/*
	 * Creates a new plug object.
	 *
	 * node -
	 *     The node which owns this plug,
	 * isInput -
	 *     True if this plug is an input plug, false if it's an output plug.
	 * name -
	 *     The name of this plug. Defaults to an empty string.
	 * type -
	 *     The optional type for this plug. This is used to determine which
	 *     plugs can connect to other plugs. A connection is only allowed if
	 *     the type for the output plug returns true when "canConnectTo(type)"
	 *     returns true, where type is the the type of the input plug. If either
	 *     plug has a null type, the connection is always allowed.
	 */
	constructor(node, isInput, name = '', type = null)
	{
		this.node = node;
		this.isInput = isInput;
		this.name = name;
		this.type = type;

		this.hover = false;

		if (type == null || type.createSetting == null || !isInput)
			this.setting = new NodeGraph.PlainTextSetting(node.tree,
				this.name, !isInput);
		else
			this.setting = type.createSetting(this);

		this.node.input.addSetting(this.setting);
		this.setting.plug = this;
	}

	/*
	 * Checks if this plug can connect to another plug. This checks for circular
	 * dependencies, connection count, and plug type validation.
	 *
	 * Plug types are considered valid if with plug has a null type, or if the
	 * plug type for the output plug returns true when "canConnectTo(type)"
	 * returns true, where type is the type of the input plug.
	 */
	canConnectTo(plug)
	{
		if (!this.canReplaceConnection(plug))
			return false;

		if (this.node.tree.findConnections({inputPlug: plug}).length > 0)
			return false;

		return true;
	}

	canReplaceConnection(plug)
	{
		if (this.isInput == plug.isInput)
			return false;

		if (this.isInput)
			return plug.canConnectTo(this);

		if (this.node.tree !== plug.node.tree)
			return false;

		if (plug.node.isAncestorOf(this.node))
			return false;

		if (this.type != null
			&& plug.type != null
			&& !this.type.canConnectTo(plug.type))
				return false;

		return true;
	}

	/*
	 * Gets the color of this plug, as determined by the plug type. If the plug
	 * type is null, or does not have the "plugColor" property, the default
	 * color is returned.
	 */
	get plugColor()
	{
		if (this.type == null || this.type.plugColor == null)
			return this.node.tree.theme.plugColor;

		return this.type.plugColor;
	}

	/*
	 * Gets the border color of this plug, as determined by the plug type. If the
	 * plug type is null, or does not have the "plugBorderColor" property, the
	 * default color is returned.
	 */
	get plugBorderColor()
	{
		if (this.type == null || this.type.plugBorderColor == null)
			return this.node.tree.theme.plugBorderColor;

		return this.type.plugBorderColor;
	}

	/*
	 * Gets the border color of this plug when moused over, as determined by the
	 * plug type. If the plug type is null, or does not have the
	 * "plugBorderHighlight" property, the default color is returned.
	 */
	get plugBorderHighlight()
	{
		if (this.type == null || this.type.plugBorderHighlight == null)
			return this.node.tree.theme.plugBorderHighlight;

		return this.type.plugBorderHighlight;
	}

	/*
	 * Gets the x position of this plug in world space.
	 */
	get x()
	{
		if (this._x != null)
			return this._x;

		/*
		if (this.isInput)
			return this.node.posSmooth.x;

		return this.node.posSmooth.x + this.node.width;
		*/

		return this.node.input.plugPositions()[this.isInput ? 'inputs'
			: 'outputs'].filter(o => o.plug === this)[0].x;
	}

	/*
	 * Gets the y position of this plug in world space.
	 */
	get y()
	{
		if (this._y != null)
			return this._y;

		/*
		let list = this.isInput ?
			this.node.inputPlugs : this.node.outputPlugs;

		return this.node.posSmooth.y
			+ this.node.height / 2
			+ (list.indexOf(this) + 1)
			* this.node.tree.theme.plugSpacing
			- (list.length + 1)
			* this.node.tree.theme.plugSpacing / 2;
		*/

		return this.node.input.plugPositions()[this.isInput ? 'inputs'
			: 'outputs'].filter(o => o.plug === this)[0].y;
	}

	/*
	 * Gets the x and y position of this plug as a position object, in world
	 * space.
	 */
	get pos()
	{
		return new NodeGraph.Position(this.x, this.y);
	}

	/*
	 * Checks if the given screen space position overlaps the bounds of this
	 * plug.
	 */
	isInBounds(x, y)
	{
		let radius = this.node.tree.theme.plugRadius;
		radius = radius * radius * this.node.tree.camera.zoomSmooth;

		return this.pos.toScreen(this.node.tree.camera)
			.distanceSquared(new NodeGraph.Position(x, y)) < radius;
	}

	/*
	 * Renders this plug to the screen. This is an internal function and
	 * should not be called externally.
	 */
	render(ctx)
	{
		let zoom = this.node.tree.camera.zoomSmooth;
		let radius = this.node.tree.theme.plugRadius * zoom;
		let plugBorderSize = this.node.tree.theme.plugBorderSize * zoom;
		let pos = this.pos.toScreen(this.node.tree.camera);

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 2 * Math.PI, false);
		ctx.fillStyle = this.plugColor;
		ctx.fill();

		if (this.hover)
			ctx.strokeStyle = this.plugBorderHighlight;
		else
			ctx.strokeStyle = this.plugBorderColor;

		ctx.lineWidth = plugBorderSize;
		ctx.stroke();
	}
}
