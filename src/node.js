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
	 * position -
	 *     The initial position of the node.
	 * type -
	 *     The type of this node, used for API purposes. Defaults to null. If
	 *     defined, and the "onInit(node)" function is defined, it will be
	 *     called to initialize this node.
	 * name -
	 *     The name of the node. Defaults to 'Node'. If type is defined, and
	 *     "name" is defined for the type, name is retrieved from that.
	 */
	constructor(tree, position, type = null, name = 'Node')
	{
		this.tree = tree;
		this.name = name;
		this.id = NodeGraph.Utils.randomGuid();
		this.type= type;

		this._width = 0;
		this._height = 0;

		this.position = position;
		this.posSmooth = position.copy();
		this.snapPos = position.copy();
		this.inputPlugs = [];
		this.outputPlugs = [];
		this.input = new NodeGraph.Input(this);

		this.dragging = false;
		this.resizing = false;
		this.resizeDir = null;
		this.hover = false;
		this.select = false;

		if (tree.theme.hasGridBehavior)
		{
			let step = tree.theme.gridSize;

			this.position.x = Math.round(this.position.x / step) * step;
			this.position.y = Math.round(this.position.y / step) * step;
			this.posSmooth.setFrom(this.position);
			this.snapPos.setFrom(this.position);
		}

		if (type != null)
		{
			if (type.name != null)
				this.name = type.name;

			if (type.onInit != null)
				type.onInit(this);
		}

		this._width = Math.max(this.width, this.input.recommendedWidth);
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
	 * Updates this node's position to match the target. While dragging, this
	 * node is moved towards the drag position instead of the actual position.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta, force)
	{
		delta = delta / this.tree.theme.nodeSmoothing;

		if (this.dragging)
			this.posSmooth.lerpTo(this.snapPos, delta);
		else
			this.posSmooth.lerpTo(this.position, delta);

		this.input.update();
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
		let width = Math.max(this._width, this.minWidth);

		if (this.tree.theme.hasGridBehavior)
		{
			let step = this.tree.theme.gridSize;
			width = Math.ceil(width / step) * step;
		}

		return width;
	}

	/*
	 * Gets the smallest width this node can be.
	 */
	get minWidth()
	{
		let width = Math.max(this.tree.theme.nodeMinWidth, this.input.minWidth);

		let title = 0;
		{
			let c = this.tree.canvas;
			let ctx = c.getContext("2d");
			ctx.save();

			ctx.font = this.tree.theme.headerFontSize + 'px '
				+ this.tree.theme.headerFontFamily;
			title = ctx.measureText(this.name).width + 20;

			ctx.restore();
		}

		return Math.max(width, title);
	}

	/*
	 * Gets the height of this node in world space.
	 */
	get height()
	{
		let height = Math.max(this._height, this.minHeight);

		if (this.tree.theme.hasGridBehavior)
		{
			let step = this.tree.theme.gridSize;
			height = Math.ceil(height / step) * step;
		}

		return height;
	}

	/*
	 * Gets the smallest height this node can be.
	 */
	get minHeight()
	{
		return Math.max(this.tree.theme.nodeMinHeight,
			this.tree.theme.nodeHeaderSize + this.input.height) + 3;
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
	 * Gets the header color of this node. If this node has a specific color
	 * assigned to it, that color is returned, otherwise the default theme color
	 * is returned.
	 */
	get nodeHeaderColor()
	{
		if (this._nodeHeaderColor == null)
			return this.tree.theme.nodeHeaderColor;

		return this._nodeHeaderColor;
	}

	/*
	 * Sets the header color of this node. Set to null to use the default color.
	 */
	set nodeHeaderColor(value)
	{
		this._nodeHeaderColor = value;
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
		let radius = this.tree.theme.nodeBorderRadius * zoom;
		let header = this.tree.theme.nodeHeaderSize * zoom;

		this.buildNodeShape(ctx, pos, width, height, radius);
		ctx.fillStyle = this.nodeColor;
		ctx.fill();

		this.buildNodeHeaderShape(ctx, pos, width, height, radius, header);
		ctx.fillStyle = this.nodeHeaderColor;
		ctx.fill();

		this.buildNodeShape(ctx, pos, width, height, radius);
		ctx.lineWidth = this.tree.theme.nodeBorderThickness * zoom;

		if (this.select)
			ctx.strokeStyle = this.tree.theme.nodeBorderSelect;
		else if (this.hover)
			ctx.strokeStyle = this.borderColorHighlight;
		else
			ctx.strokeStyle = this.borderColor;

		ctx.stroke();

		for (let i = 0; i < this.inputPlugs.length; i++)
			this.inputPlugs[i].render(ctx);

		for (let i = 0; i < this.outputPlugs.length; i++)
			this.outputPlugs[i].render(ctx);

		ctx.fillStyle = this.tree.theme.headerFontColor;
		ctx.font = this.tree.theme.headerFontSize * zoom + 'px '
			+ this.tree.theme.headerFontFamily;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(this.name, pos.x + width / 2, pos.y + header / 2 * 1.05);

		this.input.render(ctx);
	}

	/*
	 * An internal function for building the path for rendering the node shape.
	 */
	buildNodeShape(ctx, pos, width, height, radius)
	{
		ctx.beginPath();
		ctx.moveTo(pos.x + radius, pos.y);
		ctx.lineTo(pos.x + width - radius, pos.y);
		ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width,
			pos.y + radius);
		ctx.lineTo(pos.x + width, pos.y + height - radius);
		ctx.quadraticCurveTo(pos.x + width, pos.y + height,
			pos.x + width - radius, pos.y + height);
		ctx.lineTo(pos.x + radius, pos.y + height);
		ctx.quadraticCurveTo(pos.x, pos.y + height, pos.x,
			pos.y + height - radius);
		ctx.lineTo(pos.x, pos.y + radius);
		ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
		ctx.closePath();
	}

	/*
	 * An internal function for building the path for rendering the node header.
	 */
	buildNodeHeaderShape(ctx, pos, width, height, radius, header)
	{
		ctx.beginPath();
		ctx.moveTo(pos.x + radius, pos.y);
		ctx.lineTo(pos.x + width - radius, pos.y);
		ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width,
			pos.y + radius);
		ctx.lineTo(pos.x + width, pos.y + header);
		ctx.lineTo(pos.x, pos.y + header);
		ctx.lineTo(pos.x, pos.y + radius);
		ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
		ctx.closePath();
	}

	/*
	 * Checks if the given screen space position is within the bounds of this
	 * node or not. If an addition radius is added, through r, this is counted
	 * as within bounds as well. This is used for hovering on resize events
	 * as well.
	 */
	isInBounds(x, y, r = 5)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		return x >= pos.x  - r && x < pos.x + width + r && y >= pos.y - r
			&& y < pos.y + height + r;
	}

	/*
	 * Checks if the given screen coordinates overlap the edge of this node,
	 * without overlapping and plugs. The thickness of the edge is defined by r.
	 * If the given coords are on the edge of this node, then the resize
	 * direction is returned. Otherwise, 'none' is returned.
	 */
	getResizeDir(x, y, r = 5)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		if (x < pos.x - r || x > pos.x + width + r
			|| y < pos.y - r || y > pos.y + height + r)
			return 'none';

		if (x > pos.x + r && x < pos.x + width - r
			&& y > pos.y + r && y < pos.y + height - r)
			return 'none';

		let plugHover = false;
		this.forEachPlug(plug => plugHover |= plug.isInBounds(x, y));

		if (plugHover)
			return 'none';

		let north = y > pos.y - r && y < pos.y + r;
		let east = x > pos.x + width - r && x < pos.x + width + r;
		let south = y > pos.y + height - r && y < pos.y + height + r;
		let west = x > pos.x - r && x < pos.x + r;

		if (north && !east && !south && !west)
			return 'n-resize';

		if (north && east && !south && !west)
			return 'ne-resize';

		if (north && !east && !south && west)
			return 'nw-resize';

		if (!north && east && !south && !west)
			return 'e-resize';

		if (!north && !east && south && !west)
			return 's-resize';

		if (!north && east && south && !west)
			return 'se-resize';

		if (!north && !east && south && west)
			return 'sw-resize';

		if (!north && !east && !south && west)
			return 'w-resize';

		return 'none';
	}

	/*
	 * Applys a resize event to this node, based on this node's current
	 * resizeDir property.
	 */
	applyResize(dx, dy)
	{
		this._height = Math.max(this.minHeight, this._height);
		this._width = Math.max(this.minWidth, this._width);

		switch (this.resizeDir)
		{
			case 'n-resize':
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._height -= dy;
				break;

			case 'ne-resize':
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._width += dx;
				this._height -= dy;
				break;

			case 'nw-resize':
				dx = Math.min(dx, this._width - this.minWidth);
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._width -= dx;
				this._height -= dy;
				break;

			case 'e-resize':
				this._width += dx;
				break;

			case 's-resize':
				this._height += dy;
				break;

			case 'se-resize':
				this._width += dx;
				this._height += dy;
				break;

			case 'sw-resize':
				dx = Math.min(dx, this._width - this.minWidth);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this._width -= dx;
				this._height += dy;
				break;

			case 'w-resize':
				dx = Math.min(dx, this._width - this.minWidth);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this._width -= dx;
				break;
		}
	}

	/*
	 * Runs a function for all plugs, input and output, attached to this node.
	 */
	forEachPlug(run)
	{
		this.inputPlugs.forEach(run);
		this.outputPlugs.forEach(run);
	}

	destroy()
	{
		this.input.destroy();
	}
}
