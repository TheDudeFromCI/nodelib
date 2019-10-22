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
		if (this.isInput == plug)
			return false;

		if (this.isInput)
			return plug.canConnectTo(this);

		if (this.node.tree !== plug.node.tree)
			return false;

		if (this.node.tree.findConnections(inputPlug = plug).length > 0)
			return false;

		if (this.node.isAncestorOf(plug.node))
			return false;

		if (this.type != null
			&& plug.type != null
			&& !this.type.canConnectTo(plug.type))
				return false;

		return true;
	}
}
