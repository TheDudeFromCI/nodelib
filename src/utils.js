/*
 * A collection of utility functions which are commonly used within the node
 * graph library.
 */
NodeGraph.Utils = {};

/*
 * Interpolates between two numberical values based on the percentage, t. The
 * lerping is clamped to be within the range of a to b.
 *
 * a -
 *     The value when t <= 0.
 * b -
 *     The value when t >= 1.
 * t -
 *     The interpolation percentage. Expected to be within the range of 0 to
 *     1, inclusive.
 */
NodeGraph.Utils.lerp = function(a, b, t)
{
	if (t <= 0)
		return a;

	if (t >= 1)
		return b;

	return a * (1 - t) + b * t;
}

/*
 * Generates a random string which can be used for an element ID.
 */
NodeGraph.Utils.randomGuid = function()
{
	var S4 = function()
	{
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" +S4()
		+ S4() + S4());
}