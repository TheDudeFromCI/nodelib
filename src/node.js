/*
 * A node is the main objects which exist within a node graph tree. These object
 * are boxes, often with a name and type, which connect to each other to form
 * the tree.
 */
NodeGraph.Node = class
{
	/*
	 * Creates a new node object.
	 *
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

		this.position = position;
		this.posSmooth = position.copy();
	}

	draw(ctx, camera)
	{
		let x0, y0;
		if (dragging && this.selected && this.snapTo != null)
		{
			x0 = camera.camX(this.snapTo.xSmooth + this.snapTo.width() + CONNECTION_EDGE_BUFFER * 2);
			y0 = camera.camY(this.snapTo.ySmooth);

			ctx.font = (FONT_SIZE * tree.camera.zoomSmooth) + 'px Calibri';
		}
		else
		{
			x0 = camera.camX(this.xSmooth);
			y0 = camera.camY(this.ySmooth);
		}

		ctx.fillStyle = '#aaaaaa';
		ctx.fillText(this.name, x0, y0);
	}

	parents()
	{
		for (tree.)

		for (let i = 0; i < tree.connections.length; i++)
		{
			if (tree.connections[i].node2 === this)
				return tree.connections[i].node1;
		}

		return null;
	}

	children()
	{
		let list = [];

		for (let i = 0; i < tree.connections.length; i++)
		{
			if (tree.connections[i].node1 === this)
				list.push(tree.connections[i].node2);
		}

		return list;
	}

	update(delta)
	{
		delta = this.clamp(delta / NODE_SMOOTHING, 0, 1);

		this.xNoDrag = this.lerp(this.xNoDrag, this.x, delta);
		this.yNoDrag = this.lerp(this.yNoDrag, this.y, delta);

		if (dragging && this.selected)
			return;

		this.xSmooth = this.lerp(this.xSmooth, this.x, delta);
		this.ySmooth = this.lerp(this.ySmooth, this.y, delta);
	}

	lerp(a, b, t)
	{
		return a * (1 - t) + b * t;
	}

	clamp(x, min, max)
	{
		return Math.min(Math.max(x, min), max);
	}

	needsUpdate()
	{
		return Math.abs(this.x - this.xSmooth) + Math.abs(this.y - this.ySmooth)
			+ Math.abs(this.x - this.xNoDrag) + Math.abs(this.y - this.yNoDrag) > 0.01;
	}

	width()
	{
		let canvas = document.getElementById("tech-tree-canvas");
		let ctx = canvas.getContext("2d");
		ctx.font = FONT_SIZE + 'px Calibri';
		return ctx.measureText(this.name).width;
	}

	screenWidth()
	{
		let canvas = document.getElementById("tech-tree-canvas");
		let ctx = canvas.getContext("2d");
		ctx.font = (FONT_SIZE * tree.camera.zoomSmooth) + 'px Calibri';
		return ctx.measureText(this.name).width;
	}
}
