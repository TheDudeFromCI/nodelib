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
	 * theme -
	 *     The look and feel of this node graph tree.
	 */
	constructor(theme)
	{
		this.theme = theme;

		this.nodes = [];
		this.connections = [];
		this.camera = new NodeGraph.Camera();
	}

	/*
	 * Adds a node to this node graph tree. Does nothing if the node is already
	 * within this tree.
	 *
	 * node -
	 *     The node to add.
	 */
	addNode(node)
	{
		if (this.contains(node))
			return;

		this.nodes.push(node);
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
	findConnections(node1 = null, node2 = null, outputPlug = null, inputPlug = null)
	{
		let list = [];

		for (let i = 0; i < this.connections.length; i++)
		{
			let connection = this.connections[i];

			if (node1 != null && connection.node1 !== node1)
				continue;

			if (node2 != null && connection.node2 !== node2)
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
