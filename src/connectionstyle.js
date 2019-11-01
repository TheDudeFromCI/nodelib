/*
 * Renders a straight line between two plugs.
 */
NodeGraph.ConnectionStyle.Linear = function(outputPlug, inputPlug, ctx, camera)
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
NodeGraph.ConnectionStyle.ZLinear = function(outputPlug, inputPlug, ctx, camera)
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

/*
 * Renders a bezier curve between the two plugs.
 */
NodeGraph.ConnectionStyle.Bezier = function(outputPlug, inputPlug, ctx, camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.bezierCurveTo(b.x, a.y, a.x, b.y, b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a softer and more shallow bezier curve between the two plugs.
 */
NodeGraph.ConnectionStyle.SoftBezier = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let c = (a.x + b.x) / 2;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.bezierCurveTo(c, a.y, c, b.y, b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a bezier curve between two plugs, but with a slight buffer before
 * and after the plugs for a smoother entry/exit.
 */
NodeGraph.ConnectionStyle.BufferedBezier = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let off = 25 * camera.zoomSmooth;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(a.x + off, a.y)
	ctx.bezierCurveTo(b.x, a.y, a.x, b.y, b.x - off, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a bezier curve between two plugs, but with a slight buffer before
 * and after the plugs for a smoother entry/exit.
 */
NodeGraph.ConnectionStyle.BufferedSoftBezier = function(outputPlug, inputPlug,
	ctx, camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let c = (a.x + b.x) / 2;
	let off = 25 * camera.zoomSmooth;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(a.x + off, a.y)
	ctx.bezierCurveTo(c, a.y, c, b.y, b.x - off, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a 3 segment, axis-aligned line between two plugs.
 */
NodeGraph.ConnectionStyle.Sharp = function(outputPlug, inputPlug, ctx, camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let c = (a.x + b.x) / 2;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(c, a.y)
	ctx.lineTo(c, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a 3 segment, axis-aligned line between two plugs, where the middle
 * segment is just before the input plug.
 */
NodeGraph.ConnectionStyle.LateSharp = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let c = b.x - 30 * camera.zoomSmooth;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(c, a.y)
	ctx.lineTo(c, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

/*
 * Renders a 3 segment, axis-aligned line between two plugs, where the middle
 * segment is just after the output plug.
 */
NodeGraph.ConnectionStyle.EarlySharp = function(outputPlug, inputPlug, ctx,
	camera)
{
	let a = outputPlug.pos.toScreen(camera);
	let b = inputPlug.pos.toScreen(camera);
	let c = a.x + 30 * camera.zoomSmooth;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(c, a.y)
	ctx.lineTo(c, b.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}