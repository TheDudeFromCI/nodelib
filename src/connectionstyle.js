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