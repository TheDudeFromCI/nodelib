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
	 * worldSpace -
	 *     Whether this position is in world space or screen space. True for
	 *     world space, false for screen space. Defaults to true.
	 */
	constructor(x, y, worldSpace = true)
	{
		this.x = x;
		this.y = y;
		this.worldSpace = worldSpace;
	}

	/*
	 * Converts this position into a world space position, if this position
	 * represents a screen space position. This function returns a new position
	 * object with the converted coordinates. If this position is already in
	 * world space, a copy of this position is returned.
	 *
	 * camera -
	 *     The camera to use when converting.
	 */
	toWorld(camera)
	{
		let pos = new NodeGraph.Position(this.x, this.y);

		if (!this.worldSpace)
		{
			pos.x = (pos.x + camera.xSmooth) / camera.zoomSmooth;
			pos.y = (pos.y + camera.ySmooth) / camera.zoomSmooth;

		}

		return pos;
	}

	/*
	 * Converts this position into a screen space position, if this position
	 * represents a world space position. This function returns a new position
	 * object with the converted coordinates. If this position is already in
	 * screen space, a copy of this position is returned.
	 *
	 * camera -
	 *     The camera to use when converting.
	 */
	toScreen(camera)
	{
		let pos = new NodeGraph.Position(this.x, this.y);

		if (this.worldSpace)
		{
			pos.x = pos.x * camera.zoomSmooth - camera.xSmooth;
			pos.y = pos.y * camera.zoomSmooth - camera.ySmooth;
		}

		return pos;
	}

	/*
	 * Returns a copy of this position object.
	 */
	copy()
	{
		return new NodeGraph.Position(this.x, this.y, this.worldSpace);
	}

	/*
	 * Lerps the coordinates of this position object towards another position
	 * object using a clamped lerp function. An error is thrown if positions
	 * exist in different spaces.
	 *
	 * pos -
	 *     The position to move towards.
	 * t -
	 *     The percentage of the distance to move.
	 */
	lerpTo(pos, t)
	{
		if (this.worldSpace != pos.worldSpace)
			throw "Cannot lerp to position in different space!";

		this.x = NodeGraph.Utils.lerp(this.x, pos.x, t);
		this.y = NodeGraph.Utils.lerp(this.y, pos.y, t);
	}

	/*
	 * Calculates the distance between this point and another point. An error is
	 * thrown if positions are thrown in different spaces.
	 * 
	 * pos -
	 *     The other point.
	 */
	distanceTo(pos)
	{
		return Math.sqrt(this.distanceSquared(pos));
	}

	/*
	 * Calculates the distance squared between this point and another point. An
	 * error is thrown if positions exist in different spaces.
	 * 
	 * pos -
	 *     The other point.
	 */
	distanceSquared(pos)
	{
		if (this.worldSpace != pos.worldSpace)
			throw "Cannot get distance to position in different space!";

		let dx = this.x - pos.x;
		let dy = this.y - pos.y;

		return dx * dx + dy * dy;
	}

	/*
	 * Sets this positions coordinates and space to be equal to another position
	 * safely.
	 *
	 * pos -
	 *     The position to copy the coodinates and space from.
	 */
	setFrom(pos)
	{
		this.x = pos.x;
		this.y = pos.y;
		this.worldSpace = pos.worldSpace;
	}

	/*
	 * Shifts this position by a given x and y delta. This is equal to a
	 * translate event.
	 */
	shift(x, y)
	{
		this.x += x;
		this.y += y;
	}

	/*
	 * Assigns the x and y coordinates of this position directly.
	 */
	setTo(x, y)
	{
		this.x = x;
		this.y = y;
	}
}
