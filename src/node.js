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

		this.dragging = false;
	}

	/*
	 * Gets a list of all parent nodes for this node. This is all nodes
	 * which have an outgoing connection to this node.
	 */
	parents()
	{
		let list = [];

		tree.findConnections(node2 = this)
			.forEach(connection =>
		{
			if (list.indexOf(connection.node1) == -1)
				list.push(connection.node1);
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

		tree.findConnections(node1 = this)
			.forEach(connection =>
		{
			if (list.indexOf(connection.node2) == -1)
				list.push(connection.node2);
		});

		return list;
	}

	/*
	 * Updates this node's position to match the target.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta)
	{
		delta = delta / this.tree.theme.nodeSmoothing;

		if (!dragging)
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
		return Math.abs(this.x - this.xSmooth) + Math.abs(this.y - this.ySmooth)
			+ Math.abs(this.x - this.xNoDrag) + Math.abs(this.y - this.yNoDrag) > 0.01;
	}
}
