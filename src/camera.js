/*
 * The camera class is used for panning and zooming around the node graph to
 * display different areas.
 */
NodeGraph.Camera = class
{
	/*
	 * Creates a new camera object.
	 *
	 * theme -
	 *     The theme to use when panning and controlling the camera.
	 */
	constructor(theme)
	{
		this.theme = theme;

		this.x = 0;
		this.y = 0;
		this.zoom = 1;

		this.xSmooth = this.x;
		this.ySmooth = this.y;
		this.zoomSmooth = this.zoom;
	}

	/*
	 * Updates this camera's position and zoom to match the target.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta)
	{
		let lerp = NodeGraph.Utils.lerp;

		delta = delta / this.theme.cameraSmoothing;

		this.xSmooth = lerp(this.xSmooth, this.x, delta);
		this.ySmooth = lerp(this.ySmooth, this.y, delta);
		this.zoomSmooth = lerp(this.zoomSmooth, this.zoom, delta);
	}

	/*
	 * Gets the Screen X position for a given World X position.
	 *
	 * x -
	 *     The World X position.
	 */
	camX(x)
	{
		return x * this.zoomSmooth - this.xSmooth;
	}

	/*
	 * Gets the Screen Y position for a given World Y position.
	 *
	 * y -
	 *     The World Y position.
	 */
	camY(y)
	{
		return y * this.zoomSmooth - this.ySmooth;
	}

	/*
	 * Checks if this camera needs to be updated or not. If false, the camera
	 * will move to little for the rendered image to be effected. (less than
	 * 1/10th of a pixel.) Returns true if the camera should be updated and
	 * rerendered. False otherwise.
	 */
	needsUpdate()
	{
		return Math.abs(this.x - this.xSmooth) + Math.abs(this.y - this.ySmooth)
			+ Math.abs(this.zoom - this.zoomSmooth) > 0.01;
	}
}
