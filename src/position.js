/*
 * A position is a point in 2D space. This can be either a world space or screen
 * space position.
 */
NodeGraph.Position = class
{
	/*
	 * Creates a new position object.
	 *
	 * x -
	 *     The X coord.
	 * y -
	 *     The Y coord.
	 */
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	/*
	 * Converts this position into a world space position, assuming this position
	 * represents a screen space position. This function returns a new position
	 * object with the converted coordinates.
	 *
	 * camera -
	 *     The camera to use when converting.
	 */
	toWorld(camera)
	{
		let pos = new NodeGraph.Position(this.x, this.y);

		pos.x = (pos.x + camera.xSmooth) / camera.zoomSmooth;
		pos.y = (pos.y + camera.ySmooth) / camera.zoomSmooth;

		return pos;
	}

	/*
	 * Converts this position into a screen space position, assuming this
	 * position represents a world space position. This function returns a new
	 * position object with the converted coordinates.
	 *
	 * camera -
	 *     The camera to use when converting.
	 */
	toScreen(camera)
	{
		let pos = new NodeGraph.Position(this.x, this.y);

		pos.x = pos.x * camera.zoomSmooth - camera.xSmooth;
		pos.y = pos.y * camera.zoomSmooth - camera.ySmooth;

		return pos;
	}

	/*
	 * Returns a copy of this position object.
	 */
	copy()
	{
		return new NodeGraph.Position(this.x, this.y);
	}

	/*
	 * Lerps the coordinates of this position object towards another position
	 * object using a clamped lerp function.
	 *
	 * pos -
	 *     The position to move towards.
	 * t -
	 *     The percentage of the distance to move.
	 */
	lerpTo(pos, t)
	{
		this.x = NodeGraph.Utils.lerp(this.x, pos.x, t);
		this.y = NodeGraph.Utils.lerp(this.y, pos.y, t);
	}

	/*
	 * Calculates the distance between this point and another point.
	 * 
	 * pos -
	 *     The other point.
	 */
	distanceTo(pos)
	{
		let dx = this.x - pos.x;
		let dy = this.y - pos.y;

		return Math.sqrt(dx * dx + dy * dy);
	}
}
