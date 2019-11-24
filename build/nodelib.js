/*
 * The node graph library is a useful utility library for rendering an interactive
 * node graph with HTML5. This graph is highly configurable to fit various theme
 * and control settings.
 */
var NodeGraph = {};

/*
 * This package is a collection of rendering styles which can be used for
 * rendering connections to the canvas.
 */
NodeGraph.ConnectionStyle = {};

/*
 * A collection of utility functions which are commonly used within the node
 * graph library.
 */
NodeGraph.Utils = {};
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
	 * Gets the World X position for a given Screen X position.
	 *
	 * x -
	 *     The Screen X position.
	 */
	acamX(x)
	{
		return (x + this.xSmooth) / this.zoomSmooth;
	}

	/*
	 * Gets the World Y position for a given Screen Y position.
	 *
	 * y -
	 *     The Screen Y position.
	 */
	acamY(y)
	{
		return (y + this.ySmooth) / this.zoomSmooth;
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
/*
 * A connection represents a relationship between two nodes, and two plugs
 * for those nodes. A connection may exist by connecting the output plug of
 * one node to the input plug of another node.
 */
NodeGraph.Connection = class
{
	/*
	 * Creates a new connection object. An error is thrown if the connection
	 * is considered invalid by the given plugs, or if either plug is null.
	 */
	constructor(tree, outputPlug, inputPlug)
	{
		if (outputPlug == null || inputPlug == null)
			throw "Cannot create a connection using null plugs!";

		if (!outputPlug.canConnectTo(inputPlug))
			throw "A connection is not valid here!";

		this.tree = tree;
		this.outputPlug = outputPlug;
		this.inputPlug = inputPlug;
	}

	/*
	 * Gets the color of this connection. This color is determined by the
	 * "connectionColor" property of the output plug type, if defined. If
	 * not defined, the default color determined by the theme is returned.
	 */
	get connectionColor()
	{
		if (this.outputPlug.type == null
			|| this.outputPlug.type.connectionColor == null)
			return this.tree.theme.connectionColor;

		return this.outputPlug.type.connectionColor;
	}

	/*
	 * Gets the color of the end connection, if using a gradient connection.
	 * This color is determined by the "connectionEndColor(connection)"
	 * property of the output plug type, if defined. If not defined, or
	 * returns null, the "connnectionColor" property of this object is return;
	 */
	get connectionEndColor()
	{
		if (this.outputPlug.type == null
			|| this.outputPlug.type.connectionEndColor == null)
			return this.connectionColor;

		let col = this.outputPlug.type.connectionEndColor(this);

		if (col == null)
			return this.connectionColor;

		return col;
	}

	/*
	 * Renders this connection to a canvas. This function should only be
	 * called internally.
	 */
	render(ctx)
	{
		ctx.lineWidth = this.tree.theme.connectionWidth;

		let colA = this.connectionColor;
		let colB = this.connectionEndColor;

		if (colA == colB)
			ctx.strokeStyle = this.connectionColor;
		else
		{
			let pos1 = this.outputPlug.pos.toScreen(this.tree.camera);
			let pos2 = this.inputPlug.pos.toScreen(this.tree.camera);

			let grd = ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
			grd.addColorStop(0, colA);
			grd.addColorStop(1, colB);
			ctx.strokeStyle = grd;
		}

		this.tree.theme.connectionStyle(this.outputPlug, this.inputPlug, ctx,
			this.tree.camera);
	}
}
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
NodeGraph.Input = class
{
	constructor(node)
	{
		this.node = node;

		this.settingHeight = 24;
		this.settings = [];
	}

	addSetting(setting)
	{
		this.settings.push(setting);
	}

	update()
	{
		let camera = this.node.tree.camera;
		let zoom = camera.zoomSmooth;

		let width = (this.node.width - 20) * zoom;
		let height = this.settingHeight * zoom;

		let pos = this.node.posSmooth.copy();
		pos.shift(10, this.node.tree.theme.nodeHeaderSize + 3);
		pos = pos.toScreen(this.node.tree.camera);

		let rect = {x: pos.x, y: pos.y, width: width, height: height};
		let buffer = 3 * zoom;

		for (let input of this.settings)
		{
			rect.height = height * input.lineHeight;

			input.update(rect, zoom);
			rect.y += input.lineHeight * height + buffer;
		}
	}

	render(ctx)
	{
		let camera = this.node.tree.camera;
		let zoom = camera.zoomSmooth;
		let width = (this.node.width - 20) * zoom;
		let height = this.settingHeight * zoom;

		let pos = this.node.posSmooth.copy();
		pos.shift(10, this.node.tree.theme.nodeHeaderSize + 3);
		pos = pos.toScreen(camera);

		let rect = {x: pos.x, y: pos.y, width: width, height: height};
		let buffer = 3 * zoom;

		ctx.fillStyle = this.node.tree.theme.plugFontColor;
		ctx.font = this.node.tree.theme.plugFontSize * camera.zoomSmooth
			+ 'px ' + this.node.tree.theme.plugFontFamily;
		ctx.textBaseline = 'middle';

		for (let input of this.settings)
		{
			rect.height = height * input.lineHeight;

			input.drawName(ctx, rect, height);
			rect.y += input.lineHeight * height + buffer;
		}
	}

	plugPositions()
	{
		let plugs = {inputs: [], outputs: []};

		let pos = this.node.posSmooth.copy();
		pos.y += this.node.tree.theme.nodeHeaderSize + 3 + this.settingHeight / 2;

		let height = this.settingHeight;
		let width = this.node.width;

		for (let input of this.settings)
		{
			if (input.isOutput)
				plugs.outputs.push({x: pos.x + width, y: pos.y, plug: input.plug});
			else
				plugs.inputs.push({x: pos.x, y: pos.y, plug: input.plug});

			pos.y += input.lineHeight * height + 3;
		}

		return plugs;
	}

	get height()
	{
		let h = 0;

		for (let input of this.settings)
			h += input.lineHeight * this.settingHeight + 3;

		return h;
	}

	get minWidth()
	{
		let w = 0;

		for (let input of this.settings)
			w = Math.max(w, input.minWidth);

		return w;
	}

	get recommendedWidth()
	{
		let w = 0;

		for (let input of this.settings)
			w = Math.max(w, input.recommendedWidth);

		return w;
	}

	destroy()
	{
		for (let input of this.settings)
			input.destroy();

		this.settings = [];
	}

	setFocusable(state)
	{
		for (let input of this.settings)
			input.setFocusable(state);
	}
}
NodeGraph.InputSetting = class
{
	constructor(tree, name, domType, isOutput)
	{
		this.tree = tree;
		this.name = name;
		this.lineHeight = 1;
		this.minWidth = 80;
		this.focusable = true;
		this.isOutput = isOutput;
		this.filled = false;
		this.unfocusable = false;
		this.hasTitle = true;

		this.domType = domType;
	}

	buildDom(type)
	{
		if (this.dom != null)
			document.body.removeChild(this.dom);

		this.dom = document.createElement(type);
		document.body.appendChild(this.dom);

		this.dom.classList.add('nodegraph-inputsetting');
		this.dom.addEventListener('focus', e => this.onFocus(e));
		this.dom.addEventListener('mousedown', e => this.onMouseDown(e));
		this.dom.addEventListener('mousemove', e => this.onMouseMove(e));
		this.dom.addEventListener('mouseup', e => this.onMouseUp(e));
		this.dom.addEventListener('mousewheel', e => this.onScroll(e),
			{passive: true});

		this.setFocusable(this.focusable);

		if (this.buildDomLate != null && !this.filled)
			this.buildDomLate();
	}

	setFilled(state)
	{
		this.filled = state;
		this.focusable = !state;

		if (this.filled)
			this.destroy();
		else
			this.buildDom(this.domType);

		if (this.filled)
			this.lineHeight = 1;
	}

	update(rect, zoom)
	{
		if (this.dom == null)
			return;

		if (this.hasName)
		{
			rect = {x: rect.x, y: rect.y, width: rect.width, height: rect.height};

			let q = rect.width / 3;
			rect.width -= q;
			rect.x += q;
		}

		let borderRadius = 4 * zoom;
		let padding = 3 * zoom;
		let fontSize = this.tree.theme.plugFontSize * zoom;

		this.dom.style.top = rect.y + 'px';
		this.dom.style.left = rect.x + 'px';
		this.dom.style.width = rect.width + 'px';
		this.dom.style.height = rect.height + 'px';
		this.dom.style.fontSize = fontSize + 'px';
		this.dom.style.borderRadius = borderRadius + 'px';
		this.dom.style.padding = padding + 'px';

		if (this.updateLate != null)
			this.updateLate(rect, zoom);
	}

	setFocusable(state)
	{
		if (this.unfocusable)
			state = false;

		this.focusable = state;

		if (this.dom != null)
			this.dom.style.pointerEvents = state ? 'auto' : 'none';
	}

	destroy()
	{
		if (this.dom != null)
			document.body.removeChild(this.dom);
	}

	onFocus(event)
	{
		if (this.focusable)
			return;

		event.preventDefault();

		if (event.relatedTarget)
			event.relatedTarget.focus();
		else
			event.currentTarget.blur();
	}

	onMouseDown(event)
	{
		if (event.which == 1)
			return;

		event.preventDefault();
		this.tree.onMouseDown(event);
	}

	onMouseMove(event)
	{
		this.tree.onMouseMove(event);
	}

	onMouseUp(event)
	{
		if (event.which == 1)
			return;

		event.preventDefault();
		this.tree.onMouseUp(event);
	}

	onScroll(event)
	{
		this.tree.onScroll(event);
	}

	drawName(ctx, rect, lineHeight)
	{
		if (!this.hasName)
			return;

		let y = rect.y + lineHeight / 2;

		if (this.isOutput)
		{
			ctx.textAlign = 'right';
			ctx.fillText(this.name, rect.x + rect.width, y);
		}
		else
		{
			ctx.textAlign = 'left';
			ctx.fillText(this.name, rect.x, y);
		}
	}

	get recommendedWidth()
	{
		let c = this.tree.canvas;
		let ctx = c.getContext("2d");
		ctx.save();

		ctx.font = this.tree.theme.plugFontSize * this.tree.camera.zoomSmooth
			+ 'px ' + this.tree.theme.plugFontFamily;
		let w = ctx.measureText(this.name).width + 20;

		ctx.restore();

		return Math.max(w * 3, this.minWidth / 2 * 3);
	}

	get hasName()
	{
		if (this.dom == null)
			return true;

		if (this.isOutput)
			return false;

		return true;
	}
}

NodeGraph.TextInputSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name)
	{
		super(tree, name, 'input', false);
		this.minWidth = 150;
		this.hasTitle = false;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		this.dom.setAttribute("type", "text");
	}
}

NodeGraph.TextBlockSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, rows)
	{
		super(tree, name, 'textarea', false);

		this.rows = rows;
		this.minWidth = 200;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		this.lineHeight = this.rows;
		this.dom.rows = this.rows;
		this.dom.style.resize = 'none';
	}
}

NodeGraph.PlainTextSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, isOutput)
	{
		super(tree, name, null, isOutput);
	}
}

NodeGraph.ColorSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, value = '#FFFFFF')
	{
		super(tree, name, 'input', false);

		this.value = value;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		this.dom.setAttribute("type", "color");
		this.dom.setAttribute("value", this.value);
	}
}

NodeGraph.RangeSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, min = 0, max = 1, value = 1, step = 1)
	{
		super(tree, name, 'input', false);

		this.min = min;
		this.max = max;
		this.step = step;
		this.value = value;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		this.dom.setAttribute("type", "range");
		this.dom.setAttribute("min", this.min);
		this.dom.setAttribute("max", this.max);
		this.dom.setAttribute("step", this.step);
		this.dom.setAttribute("value", this.value);
	}

	updateLate(rect, zoom)
	{
		let html = document.getElementsByTagName('html')[0];
		html.style.cssText = '--nodegraph-sliderSize: ' + (25 * zoom) + 'px';
	}
}

NodeGraph.DropdownSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, options = [])
	{
		super(tree, name, 'select', false);

		this.options = options;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		for (let op of this.options)
		{
			let elem = document.createElement('option');
			this.dom.appendChild(elem);

			elem.innerHTML = op;
		}
	}
}


NodeGraph.CheckboxSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name, value = false)
	{
		super(tree, name, 'input', false);

		this.value = value;
		this.minWidth = 30;

		this.buildDom(this.domType);
	}

	buildDomLate()
	{
		this.dom.setAttribute("type", "checkbox");
	}

	updateLate(rect, zoom)
	{
		let s = 16 * zoom;

		this.dom.style.top = rect.y + 'px';
		this.dom.style.left = rect.x + 'px';
		this.dom.style.width = s + 'px';
		this.dom.style.height = s + 'px';
	}
}
/*
 * A node is the main objects which exist within a node graph tree. These object
 * are boxes, often with a name and type, which connect to each other to form
 * the tree.
 */
NodeGraph.Node = class
{
	/*
	 * Creates a new node object. This should be called internally only. Please
	 * use "tree.addNode(...)" instead.
	 *
	 * tree -
	 *     The tree which owns this node.
	 * position -
	 *     The initial position of the node.
	 * type -
	 *     The type of this node, used for API purposes. Defaults to null. If
	 *     defined, and the "onInit(node)" function is defined, it will be
	 *     called to initialize this node.
	 * name -
	 *     The name of the node. Defaults to 'Node'. If type is defined, and
	 *     "name" is defined for the type, name is retrieved from that.
	 */
	constructor(tree, position, type = null, name = 'Node')
	{
		this.tree = tree;
		this.name = name;
		this.id = NodeGraph.Utils.randomGuid();
		this.type= type;

		this._width = 0;
		this._height = 0;

		this.position = position;
		this.posSmooth = position.copy();
		this.snapPos = position.copy();
		this.inputPlugs = [];
		this.outputPlugs = [];
		this.input = new NodeGraph.Input(this);

		this.dragging = false;
		this.resizing = false;
		this.resizeDir = null;
		this.hover = false;
		this.select = false;

		if (tree.theme.hasGridBehavior)
		{
			let step = tree.theme.gridSize;

			this.position.x = Math.round(this.position.x / step) * step;
			this.position.y = Math.round(this.position.y / step) * step;
			this.posSmooth.setFrom(this.position);
			this.snapPos.setFrom(this.position);
		}

		if (type != null)
		{
			if (type.name != null)
				this.name = type.name;

			if (type.onInit != null)
				type.onInit(this);
		}

		this._width = Math.max(this.width, this.input.recommendedWidth);
	}

	/*
	 * Gets a list of all parent nodes for this node. This is all nodes
	 * which have an outgoing connection to this node.
	 */
	parents()
	{
		let list = [];

		let ref = this;
		tree.findConnections({node2: ref})
			.forEach(connection =>
		{
			if (list.indexOf(connection.outputPlug.node) == -1)
				list.push(connection.outputPlug.node);
		});

		return list;
	}


	/*
	 * Gets a list of all child nodes for this node. This is all nodes which
	 * have an incoming connection from this node.
	 */
	children()
	{
		let list = [];

		let ref = this;
		tree.findConnections({node1: ref})
			.forEach(connection =>
		{
			if (list.indexOf(connection.inputPlug.node) == -1)
				list.push(connection.inputPlug.node);
		});

		return list;
	}

	isAncestorOf(node)
	{
		if (this === node)
			return true;

		let children = this.children();
		for (let i = 0; i < children.length; i++)
			if (children[i].isAncestorOf(node))
				return true;

		return false;
	}

	/*
	 * Updates this node's position to match the target. While dragging, this
	 * node is moved towards the drag position instead of the actual position.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta, force)
	{
		delta = delta / this.tree.theme.nodeSmoothing;

		if (this.dragging)
			this.posSmooth.lerpTo(this.snapPos, delta);
		else
			this.posSmooth.lerpTo(this.position, delta);

		this.input.update();
	}

	/*
	 * Checks if this node needs to be updated or not. If false, the node
	 * will move to little for the rendered image to be effected. (less than
	 * 1/10th of a pixel.) Returns true if the node should be updated and
	 * rerendered. False otherwise.
	 */
	needsUpdate()
	{
		return this.position.toScreen(this.tree.camera).distanceSquared(
			this.posSmooth.toScreen(this.tree.camera)) > 1;
	}

	/*
	 * Creates a new input plug for this node and attaches it. Returns the
	 * newly created plug.
	 *
	 * name -
	 *     The name of the new plug. Defaults to an empty string.
	 * type -
	 *     The type of the plug. Defaults to null. See NodeGraph.Plug for
	 *     for information.
	 */
	addInput(name = '', type = null)
	{
		let plug = new NodeGraph.Plug(this, true, name, type);
		this.inputPlugs.push(plug);

		this.tree.repaint = true;

		return plug;
	}

	/*
	 * Creates a new output plug for this node and attaches it. Returns the
	 * newly created plug.
	 *
	 * name -
	 *     The name of the new plug. Defaults to an empty string.
	 * type -
	 *     The type of the plug. Defaults to null. See NodeGraph.Plug for
	 *     for information.
	 */
	addOutput(name = '', type = null)
	{
		let plug = new NodeGraph.Plug(this, false, name, type);
		this.outputPlugs.push(plug);

		this.tree.repaint = true;

		return plug;
	}

	/*
	 * Gets the width of this node in world space.
	 */
	get width()
	{
		let width = Math.max(this._width, this.minWidth);

		if (this.tree.theme.hasGridBehavior)
		{
			let step = this.tree.theme.gridSize;
			width = Math.ceil(width / step) * step;
		}

		return width;
	}

	/*
	 * Gets the smallest width this node can be.
	 */
	get minWidth()
	{
		let width = Math.max(this.tree.theme.nodeMinWidth, this.input.minWidth);

		let title = 0;
		{
			let c = this.tree.canvas;
			let ctx = c.getContext("2d");
			ctx.save();

			ctx.font = this.tree.theme.headerFontSize + 'px '
				+ this.tree.theme.headerFontFamily;
			title = ctx.measureText(this.name).width + 20;

			ctx.restore();
		}

		return Math.max(width, title);
	}

	/*
	 * Gets the height of this node in world space.
	 */
	get height()
	{
		let height = Math.max(this._height, this.minHeight);

		if (this.tree.theme.hasGridBehavior)
		{
			let step = this.tree.theme.gridSize;
			height = Math.ceil(height / step) * step;
		}

		return height;
	}

	/*
	 * Gets the smallest height this node can be.
	 */
	get minHeight()
	{
		return Math.max(this.tree.theme.nodeMinHeight,
			this.tree.theme.nodeHeaderSize + this.input.height) + 3;
	}

	/*
	 * Gets the color of this node. If this node has a specific color assigned
	 * to it, that color is returned, otherwise the default theme color is
	 * returned.
	 */
	get nodeColor()
	{
		if (this._nodeColor == null)
			return this.tree.theme.nodeColor;

		return this._nodeColor;
	}

	/*
	 * Sets the color of this node. Set to null to use the default color.
	 */
	set nodeColor(value)
	{
		this._nodeColor = value;
	}

	/*
	 * Gets the header color of this node. If this node has a specific color
	 * assigned to it, that color is returned, otherwise the default theme color
	 * is returned.
	 */
	get nodeHeaderColor()
	{
		if (this._nodeHeaderColor == null)
			return this.tree.theme.nodeHeaderColor;

		return this._nodeHeaderColor;
	}

	/*
	 * Sets the header color of this node. Set to null to use the default color.
	 */
	set nodeHeaderColor(value)
	{
		this._nodeHeaderColor = value;
	}

	/*
	 * Gets the border color of this node. If this node has a specific border
	 * color assigned to it, that color is returned, otherwise the default theme
	 * color is returned.
	 */
	get borderColor()
	{
		if (this._borderColor == null)
			return this.tree.theme.nodeBorderColor;

		return this._nodeBorderColor;
	}

	/*
	 * Sets the border color of this node. Set to null to use the default color.
	 */
	set borderColor(value)
	{
		this._nodeBorderColor = value;
	}

	/*
	 * Gets the border color of this node. If this node has a specific border
	 * color assigned to it, that color is returned, otherwise the default theme
	 * color is returned.
	 */
	get borderColorHighlight()
	{
		if (this._borderColorHighlight == null)
			return this.tree.theme.nodeBorderHighlight;

		return this._nodeBorderColorHighlight;
	}

	/*
	 * Sets the border color of this node. Set to null to use the default color.
	 */
	set borderColorHighlight(value)
	{
		this._nodeBorderColorHighlight = value;
	}

	/*
	 * Renders this node onto the canvas object. This function should only be
	 * used internally.
	 *
	 * ctx -
	 *     The canvas context to render to.
	 */
	render(ctx)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;
		let radius = this.tree.theme.nodeBorderRadius * zoom;
		let header = this.tree.theme.nodeHeaderSize * zoom;

		this.buildNodeShape(ctx, pos, width, height, radius);
		ctx.fillStyle = this.nodeColor;
		ctx.fill();

		this.buildNodeHeaderShape(ctx, pos, width, height, radius, header);
		ctx.fillStyle = this.nodeHeaderColor;
		ctx.fill();

		this.buildNodeShape(ctx, pos, width, height, radius);
		ctx.lineWidth = this.tree.theme.nodeBorderThickness * zoom;

		if (this.select)
			ctx.strokeStyle = this.tree.theme.nodeBorderSelect;
		else if (this.hover)
			ctx.strokeStyle = this.borderColorHighlight;
		else
			ctx.strokeStyle = this.borderColor;

		ctx.stroke();

		for (let i = 0; i < this.inputPlugs.length; i++)
			this.inputPlugs[i].render(ctx);

		for (let i = 0; i < this.outputPlugs.length; i++)
			this.outputPlugs[i].render(ctx);

		ctx.fillStyle = this.tree.theme.headerFontColor;
		ctx.font = this.tree.theme.headerFontSize * zoom + 'px '
			+ this.tree.theme.headerFontFamily;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(this.name, pos.x + width / 2, pos.y + header / 2 * 1.05);

		this.input.render(ctx);
	}

	/*
	 * An internal function for building the path for rendering the node shape.
	 */
	buildNodeShape(ctx, pos, width, height, radius)
	{
		ctx.beginPath();
		ctx.moveTo(pos.x + radius, pos.y);
		ctx.lineTo(pos.x + width - radius, pos.y);
		ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width,
			pos.y + radius);
		ctx.lineTo(pos.x + width, pos.y + height - radius);
		ctx.quadraticCurveTo(pos.x + width, pos.y + height,
			pos.x + width - radius, pos.y + height);
		ctx.lineTo(pos.x + radius, pos.y + height);
		ctx.quadraticCurveTo(pos.x, pos.y + height, pos.x,
			pos.y + height - radius);
		ctx.lineTo(pos.x, pos.y + radius);
		ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
		ctx.closePath();
	}

	/*
	 * An internal function for building the path for rendering the node header.
	 */
	buildNodeHeaderShape(ctx, pos, width, height, radius, header)
	{
		ctx.beginPath();
		ctx.moveTo(pos.x + radius, pos.y);
		ctx.lineTo(pos.x + width - radius, pos.y);
		ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width,
			pos.y + radius);
		ctx.lineTo(pos.x + width, pos.y + header);
		ctx.lineTo(pos.x, pos.y + header);
		ctx.lineTo(pos.x, pos.y + radius);
		ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
		ctx.closePath();
	}

	/*
	 * Checks if the given screen space position is within the bounds of this
	 * node or not. If an addition radius is added, through r, this is counted
	 * as within bounds as well. This is used for hovering on resize events
	 * as well.
	 */
	isInBounds(x, y, r = 5)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		return x >= pos.x  - r && x < pos.x + width + r && y >= pos.y - r
			&& y < pos.y + height + r;
	}

	/*
	 * Checks if the given screen coordinates overlap the edge of this node,
	 * without overlapping and plugs. The thickness of the edge is defined by r.
	 * If the given coords are on the edge of this node, then the resize
	 * direction is returned. Otherwise, 'none' is returned.
	 */
	getResizeDir(x, y, r = 5)
	{
		let camera = this.tree.camera;
		let zoom = camera.zoomSmooth;

		let pos = this.posSmooth.toScreen(camera);
		let width = this.width * zoom;
		let height = this.height * zoom;

		if (x < pos.x - r || x > pos.x + width + r
			|| y < pos.y - r || y > pos.y + height + r)
			return 'none';

		if (x > pos.x + r && x < pos.x + width - r
			&& y > pos.y + r && y < pos.y + height - r)
			return 'none';

		let plugHover = false;
		this.forEachPlug(plug => plugHover |= plug.isInBounds(x, y));

		if (plugHover)
			return 'none';

		let north = y > pos.y - r && y < pos.y + r;
		let east = x > pos.x + width - r && x < pos.x + width + r;
		let south = y > pos.y + height - r && y < pos.y + height + r;
		let west = x > pos.x - r && x < pos.x + r;

		if (north && !east && !south && !west)
			return 'n-resize';

		if (north && east && !south && !west)
			return 'ne-resize';

		if (north && !east && !south && west)
			return 'nw-resize';

		if (!north && east && !south && !west)
			return 'e-resize';

		if (!north && !east && south && !west)
			return 's-resize';

		if (!north && east && south && !west)
			return 'se-resize';

		if (!north && !east && south && west)
			return 'sw-resize';

		if (!north && !east && !south && west)
			return 'w-resize';

		return 'none';
	}

	/*
	 * Applys a resize event to this node, based on this node's current
	 * resizeDir property.
	 */
	applyResize(dx, dy)
	{
		this._height = Math.max(this.minHeight, this._height);
		this._width = Math.max(this.minWidth, this._width);

		switch (this.resizeDir)
		{
			case 'n-resize':
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._height -= dy;
				break;

			case 'ne-resize':
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._width += dx;
				this._height -= dy;
				break;

			case 'nw-resize':
				dx = Math.min(dx, this._width - this.minWidth);
				dy = Math.min(dy, this._height - this.minHeight);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this.position.y += dy;
				this.snapPos.y += dy;
				this.posSmooth.y += dy;

				this._width -= dx;
				this._height -= dy;
				break;

			case 'e-resize':
				this._width += dx;
				break;

			case 's-resize':
				this._height += dy;
				break;

			case 'se-resize':
				this._width += dx;
				this._height += dy;
				break;

			case 'sw-resize':
				dx = Math.min(dx, this._width - this.minWidth);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this._width -= dx;
				this._height += dy;
				break;

			case 'w-resize':
				dx = Math.min(dx, this._width - this.minWidth);

				this.position.x += dx;
				this.snapPos.x += dx;
				this.posSmooth.x += dx;

				this._width -= dx;
				break;
		}
	}

	/*
	 * Runs a function for all plugs, input and output, attached to this node.
	 */
	forEachPlug(run)
	{
		this.inputPlugs.forEach(run);
		this.outputPlugs.forEach(run);
	}

	destroy()
	{
		this.input.destroy();
	}
}
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

		this.hover = false;

		if (type == null || type.createSetting == null || !isInput)
			this.setting = new NodeGraph.PlainTextSetting(node.tree,
				this.name, !isInput);
		else
			this.setting = type.createSetting(this);

		this.node.input.addSetting(this.setting);
		this.setting.plug = this;
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
		if (!this.canReplaceConnection(plug))
			return false;

		if (this.node.tree.findConnections({inputPlug: plug}).length > 0)
			return false;

		return true;
	}

	canReplaceConnection(plug)
	{
		if (this.isInput == plug.isInput)
			return false;

		if (this.isInput)
			return plug.canConnectTo(this);

		if (this.node.tree !== plug.node.tree)
			return false;

		if (plug.node.isAncestorOf(this.node))
			return false;

		if (this.type != null
			&& plug.type != null
			&& !this.type.canConnectTo(plug.type))
				return false;

		return true;
	}

	/*
	 * Gets the color of this plug, as determined by the plug type. If the plug
	 * type is null, or does not have the "plugColor" property, the default
	 * color is returned.
	 */
	get plugColor()
	{
		if (this.type == null || this.type.plugColor == null)
			return this.node.tree.theme.plugColor;

		return this.type.plugColor;
	}

	/*
	 * Gets the border color of this plug, as determined by the plug type. If the
	 * plug type is null, or does not have the "plugBorderColor" property, the
	 * default color is returned.
	 */
	get plugBorderColor()
	{
		if (this.type == null || this.type.plugBorderColor == null)
			return this.node.tree.theme.plugBorderColor;

		return this.type.plugBorderColor;
	}

	/*
	 * Gets the border color of this plug when moused over, as determined by the
	 * plug type. If the plug type is null, or does not have the
	 * "plugBorderHighlight" property, the default color is returned.
	 */
	get plugBorderHighlight()
	{
		if (this.type == null || this.type.plugBorderHighlight == null)
			return this.node.tree.theme.plugBorderHighlight;

		return this.type.plugBorderHighlight;
	}

	/*
	 * Gets the x position of this plug in world space.
	 */
	get x()
	{
		if (this._x != null)
			return this._x;

		/*
		if (this.isInput)
			return this.node.posSmooth.x;

		return this.node.posSmooth.x + this.node.width;
		*/

		return this.node.input.plugPositions()[this.isInput ? 'inputs'
			: 'outputs'].filter(o => o.plug === this)[0].x;
	}

	/*
	 * Gets the y position of this plug in world space.
	 */
	get y()
	{
		if (this._y != null)
			return this._y;

		/*
		let list = this.isInput ?
			this.node.inputPlugs : this.node.outputPlugs;

		return this.node.posSmooth.y
			+ this.node.height / 2
			+ (list.indexOf(this) + 1)
			* this.node.tree.theme.plugSpacing
			- (list.length + 1)
			* this.node.tree.theme.plugSpacing / 2;
		*/

		return this.node.input.plugPositions()[this.isInput ? 'inputs'
			: 'outputs'].filter(o => o.plug === this)[0].y;
	}

	/*
	 * Gets the x and y position of this plug as a position object, in world
	 * space.
	 */
	get pos()
	{
		return new NodeGraph.Position(this.x, this.y);
	}

	/*
	 * Checks if the given screen space position overlaps the bounds of this
	 * plug.
	 */
	isInBounds(x, y)
	{
		let radius = this.node.tree.theme.plugRadius;
		radius = radius * radius * this.node.tree.camera.zoomSmooth;

		return this.pos.toScreen(this.node.tree.camera)
			.distanceSquared(new NodeGraph.Position(x, y)) < radius;
	}

	/*
	 * Renders this plug to the screen. This is an internal function and
	 * should not be called externally.
	 */
	render(ctx)
	{
		let zoom = this.node.tree.camera.zoomSmooth;
		let radius = this.node.tree.theme.plugRadius * zoom;
		let plugBorderSize = this.node.tree.theme.plugBorderSize * zoom;
		let pos = this.pos.toScreen(this.node.tree.camera);

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 2 * Math.PI, false);
		ctx.fillStyle = this.plugColor;
		ctx.fill();

		if (this.hover)
			ctx.strokeStyle = this.plugBorderHighlight;
		else
			ctx.strokeStyle = this.plugBorderColor;

		ctx.lineWidth = plugBorderSize;
		ctx.stroke();
	}
}
/*
 * A popup object is a single, selectable option in the popup menu. This object
 * can be used to manipulate the menu options easily. To attach an event to this
 * option, simply define the "onclick(event)" function for this object.
 */
NodeGraph.PopupObject = class
{
	/*
	 * Creates a new popup object reference. This should only be called
	 * internally. Please use tree.addPopupOption instead.
	 *
	 * element1 -
	 *     The selectable element in the menu.
	 * element2 -
	 *     The tooltip element.
	 */
	constructor(tree, element1, element2, menu)
	{
		this.element1 = element1;
		this.element2 = element2;
		this.menu = menu;

		this._text = element1.innerHTML;
		this._tooltip = element2.innerHTML;
		this.warnings = [];
		this._greyedOut = false;

		this.element1.onclick = event =>
		{
			if (this.onclick != null)
				this.onclick(event);

			tree.popuptext.classList.toggle("nodegraph-show", false);
		};
	}

	/*
	 * Gets the current text for this option in the menu.
	 */
	get text()
	{
		return this._text;
	}

	/*
	 * Updates the text for this option in the menu.
	 */
	set text(value)
	{
		this._text = value;
		this.element1.innerHTML = value;
	}

	/*
	 * Gets the current tooltip for this option in the menu.
	 */
	get tooltip()
	{
		return this._tooltip;
	}

	/*
	 * Updates the tooltip for this option in the menu.
	 */
	set tooltip(value)
	{
		this._tooltip = value;
		this.updateTooltip();
	}

	/*
	 * Checks whether or not this option is currently greyed out.
	 */
	get greyedOut()
	{
		return this._greyedOut;
	}

	/*
	 * Sets whether or not this option should be greyed out.
	 */
	set greyedOut(value)
	{
		this._greyedOut = value;
		this.element1.classList.toggle('nodegraph-greyout', value);
	}

	/*
	 * Clears all tooltip warnings currently attached to this option.
	 */
	clearTooltipWarnings()
	{
		this.warnings = [];
		this.updateTooltip();
	}

	/*
	 * Appends a new warning to the bottom of the tooltip for this option.
	 */
	addTooltipWarning(warning)
	{
		this.warnings.push(warning);
		this.updateTooltip();
	}

	/*
	 * An internal function which updates the tooltip string and appends all
	 * warnings.
	 */
	updateTooltip()
	{
		let string = this._tooltip;

		for (let i = 0; i < this.warnings.length; i++)
		{
			if (i == 0)
				string += '<br>';

			string += '<br>* ' + this.warnings[i];
		}

		this.element2.innerHTML = string;
	}
}
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
/*
 * The theme class is used to determine how the graph should look and feel.
 */
NodeGraph.Theme = class
{
	/*
	 * Creates a new theme object.
	 */
	constructor()
	{
		/*
		 * How smooth to make camera panning and zooming. Smaller values are more
		 * responsive but jittery, while larger values are slower and smoother.
		 */
		this.cameraSmoothing = 0.08;

		/*
		 * How smooth to make node dragging. Smaller values are more responsive
		 * but jittery, while larger values are slower and smoother.
		 */
		this.nodeSmoothing = 0.03;

		/*
		 * The font size, in world space, to render the header with.
		 */
		this.headerFontSize = 20;

		/*
		 * The font size, in world space, to render plug names with.
		 */
		this.plugFontSize = 16;

		/*
		 * The font to use when rendering the header name for nodes.
		 */
		this.headerFontFamily = "Calibri";

		/*
		 * The font to use when rendering the plug names for nodes.
		 */
		this.plugFontFamily = "Calibri";

		/*
		 * The color of header name text for nodes.
		 */
		this.headerFontColor = '#CCCCCC';

		/*
		 * The color of plug name text for nodes.
		 */
		this.plugFontColor = '#AAAAAA';

		/*
		 * How wide nodes should be rendered. All nodes have a constant width. If
		 * set to 0, the width, of a node is determined based on the length of
		 * string of the name of the node. This value is in world space. The
		 * width of a node is rounded up to the next grid size, if grids are
		 * enabled.
		 */
		this.nodeMinWidth = 100;

		/*
		 * The smallest height a node should be rendered at. The height of a node
		 * is automatically increased to contain all connection plugs, as well as
		 * the name of the node. this value is in world space. The height of a
		 * node is increased to the next grid size, if grid behavior is enabled.
		 */
		this.nodeMinHeight = 50;

		/*
		 * Determines the width of connection lines in number of pixels. This
		 * value is in world space.
		 */
		this.connectionWidth = 2;

		/*
		 * The default color to use for rendering connections. The default value
		 * can be overriden per connection by assigning the "connectionColor"
		 * property of the output plug type for the connection.
		 */
		this.connectionColor = '#FF7F50';

		/*
		 * The shape style to use when rendering the connection.
		 */
		this.connectionStyle = NodeGraph.ConnectionStyle.SoftBezier;

		/*
		 * Assigns the radius for how large a plug should be rendered on a node.
		 * This value is in world space.
		 */
		this.plugRadius = 8;

		/*
		 * The size, in pixels, of the border for each plug. This value is in
		 * world space.
		 */
		this.plugBorderSize = 1.5;

		/*
		 * The default background color for plugs. Can be overriden per plug by
		 * assigning the "plugColor" property of a plug type.
		 */
		this.plugColor = '#777777';

		/*
		 * The default border color for plugs. Can be overriden per plug by
		 * assigning the "plugBorderColor" property of a plug type.
		 */
		this.plugBorderColor = '#555555';

		/*
		 * The default border color for plugs when moused over. Can be overriden
		 * per plug by assigning the "borderColorHighlight" property of a plug
		 * type.
		 */
		this.plugBorderHighlight = '#999999';

		/*
		 * The fillstyle for the background. Note, using transparent colors has
		 * been known to sometimes ignore mouse events and pass events to under
		 * lying elements.
		 */
		this.backgroundColor = '#121212';

		/*
		 * The default background color for nodes. Can be overriden per node by
		 * assigning the "nodeColor" property of a specific node.
		 */
		this.nodeColor = '#552222';

		/*
		 * The default border color for nodes. Can be overriden per node by
		 * assigning the "bordercolor" property of a specific node.
		 */
		this.nodeBorderColor = '#555555';

		/*
		 * The default border color for nodes when moused over. Can be overriden
		 * per node by assigning the "borderColorHighlight" property of a
		 * specific node.
		 */
		this.nodeBorderHighlight = '#777777';

		/*
		 * The border color for nodes which are selected.
		 */
		this.nodeBorderSelect = '#999955';

		/*
		 * The default background color of the header for a node. Can be
		 * overriden per node by assigning the "nodeColor" property of a
		 * specific node.
		 */
		this.nodeHeaderColor = '#441111';

		/*
		 * The number of pixels, in world space, of the height of the header
		 * for nodes.
		 */
		this.nodeHeaderSize = 37;

		/*
		 * The thickness, in pixels of the borders for each node. This value is
		 * in world space.
		 */
		this.nodeBorderThickness = 2;

		/*
		 * Sets, in world space pixels, how round the corners of the nodes should
		 * be. If 0, corners are rectangular.
		 */
		this.nodeBorderRadius = 8;

		/*
		 * The size of the grid to use when moving nodes. Nodes are snapped to
		 * the nearest grid block. When set to 0, the grid is disabled.
		 */
		this.gridSize = 50;

		/*
		 * If true, grids are only rendered and have no effect on behavior.
		 */
		this.gridRenderOnly = true;

		/*
		 * The number of grid segements before rendering it as a major grid line.
		 * If set to 0, major grid segments are disabled. These have no effect,
		 * and are visual only. These do not render if gridSize is set to 0.
		 */
		this.gridMajorSegments = 4;

		/*
		 * The color of the grid to render.
		 */
		this.gridColor = '#242424';

		/*
		 * The color of major grid segments to render.
		 */
		this.gridMajorColor = '#363636';

		/*
		 * The smallest number of pixels, in screen space, to render a grid
		 * segement at. If a grid is determined to be rendered smaller than
		 * this value, such as by zooming out, the grid will be rendered at
		 * the scale of the grid major segements, and grid major segements
		 * are scaled up to the new grid size. If set to 0, grid outward
		 * resizing is disabled.
		 */
		this.gridMinRenderSize = 25;

		/*
		 * This value is similar to gridMinRenderSize, however, using the reverse
		 * effect. I.e., zooming in instead of zooming out. If set to 0, grid
		 * inward resizing is disabled.
		 */
		this.gridMaxRenderSize = 100;
	}

	/*
	 * Returns true if grids should be rendered.
	 */
	get shouldRenderGrid()
	{
		return this.gridSize > 0;
	}

	/*
	 * Returns true if grid snapping behavior should be emulated.
	 */
	get hasGridBehavior()
	{
		return this.gridSize > 0 && !this.gridRenderOnly;
	}

	/*
	 * Returns true if major grid segements should be rendered.
	 */
	get hasMajorGrid()
	{
		return this.shouldRenderGrid && this.gridMajorSegments > 0;
	}

	/*
	 * Returns true if zooming in to a grid makes segements render
	 * smaller.
	 */
	get shouldZoomInGrid()
	{
		return this.hasMajorGrid && this.gridMaxRenderSize > 0;
	}

	/*
	 * Returns true if zooming out of a grid makes segements render
	 * larger.
	 */
	get shouldZoomOutGrid()
	{
		return this.hasMajorGrid && this.gridMinRenderSize > 0;
	}
}
/*
 * A tree is the core structure of a node graph. This is the graph itself which
 * holds all the nodes and connections to be rendered. This object wraps around
 * a HTML5 canvas.
 */
NodeGraph.Tree = class {
	/*
	 * Creates a new tree object. This tree will also create its own camera
	 * object.
	 *
	 * canvas -
	 *     The canvas this tree should be attached to. The tree object will be
	 *     rendered to this object, using the bounds and resolution of this
	 *     canvas.
	 * theme -
	 *     The look and feel of this node graph tree.
	 */
    constructor(canvas, theme) {
        this.canvas = canvas;
        this.theme = theme;

        this.canvasWidth = canvas.clientWidth;
        this.canvasHeight = canvas.clientHeight;

        this.nodes = [];
        this.connections = [];
        this.camera = new NodeGraph.Camera(theme);

        this.tempConnectionPlug = new NodeGraph.Node(this,
            new NodeGraph.Position(0, 0)).addInput();
        this.tempConnection = null;

        this.lastFrame = 0;
        this.repaint = true;
        this.alive = true;

        canvas.tabIndex = '1';

        canvas.addEventListener('mousedown', e => this.onMouseDown(e));
        canvas.addEventListener('mousemove', e => this.onMouseMove(e));
        canvas.addEventListener('mouseup', e => this.onMouseUp(e));
        //canvas.addEventListener('mouseout', e => this.onMouseExit(e));
        canvas.addEventListener('keyup', e => this.onKeyUp(e));
        canvas.addEventListener('contextmenu', e => this.onContextMenu(e), false);
        canvas.addEventListener('mousewheel', e => this.onScroll(e));

        this.buildPopup();

        requestAnimationFrame(time => this.animation(time));
    }

	/*
	 * Creates the popup menu object. This is is an internal function.
	 */
    buildPopup() {
        let popup = document.createElement('div');
        popup.classList.add('nodegraph-popup');
        document.body.appendChild(popup);

        this.popuptext = document.createElement('span');
        this.popuptext.classList.add('nodegraph-popuptext');
        popup.appendChild(this.popuptext);

        this.popuptext.empty = this.addPopupOption('Empty', '', null, true);
        this.popuptext.empty.greyedOut = true;
    }

	/*
	 * Appends a new object to the bottom of the popup menu. This can be used
	 * to customize how nodes should be interacted with. Returns the popup menu
	 * object for the newly created option.
	 *
	 * menu -
	 *     Determines what submenu to place this option in. If null, this option
	 *     is placed in the main context folder. Otherwise, this option is
	 *     placed within that submenu. Defaults to null. If submenu does not
	 *     exist, or is not in the context menu, it is assumed to be null.
	 * text -
	 *     The text to show in the context menu.
	 * tooltip -
	 *     The tooltip to show when this option is moused over.
	 */
    addPopupOption(text, tooltip, menu = null, isEmpty = false) {
        if (menu == null)
            menu = this.popuptext;

        if (!isEmpty && menu.empty != null) {
            this.removePopupOption(menu.empty, true);
            menu.empty = null;
        }

        let elem1 = document.createElement('div');
        elem1.innerHTML = text;
        elem1.unselectable = 'on';
        elem1.classList.add('nodegraph-unselectable');
        elem1.classList.add('nodegraph-menuoption');
        menu.appendChild(elem1);

        let tip1 = document.createElement('div');
        tip1.innerHTML = tooltip;
        tip1.unselectable = 'on';
        tip1.classList.add('nodegraph-unselectable');
        tip1.classList.add('nodegraph-tooltip');
        menu.appendChild(tip1);

        let obj = new NodeGraph.PopupObject(this, elem1, tip1, menu);
        return obj;
    }

	/*
	 * Removes an option from the popup menu. Does nothing if the option is not
	 * current in the popup menu.
	 *
	 * option -
	 *     The option to remove.
	 */
    removePopupOption(option, isEmpty = false) {
        option.menu.removeChild(option.element1);
        option.menu.removeChild(option.element2);

        if (!isEmpty && option.menu.childElementCount == 0) {
            option.menu.empty = this.addPopupOption('Empty', '', option.menu, true);
            option.menu.empty.greyedOut = true;
        }
    }

	/*
	 * Creates a new nested context menu. This allows menu options to be placed
	 * within it and grouped together. Menus can be nested.
	 *
	 * name -
	 *     The name of this menu. This is the text that will appear in the
	 *     context menu.
	 * menu -
	 *     Assigns this menu this submenu should be placed within. If null, this
	 *     submenu will be appended to the main context menu. Defaults to null.
	 */
    createContextSubmenu(name, menu = null) {
        if (menu == null)
            menu = this.popuptext;

        if (menu.empty != null) {
            this.removePopupOption(menu.empty, true);
            menu.empty = null;
        }

        let elem1 = document.createElement('div');
        elem1.innerHTML = name;
        elem1.unselectable = 'on';
        elem1.classList.add('nodegraph-unselectable');
        elem1.classList.add('nodegraph-menuoption');
        menu.appendChild(elem1);

        let elem3 = document.createElement('div');
        elem3.unselectable = 'on';
        elem3.classList.add('nodegraph-unselectable');
        elem3.classList.add('nodegraph-menuArrow');
        elem1.appendChild(elem3);

        let elem2 = document.createElement('div');
        elem2.classList.add('nodegraph-submenu');
        menu.appendChild(elem2);

        elem2.empty = this.addPopupOption('Empty', '', elem2, true);
        elem2.empty.greyedOut = true;

        return elem2;
    }

	/*
	 * Animated a single frame to update all nodes within this tree. This method
	 * should only be called internally.
	 */
    animation(time) {
        let delta = (time - this.lastFrame) / 1000.0;
        this.lastFrame = time;

        if (this.needsUpdate())
            this.update(delta);

        if (this.alive)
            requestAnimationFrame(time => this.animation(time));
    }

	/*
	 * Attempts to find the node in this tree with the given ID. If no existing
	 * node is found, null is returned.
	 *
	 * id -
	 *     The ID of the node.
	 */
    getNodeById(id) {
        for (let i = 0; i < this.nodes.length; i++)
            if (this.nodes[i].id == id)
                return this.nodes[i];

        return null;
    }

	/*
	 * Adds a node to this node graph tree. This will create a new node object
	 * with the given properties. Returns the newly created node.
	 *
	 * name -
	 *     The name of the node.
	 * position -
	 *     The initial position of the node. Defaults to (0, 0) in world space.
	 * type -
	 *     The type of this node, used for API purposes. Defaults to null.
	 */
    addNode(position = new NodeGraph.Position(0, 0), type = null, name = 'Node') {
        let node = new NodeGraph.Node(this, position, type, name);
        this.nodes.push(node);
        this.repaint = true;

        return node;
    }

	/*
	 * Adds a connection to this tree. An error is thrown if the connection
	 * is not considered valid, or contains nodes which do not exist within this
	 * tree. Returns the newly created connection object.
	 *
	 * outputPlug -
	 *     The plug which is sending the connection.
	 * inputPlug -
	 *     The plug which is recieving the connection.
	 */
    addConnection(outputPlug, inputPlug) {
        let connection = new NodeGraph.Connection(this, outputPlug, inputPlug);

        if (!this.contains(outputPlug.node))
            throw "Connection exists outside of tree!";

        this.connections.push(connection);
        this.repaint = true;

        inputPlug.setting.setFilled(true);

        return connection;
    }

	/*
	 * Checks if a node or connection is part of this tree or not. Returns true
	 * if the node or connection is part of this tree, false otherwise.
	 * 
	 * node -
	 *     The node, or connection, to check for.
	 */
    contains(node) {
        if (node instanceof NodeGraph.Connection)
            return this.connections.indexOf(connection) != -1;

        return this.nodes.indexOf(node) != -1;
    }

	/*
	 * Removes a node from this tree. All connections which reference this node
	 * are also removed. Does nothing if the node is not part of this tree.
	 *
	 * node -
	 *     The node to remove.
	 */
    removeNode(node) {
        let nodeIndex = this.nodes.indexOf(node);
        if (nodeIndex == -1)
            return;

        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].outputPlug.node === node
                || this.connections[i].inputPlug.node === node) {
                this.removeConnection(this.connections[i]);
                i--;
            }
        }

        this.nodes.splice(nodeIndex, 1);
        node.destroy();

        this.repaint = true;
    }

	/*
	 * Removes a connection from this tree. Does nothing if the connection is
	 * not part of this tree.
	 *
	 * connection -
	 *     The connection to remove.
	 */
    removeConnection(connection) {
        let connectionIndex = this.connections.indexOf(connection);
        if (connectionIndex == -1)
            return;

        this.connections.splice(connectionIndex, 1);
        connection.inputPlug.setting.setFilled(false);

        this.repaint = true;
    }

	/*
	 * Updates the camera and all nodes attached to this tree which need to be
	 * updated.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
    update(delta) {
        this.repaint = false;

        this.camera.update(delta);

        for (let i = 0; i < this.nodes.length; i++)
            this.nodes[i].update(delta);

        this.render();
    }

	/*
	 * Renders the frame. This function is called internally by the update
	 * function.
	 */
    render() {
        let ctx = this.canvas.getContext('2d');
        this.renderBackground(ctx);

        for (let i = 0; i < this.connections.length; i++)
            this.connections[i].render(ctx);

        for (let i = 0; i < this.nodes.length; i++)
            this.nodes[i].render(ctx);

        if (this.tempConnection != null)
            this.tempConnection.render(ctx);
    }

	/*
	 * This is an internal function which renders the background and the grid
	 * to the canvas. If the grid is disabled, only the background is drawn.
	 */
    renderBackground(ctx) {
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;

        let width = this.canvas.width = this.canvasWidth;
        let height = this.canvas.height = this.canvasHeight;

        ctx.fillStyle = this.theme.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        if (!this.theme.shouldRenderGrid)
            return;

        let minBounds = new NodeGraph.Position(0, 0, false);
        minBounds = minBounds.toWorld(this.camera);

        let maxBounds = new NodeGraph.Position(width, height, false);
        maxBounds = maxBounds.toWorld(this.camera);

        let step = this.theme.gridSize;

        if (this.theme.shouldZoomOutGrid) {
            while (this.camera.zoomSmooth * step < this.theme.gridMinRenderSize)
                step *= this.theme.gridMajorSegments;
        }

        if (this.theme.shouldZoomInGrid) {
            while (this.camera.zoomSmooth * step > this.theme.gridMaxRenderSize)
                step /= this.theme.gridMajorSegments;
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = this.theme.gridColor;
        this.renderGrid(ctx, minBounds, maxBounds, step, width, height);

        if (this.theme.hasMajorGrid) {
            step *= this.theme.gridMajorSegments;

            ctx.strokeStyle = this.theme.gridMajorColor;
            this.renderGrid(ctx, minBounds, maxBounds, step, width, height);
        }
    }

	/*
	 * Renders the grid onto the background as specified by the theme. Called
	 * once for minor grid segements and once for major grid segments. This is
	 * an internal function and should not be called.
	 */
    renderGrid(ctx, minBounds, maxBounds, step, width, height) {
        let minX = Math.ceil(minBounds.x / step) * step;
        let maxX = Math.ceil(maxBounds.x / step) * step;
        let minY = Math.ceil(minBounds.y / step) * step;
        let maxY = Math.ceil(maxBounds.y / step) * step;

        for (let x = minX; x < maxX; x += step) {
            ctx.beginPath();
            ctx.moveTo(this.camera.camX(x), 0);
            ctx.lineTo(this.camera.camX(x), height);
            ctx.closePath();
            ctx.stroke();
        }

        for (let y = minY; y < maxY; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, this.camera.camY(y));
            ctx.lineTo(width, this.camera.camY(y));
            ctx.closePath();
            ctx.stroke();
        }
    }

	/*
	 * Checks if any elements within the tree need to be updated. Includes the
	 * camera and all nodes. Returns true if at least one element requires an
	 * update, false otherwise.
	 */
    needsUpdate() {
        if (this.repaint)
            return true;

        if (this.canvas.clientWidth != this.canvasWidth
            || this.canvasHeight != this.canvasHeight)
            return true;

        if (this.camera.needsUpdate())
            return true;

        for (let i = 0; i < this.nodes.length; i++)
            if (this.nodes[i].needsUpdate())
                return true;

        return false;
    }

	/*
	 * Finds all connections which match the given search filters. If no search
	 * filters are present, all connections are returned.
	 *
	 * node1 -
	 *     The node outputing the connection.
	 * node2 -
	 *     The node recieveing the connection.
	 * outputPlug -
	 *     The plug outputing the connection.
	 * inputPlug -
	 *     The plug recieveing the connection.
	 */
    findConnections({ node1 = null, node2 = null, outputPlug = null, inputPlug = null }) {
        let list = [];

        for (let i = 0; i < this.connections.length; i++) {
            let connection = this.connections[i];

            if (node1 != null && connection.outputPlug.node !== node1)
                continue;

            if (node2 != null && connection.inputPlug.node !== node2)
                continue;

            if (outputPlug != null && connection.outputPlug !== outputPlug)
                continue;

            if (inputPlug != null && connection.inputPlug !== inputPlug)
                continue;

            list.push(connection);
        }

        return list;
    }

	/*
	 * An internal method called to handle mouse down events.
	 */
    onMouseDown(event) {
        event.preventDefault();

        if (event.which != 3)
            this.popuptext.classList.toggle("nodegraph-show", false);

        this.nodes.forEach(node => node.input.setFocusable(false));

        let x = event.clientX;
        let y = event.clientY;
        this.lastMouseX = x;
        this.lastMouseY = y;

        this.cameraDrag = false;
        this.firstMove = true;
        this.resizing = false;
        this.mouseDownTime = new Date().getTime();

        this.nodes.forEach(node => node.dragging = node.resizing = false);

        if (event.which == 1) {
            this.mouseDown = true;

            if (!event.shiftKey) {
                let justClicked = null;

                this.nodes.forEach(node => {
                    if (node.isInBounds(x, y))
                        justClicked = node;
                });

                if (justClicked != null) {
                    this.nodes.forEach(node => node.select = false);
                    justClicked.select = true;

                    justClicked.resizeDir = justClicked.getResizeDir(x, y);
                    if (justClicked.resizeDir != 'none') {
                        justClicked.resizing = true;
                        this.resizing = true;
                    }

                    this.nodes.splice(this.nodes.indexOf(justClicked), 1);
                    this.nodes.push(justClicked);

                    this.repaint = true;
                }
                else {
                    this.nodes.forEach(node => node.select = false);
                    this.repaint = true;
                }
            }
        }
        else if (event.which == 2)
            this.cameraDrag = true;
    }

	/*
	 * An internal method called to handle mouse move events.
	 */
    onMouseMove(event) {
        event.preventDefault();

        let x = event.clientX;
        let y = event.clientY;

        let hoverPlug = null;

        this.nodes.forEach(node => {
            let hover = node.isInBounds(x, y);

            node.forEachPlug(plug => {
                let h = plug.isInBounds(x, y);

                if (h)
                    hoverPlug = plug;

                if (h != plug.hover) {
                    plug.hover = h;
                    this.repaint = true;
                }

                if (h)
                    hover = true;
            });

            if (hover != node.hover) {
                node.hover = hover;
                this.repaint = true;
            }
        });

        if (this.mouseDown) {
            if (hoverPlug != null && this.firstMove) {
                if (hoverPlug.isInput) {
                    let list = this.findConnections({ inputPlug: hoverPlug });
                    if (list.length > 0) {
                        let con = list[0];
                        this.removeConnection(con);

                        this.tempConnection = new NodeGraph.Connection(this, con.outputPlug,
                            this.tempConnectionPlug);
                    }
                }
                else {
                    this.tempConnection = new NodeGraph.Connection(this, hoverPlug,
                        this.tempConnectionPlug);
                }
            }

            let hasGrid = this.theme.hasGridBehavior;
            let grid = this.theme.gridSize;

            if (this.tempConnection != null) {
                this.tempConnectionPlug._x = this.camera.acamX(x);
                this.tempConnectionPlug._y = this.camera.acamY(y);

                if (hoverPlug != null) {
                    this.tempConnectionPlug._x = hoverPlug.x;
                    this.tempConnectionPlug._y = hoverPlug.y;
                }

                this.repaint = true;
            }
            else {
                let dx = (x - this.lastMouseX) / this.camera.zoomSmooth;
                let dy = (y - this.lastMouseY) / this.camera.zoomSmooth;

                if (this.resizing) {
                    this.nodes.forEach(node => {
                        if (!node.resizing)
                            return;

                        node.applyResize(dx, dy);
                        this.repaint = true;
                    });
                }
                else {
                    this.nodes.forEach(node => {
                        if (!node.select)
                            return;

                        node.dragging = true;
                        node.position.x += dx;
                        node.position.y += dy;

                        if (hasGrid) {
                            node.snapPos.x = Math.round(node.position.x / grid) * grid;
                            node.snapPos.y = Math.round(node.position.y / grid) * grid;
                        }
                        else
                            node.snapPos.setFrom(node.position);
                    });
                }
            }
        }

        if (this.cameraDrag) {
            this.camera.x -= x - this.lastMouseX;
            this.camera.y -= y - this.lastMouseY;
        }

        if (!this.mouseDown && !this.cameraDrag) {
            let resize = 'auto';

            this.nodes.forEach(node => {
                let r = node.getResizeDir(x, y);
                if (r != 'none')
                    resize = r;
            });

            this.canvas.style.cursor = resize;
        }

        this.lastMouseX = x;
        this.lastMouseY = y;
        this.firstMove = false;
    }

	/*
	 * An internal method called to handle mouse up events.
	 */
    onMouseUp(event) {
        event.preventDefault();

        this.nodes.forEach(node => node.input.setFocusable(true));

        let x = event.clientX;
        let y = event.clientY;

        this.mouseDown = false;
        this.cameraDrag = false;
        this.resizing = false;
        this.justClicked = null;

        let mouseTime = new Date().getTime() - this.mouseDownTime;
        if (mouseTime <= 200)
            this.onClick(event);

        if (this.tempConnection != null) {
            let hoverPlug = null;
            this.nodes.forEach(node => {
                node.forEachPlug(plug => {
                    let h = plug.isInBounds(x, y);

                    if (h)
                        hoverPlug = plug;
                });
            })

            if (hoverPlug != null) {
                if (this.tempConnection.outputPlug
                    .canReplaceConnection(hoverPlug)) {
                    let list = this.findConnections({ inputPlug: hoverPlug });
                    if (list.length > 0)
                        this.removeConnection(list[0]);

                    this.addConnection(this.tempConnection.outputPlug,
                        hoverPlug);
                }
            }

            this.tempConnection = null;
            this.repaint = true;
        }

        this.nodes.forEach(node => {
            node.dragging = false;
            node.position.setFrom(node.snapPos);
        });
    }

    onClick(event) {
        let x = event.clientX;
        let y = event.clientY;
        let justClicked = null;

        this.nodes.forEach(node => {
            if (node.isInBounds(x, y))
                justClicked = node;
        });

        if (justClicked == null) {
            if (!event.shiftKey) {
                this.nodes.forEach(node => node.select = false);
                this.repaint = true;
            }
        }
        else {
            if (event.shiftKey) {
                justClicked.select = !justClicked.select;

                this.nodes.splice(this.nodes.indexOf(justClicked), 1);
                this.nodes.push(justClicked);

                this.repaint = true;
            }
            else {
                this.nodes.forEach(node => node.select = false);
                justClicked.select = true;
                this.repaint = true;

                this.nodes.splice(this.nodes.indexOf(justClicked), 1);
                this.nodes.push(justClicked);
            }
        }
    }

	/*
	 * An internal method called to handle mouse exit events.
	 */
    onMouseExit(event) {
        this.mouseDown = false;
        this.cameraDrag = false;

        this.nodes.forEach(node => {
            node.dragging = false;

            if (node.hover) {
                node.hover = false;
                this.repaint = true;

            }

            node.forEachPlug(plug => {
                if (plug.hover) {
                    plug.hover = false;
                    this.repaint = true;
                }
            });
        });
    }

	/*
	 * An internal method called to handle mouse wheel events.
	 */
    onScroll(event) {
        let delta = 0;

        if (!event)
            event = window.event;

        if (event.wheelDelta)
            delta = event.wheelDelta / 60;
        else if (event.detail)
            delta = -event.detail / 2;

        if (delta == 0)
            return;

        let mouseX = event.clientX;
        let mouseY = event.clientY;

        let x = (mouseX + this.camera.x) / this.camera.zoom;
        let y = (mouseY + this.camera.y) / this.camera.zoom;

        if (delta < 0) {
            if (this.camera.zoom > 0.2)
                this.camera.zoom *= Math.pow(0.92, -delta);
        }
        else {
            if (this.camera.zoom < 5)
                this.camera.zoom *= Math.pow(1 / 0.92, delta);
        }

        this.camera.x = x * this.camera.zoom - mouseX;
        this.camera.y = y * this.camera.zoom - mouseY;

        this.repaint = true;

        event.preventDefault()
    }

    onContextMenu(event) {
        this.popuptext.classList.toggle("nodegraph-show");

        let popupContainer = this.popuptext.parentElement;
        popupContainer.style.left = event.clientX + 'px';
        popupContainer.style.top = event.clientY + 'px';

        this.onMouseDown(event);
        this.onMouseUp(event);

        event.preventDefault();
    }

    onKeyUp(event) {
        if (event.keyCode == 46) {
            let nodes = [];

            this.nodes.forEach(node => {
                if (node.select)
                    nodes.push(node);
            })

            for (let node of nodes)
                this.removeNode(node);
        }
    }

    destroy() {
        this.nodes.forEach(node => node.destroy());

        this.nodes = [];
        this.connections = [];
        this.alive = false;

        document.body.removeChild(this.popuptext.parentElement);
    }
}
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
