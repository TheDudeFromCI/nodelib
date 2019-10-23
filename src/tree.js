/*
 * A tree is the core structure of a node graph. This is the graph itself which
 * holds all the nodes and connections to be rendered.
 */
NodeGraph.Tree = class
{
	/*
	 * Creates a new tree object. This tree will also create its own camera
	 * object.
	 *
	 * element -
	 *     The element this tree should be attached to. This element should be
	 *     a div and will become the tree object.
	 * theme -
	 *     The look and feel of this node graph tree.
	 */
	constructor(element, theme)
	{
		this.element = element;
		this.theme = theme;

		this.nodes = [];
		this.connections = [];
		this.camera = new NodeGraph.Camera(theme);

		this.lastFrame = 0;
		this.repaint = false;

		requestAnimationFrame(time => this.animation(time));
	}

	animation(time)
	{
		let delta = (time - this.lastFrame) / 1000.0;
		this.lastFrame = time;

		if (this.needsUpdate())
			this.update(delta);

		requestAnimationFrame(time => this.animation(time));
	}

	/*
	 * Adds a node to this node graph tree. This will create a new node object
	 * with the given properties. Returns the newly created node.
	 *
	 * name -
	 *     The name of the node.
	 * position -
	 *     The initial position of the node. Defaults to (0, 0) in world space.
	 * type -
	 *     The type of this node, used for API purposes. Defaults to null.
	 */
	addNode(name, position = new NodeGraph.Position(0, 0), type = null)
	{
		let node = new NodeGraph.Node(this, name, position, type);
		this.nodes.push(node);

		return node;
	}

	/*
	 * Adds a connection to this tree. An error is thrown if the connection
	 * is not considered valid, or contains nodes which do not exist within this
	 * tree. Returns the newly created connection object.
	 *
	 * outputPlug -
	 *     The plug which is sending the connection.
	 * inputPlug -
	 *     The plug which is recieving the connection.
	 */
	addConnection(outputPlug,  inputPlug)
	{
		let connection = new NodeGraph.Connection(outputPlug, inputPlug);

		if (!this.contains(outputPlug.node))
			throw "Connection exists outside of tree!";

		this.connections.push(connection);

		return connection;
	}

	/*
	 * Checks if a node or connection is part of this tree or not. Returns true
	 * if the node or connection is part of this tree, false otherwise.
	 * 
	 * node -
	 *     The node, or connection, to check for.
	 */
	contains(node)
	{
		if (node instanceof NodeGraph.Connection)
			return this.connections.indexOf(connection) != -1;

		return this.nodes.indexOf(node) != -1;
	}

	/*
	 * Removes a node from this tree. All connections which reference this node
	 * are also removed. Does nothing if the node is not part of this tree.
	 *
	 * node -
	 *     The node to remove.
	 */
	removeNode(node)
	{
		let nodeIndex = this.nodes.indexOf(node);
		if (nodeIndex == -1)
			return;

		for (let i = 0; i < this.connections.length; i++)
		{
			if (this.connections[i].node1 === node
				|| this.connections[i].node2 === node)
			{
				this.removeConnection(this.connections[i]);
				i--;
			}
		}

		this.nodes.splice(nodeIndex, 1);

		this.element.removeChild(node.element);
	}

	/*
	 * Removes a connection from this tree. Does nothing if the connection is
	 * not part of this tree.
	 *
	 * connection -
	 *     The connection to remove.
	 */
	removeConnection(connection)
	{
		let connectionIndex = this.connections.indexOf(connection);
		if (connectionIndex != -1)
			this.connections.splice(connectionIndex, 1);
	}

	/*
	 * Updates the camera and all nodes attached to this tree which need to be
	 * updated.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta)
	{
		this.repaint = false;

		this.camera.update(delta);

		for (let i = 0; i < this.nodes.length; i++)
			this.nodes[i].update(delta);
	}

	/*
	 * Checks if any elements within the tree need to be updated. Includes the
	 * camera and all nodes. Returns true if at least one element requires an
	 * update, false otherwise.
	 */
	needsUpdate()
	{
		if (this.repaint)
			return true;

		if(this.camera.needsUpdate())
			return true;

		for (let i = 0; i < this.nodes.length; i++)
			if(this.nodes[i].needsUpdate())
				return true;

		return false;
	}

	/*
	 * Finds all connections which match the given search filters. If no search
	 * filters are present, all connections are returned.
	 *
	 * node1 -
	 *     The node outputing the connection.
	 * node2 -
	 *     The node recieveing the connection.
	 * outputPlug -
	 *     The plug outputing the connection.
	 * inputPlug -
	 *     The plug recieveing the connection.
	 */
	findConnections({node1 = null, node2 = null, outputPlug = null, inputPlug = null})
	{
		let list = [];

		for (let i = 0; i < this.connections.length; i++)
		{
			let connection = this.connections[i];

			if (node1 != null && connection.outputPlug.node !== node1)
				continue;

			if (node2 != null && connection.inputPlug.node !== node2)
				continue;

			if (outputPlug != null && connection.outputPlug !== outputPlug)
				continue;

			if (inputPlug != null && connection.inputPlug !== inputPlug)
				continue;

			list.push(connection);
		}

		return list;
	}
}
