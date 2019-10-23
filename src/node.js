/*
 * A node is the main objects which exist within a node graph tree. These object
 * are boxes, often with a name and type, which connect to each other to form
 * the tree.
 */
NodeGraph.Node = class
{
	/*
	 * Creates a new node object. This should be called internally only. Please
	 * use "tree.addNode(...)" instead.
	 *
	 * tree -
	 *     The tree which owns this node.
	 * name -
	 *     The name of the node.
	 * position -
	 *     The initial position of the node.
	 * type -
	 *     The type of this node, used for API purposes. Defaults to null.
	 */
	constructor(tree, name, position, type = null)
	{
		this.tree = tree;
		this.name = name;
		this.id = NodeGraph.Utils.randomGuid();

		this.position = position;
		this.posSmooth = position.copy();
		this.inputPlugs = [];
		this.outputPlugs = [];

		this.dragging = false;
		this.hover = false;
	}

	/*
	 * Gets a list of all parent nodes for this node. This is all nodes
	 * which have an outgoing connection to this node.
	 */
	parents()
	{
		let list = [];

		let ref = this;
		tree.findConnections({node2: ref})
			.forEach(connection =>
		{
			if (list.indexOf(connection.outputPlug.node) == -1)
				list.push(connection.outputPlug.node);
		});

		return list;
	}


	/*
	 * Gets a list of all child nodes for this node. This is all nodes which
	 * have an incoming connection from this node.
	 */
	children()
	{
		let list = [];

		let ref = this;
		tree.findConnections({node1: ref})
			.forEach(connection =>
		{
			if (list.indexOf(connection.inputPlug.node) == -1)
				list.push(connection.inputPlug.node);
		});

		return list;
	}

	isAncestorOf(node)
	{
		if (this === node)
			return true;

		let children = this.children();
		for (let i = 0; i < children.length; i++)
			if (children[i].isAncestorOf(node))
				return true;

		return false;
	}

	/*
	 * Updates this node's position to match the target.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta, force)
	{
		delta = delta / this.tree.theme.nodeSmoothing;

		this.posSmooth.lerpTo(this.position, delta);
	}

	/*
	 * Checks if this node needs to be updated or not. If false, the node
	 * will move to little for the rendered image to be effected. (less than
	 * 1/10th of a pixel.) Returns true if the node should be updated and
	 * rerendered. False otherwise.
	 */
	needsUpdate()
	{
		return this.position.toScreen(this.tree.camera).distanceSquared(
			this.posSmooth.toScreen(this.tree.camera)) > 1;
	}

	/*
	 * Creates a new input plug for this node and attaches it. Returns the
	 * newly created plug.
	 *
	 * name -
	 *     The name of the new plug. Defaults to an empty string.
	 * type -
	 *     The type of the plug. Defaults to null. See NodeGraph.Plug for
	 *     for information.
	 */
	addInput(name = '', type = null)
	{
		let plug = new NodeGraph.Plug(this, true, name, type);
		this.inputPlugs.push(plug);

		this.tree.repaint = true;

		return plug;
	}

	/*
	 * Creates a new output plug for this node and attaches it. Returns the
	 * newly created plug.
	 *
	 * name -
	 *     The name of the new plug. Defaults to an empty string.
	 * type -
	 *     The type of the plug. Defaults to null. See NodeGraph.Plug for
	 *     for information.
	 */
	addOutput(name = '', type = null)
	{
		let plug = new NodeGraph.Plug(this, false, name, type);
		this.outputPlugs.push(plug);

		this.tree.repaint = true;

		return plug;
	}

	/*
	 * Gets the width of this node in world space.
	 */
	get width()
	{
		return this.tree.theme.nodeWidth;
	}

	/*
	 * Gets the height of this node in world space.
	 */
	get height()
	{
		return Math.max(this.tree.theme.nodeMinHeight,
			Math.max(this.inputPlugs.length, this.outputPlugs.length)
			* this.tree.theme.plugSpacing);
	}

	/*
	 * Gets the color of this node. If this node has a specific color assigned
	 * to it, that color is returned, otherwise the default theme color is
	 * returned.
	 */
	get nodeColor()
	{
		if (this._nodeColor == null)
			return this.tree.theme.nodeColor;

		return this._nodeColor;
	}

	/*
	 * Sets the color of this node. Set to null to use the default color.
	 */
	set nodeColor(value)
	{
		this._nodeColor = value;
	}

	/*
	 * Gets the border color of this node. If this node has a specific border
	 * color assigned to it, that color is returned, otherwise the default theme
	 * color is returned.
	 */
	get borderColor()
	{
		if (this._borderColor == null)
			return this.tree.theme.nodeBorderColor;

		return this._nodeBorderColor;
	}

	/*
	 * Sets the border color of this node. Set to null to use the default color.
	 */
	set borderColor(value)
	{
		this._nodeBorderColor = value;
	}

	/*
	 * Gets the border color of this node. If this node has a specific border
	 * color assigned to it, that color is returned, otherwise the default theme
	 * color is returned.
	 */
	get borderColorHighlight()
	{
		if (this._borderColorHighlight == null)
			return this.tree.theme.nodeBorderHighlight;

		return this._nodeBorderColorHighlight;
	}

	/*
	 * Sets the border color of this node. Set to null to use the default color.
	 */
	set borderColorHighlight(value)
	{
		this._nodeBorderColorHighlight = value;
	}

	/*
	 * Renders this node onto the canvas object. This function should only be
	 * used internally.
	 *
	 * ctx -
	 *     The canvas context to render to.
	 */
	render(ctx)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		ctx.fillStyle = this.nodeColor;
		ctx.fillRect(pos.x, pos.y, width, height);

		if (this.select)
			ctx.strokeStyle = this.tree.theme.nodeBorderSelect;
		else if (this.hover)
			ctx.strokeStyle = this.borderColorHighlight;
		else
			ctx.strokeStyle = this.borderColor;

		ctx.lineWidth = this.tree.theme.nodeBorderThickness * zoom;
		ctx.strokeRect(pos.x, pos.y, width, height);

		for (let i = 0; i < this.inputPlugs.length; i++)
			this.inputPlugs[i].render(ctx);

		for (let i = 0; i < this.outputPlugs.length; i++)
			this.outputPlugs[i].render(ctx);
	}

	/*
	 * Checks if the given screen space position is within the bounds of this
	 * node or not.
	 */
	isInBounds(x, y)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		return x >= pos.x && x < pos.x + width && y >= pos.y
			&& y < pos.y + height;
	}

	/*
	 * Runs a function for all plugs, input and output, attached to this node.
	 */
	forEachPlug(run)
	{
		this.inputPlugs.forEach(run);
		this.outputPlugs.forEach(run);
	}
}
