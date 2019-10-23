/*
 * This package is a collection of rendering styles which can be used for
 * rendering connections to the canvas.
 */
NodeGraph.ConnectionStyle = {};

/*
 * Renders a straight line between two plugs.
 */
NodeGraph.ConnectionStyle.Linear = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a straight line between two plugs, where the the line angles shortly
 * before and after the plug into a horizontal line into a semi z-shape.
 */
NodeGraph.ConnectionStyle.ZLinear = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(a.x + 25 * camera.zoomSmooth, a.y);
	ctx.lineTo(b.x - 25 * camera.zoomSmooth, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}