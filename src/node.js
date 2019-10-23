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

		this.position = position;
		this.posSmooth = position.copy();
		this.inputPlugs = [];
		this.outputPlugs = [];

		this.dragging = false;

		this.element = document.createElement('div');
		this.element.classList.add('nodegraph-node');
		tree.element.appendChild(this.element);

		this.nameElem = document.createElement('p');
		this.nameElem.innerHTML = name;
		this.element.appendChild(this.nameElem);

		this.inputElem = document.createElement('div');
		this.inputElem.classList.add('nodegraph-inputs');
		this.element.appendChild(this.inputElem);

		this.outputElem = document.createElement('div');
		this.outputElem.classList.add('nodegraph-outputs');
		this.element.appendChild(this.outputElem);

		this.updatePos();
	}

	/*
	 * An internal function which updates the position of the element on the
	 * screen to match the internal position.
	 */
	updatePos()
	{
		let pos = this.posSmooth.toScreen(this.tree.camera);

		this.element.style.left = pos.x + 'px';
		this.element.style.top = pos.y + 'px';
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

		if (!this.dragging)
			this.posSmooth.lerpTo(this.position, delta);

		this.updatePos();
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

		let plugElem = document.createElement('div');
		plugElem.classList.add('nodegraph-plug');
		this.inputElem.appendChild(plugElem);

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

		let plugElem = document.createElement('div');
		plugElem.classList.add('nodegraph-plug');
		this.outputElem.appendChild(plugElem);

		return plug;
	}
}
