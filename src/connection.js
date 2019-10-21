NodeGraph.Connection = class
{
	constructor(node1, node2)
	{
		this.node1 = node1;
		this.node2 = node2;

		this.color = 'orange';
	}

	draw(ctx, camera)
	{
		let buf = CONNECTION_EDGE_BUFFER * camera.zoomSmooth;
		let corn = CONNECTION_CORNER_DISTANCE * camera.zoomSmooth;

		let x0 = this.node1.xNoDrag;
		let y0 = this.node1.yNoDrag;
		let x1 = this.node2.xNoDrag;
		let y1 = this.node2.yNoDrag;

		x0 = camera.camX(x0) + ctx.measureText(this.node1.name).width + buf;
		y0 = camera.camY(y0);
		x1 = camera.camX(x1) - buf;
		y1 = camera.camY(y1);

		ctx.strokeStyle = this.color;
		ctx.beginPath();
		ctx.lineWidth = CONNECTION_WIDTH * camera.zoomSmooth;
		ctx.moveTo(x0, y0);

		ctx.lineTo(x1 - corn, y0);
		ctx.lineTo(x1 - corn, y1);
		ctx.lineTo(x1, y1);

		ctx.stroke();
	}
}
