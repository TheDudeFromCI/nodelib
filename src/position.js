NodeGraph.Position = class
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	toWorld(camera)
	{
		let pos = new Position(this.x, this.y);

		pos.x = (pos.x + camera.xSmooth) / camera.zoomSmooth;
		pos.y = (pos.y + camera.ySmooth) / camera.zoomSmooth;

		return pos;
	}

	toScreen(camera)
	{
		let pos = new Position(this.x, this.y);

		pos.x = pos.x * camera.zoomSmooth - camera.xSmooth;
		pos.y = pos.y * camera.zoomSmooth - camera.ySmooth;

		return pos;
	}
}
