/*
 * A tree is the core structure of a node graph. This is the graph itself which
 * holds all the nodes and connections to be rendered. This object wraps around
 * a HTML5 canvas.
 */
NodeGraph.Tree = class
{
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
	constructor(canvas, theme)
	{
		this.canvas = canvas;
		this.theme = theme;

		this.nodes = [];
		this.connections = [];
		this.camera = new NodeGraph.Camera(theme);

		this.tempConnectionPlug = new NodeGraph.Node(this, 'temp-drag',
			new NodeGraph.Position(0, 0)).addInput();
		this.tempConnection = null;

		this.lastFrame = 0;
		this.repaint = true;

		canvas.addEventListener('mousedown', event => this.onMouseDown(event));
		canvas.addEventListener('mousemove', event => this.onMouseMove(event));
		canvas.addEventListener('mouseup', event => this.onMouseUp(event));
		canvas.addEventListener('mouseout', event => this.onMouseExit(event));
		canvas.addEventListener('mousewheel', event => this.onScroll(event), {passive:true});
		canvas.addEventListener('contextmenu', event => this.onContextMenu(event), false);

		this.buildPopup();

		requestAnimationFrame(time => this.animation(time));
	}

	/*
	 * Creates the popup menu object. This is is an internal function.
	 */
	buildPopup()
	{
		this.popupOptions = [];

		let popup = document.createElement('div');
		popup.classList.add('nodegraph-popup');
		document.body.appendChild(popup);

		this.popuptext = document.createElement('span');
		this.popuptext.classList.add('nodegraph-popuptext');
		popup.appendChild(this.popuptext);

		this.defaultPopup = this.addPopupOption('Empty', '');
	}

	/*
	 * Appends a new object to the bottom of the popup menu. This can be used
	 * to customize how nodes should be interacted with. Returns the popup menu
	 * object for the newly created option.
	 */
	addPopupOption(text, tooltip)
	{
		let elem1 = document.createElement('p');
		elem1.innerHTML = text;
		elem1.unselectable = 'on';
		elem1.classList.add('nodegraph-unselectable');
		this.popuptext.appendChild(elem1);

		let tip1 = document.createElement('div');
		tip1.innerHTML = tooltip;
		tip1.unselectable = 'on';
		tip1.classList.add('nodegraph-unselectable');
		this.popuptext.appendChild(tip1);

		let obj = new NodeGraph.PopupObject(this, elem1, tip1);
		this.popupOptions.push(obj);

		if (this.popupOptions.length == 2 && this.popupOptions[0]
			=== this.defaultPopup)
			this.removePopupOption(this.defaultPopup);

		return obj;
	}

	/*
	 * Removes an option from the popup menu. Does nothing if the option is not
	 * current in the popup menu.
	 *
	 * option -
	 *     The option to remove.
	 */
	removePopupOption(option)
	{
		let index = this.popupOptions.indexOf(option);
		if (index == -1)
			return;

		this.popupOptions.splice(index, 1);

		this.popuptext.removeChild(option.element1);
		this.popuptext.removeChild(option.element2);

		if (this.popupOptions.length == 0)
			this.addPopupOption(this.defaultPopup);
	}

	/*
	 * Animated a single frame to update all nodes within this tree. This method
	 * should only be called internally.
	 */
	animation(time)
	{
		let delta = (time - this.lastFrame) / 1000.0;
		this.lastFrame = time;

		if (this.needsUpdate())
			this.update(delta);

		requestAnimationFrame(time => this.animation(time));
	}

	/*
	 * Attempts to find the node in this tree with the given ID. If no existing
	 * node is found, null is returned.
	 *
	 * id -
	 *     The ID of the node.
	 */
	getNodeById(id)
	{
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
	addNode(name, position = new NodeGraph.Position(0, 0), type = null)
	{
		let node = new NodeGraph.Node(this, name, position, type);
		this.nodes.push(node);

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
	addConnection(outputPlug,  inputPlug)
	{
		let connection = new NodeGraph.Connection(this, outputPlug, inputPlug);

		if (!this.contains(outputPlug.node))
			throw "Connection exists outside of tree!";

		this.connections.push(connection);

		return connection;
	}

	/*
	 * Checks if a node or connection is part of this tree or not. Returns true
	 * if the node or connection is part of this tree, false otherwise.
	 * 
	 * node -
	 *     The node, or connection, to check for.
	 */
	contains(node)
	{
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
	removeNode(node)
	{
		let nodeIndex = this.nodes.indexOf(node);
		if (nodeIndex == -1)
			return;

		for (let i = 0; i < this.connections.length; i++)
		{
			if (this.connections[i].node1 === node
				|| this.connections[i].node2 === node)
			{
				this.removeConnection(this.connections[i]);
				i--;
			}
		}

		this.nodes.splice(nodeIndex, 1);

		this.element.removeChild(node.element);
	}

	/*
	 * Removes a connection from this tree. Does nothing if the connection is
	 * not part of this tree.
	 *
	 * connection -
	 *     The connection to remove.
	 */
	removeConnection(connection)
	{
		let connectionIndex = this.connections.indexOf(connection);
		if (connectionIndex != -1)
			this.connections.splice(connectionIndex, 1);
	}

	/*
	 * Updates the camera and all nodes attached to this tree which need to be
	 * updated.
	 *
	 * delta -
	 *     The time in seconds since the last update.
	 */
	update(delta)
	{
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
	render()
	{
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
	renderBackground(ctx)
	{
		let width = this.canvas.width = this.canvas.clientWidth;
		let height = this.canvas.height = this.canvas.clientHeight;

		ctx.fillStyle = this.theme.backgroundColor;
		ctx.fillRect(0, 0, width, height);

		if (!this.theme.shouldRenderGrid)
			return;

		let minBounds = new NodeGraph.Position(0, 0, false);
		minBounds = minBounds.toWorld(this.camera);

		let maxBounds = new NodeGraph.Position(width, height, false);
		maxBounds = maxBounds.toWorld(this.camera);

		let step = this.theme.gridSize;

		if (this.theme.shouldZoomOutGrid)
		{
			while (this.camera.zoomSmooth * step < this.theme.gridMinRenderSize)
				step *= this.theme.gridMajorSegments;
		}

		if (this.theme.shouldZoomInGrid)
		{
			while (this.camera.zoomSmooth * step > this.theme.gridMaxRenderSize)
				step /= this.theme.gridMajorSegments;
		}

		ctx.lineWidth = 1;
		ctx.strokeStyle = this.theme.gridColor;
		this.renderGrid(ctx, minBounds, maxBounds, step, width, height);

		if (this.theme.hasMajorGrid)
		{
			step *= this.theme.gridMajorSegments;

			ctx.strokeStyle = this.theme.gridMajorColor;
			this.renderGrid(ctx, minBounds, maxBounds, step, width, height);
		}
	}

	renderGrid(ctx, minBounds, maxBounds, step, width, height)
	{
		let minX = Math.ceil(minBounds.x / step) * step;
		let maxX = Math.ceil(maxBounds.x / step) * step;
		let minY = Math.ceil(minBounds.y / step) * step;
		let maxY = Math.ceil(maxBounds.y / step) * step;

		for (let x = minX; x < maxX; x += step)
		{
			ctx.beginPath();
			ctx.moveTo(this.camera.camX(x), 0);
			ctx.lineTo(this.camera.camX(x), height);
			ctx.stroke();
		}

		for (let y = minY; y < maxY; y += step)
		{
			ctx.beginPath();
			ctx.moveTo(0, this.camera.camY(y));
			ctx.lineTo(width, this.camera.camY(y));
			ctx.stroke();
		}
	}

	/*
	 * Checks if any elements within the tree need to be updated. Includes the
	 * camera and all nodes. Returns true if at least one element requires an
	 * update, false otherwise.
	 */
	needsUpdate()
	{
		if (this.repaint)
			return true;

		if(this.camera.needsUpdate())
			return true;

		for (let i = 0; i < this.nodes.length; i++)
			if(this.nodes[i].needsUpdate())
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
	findConnections({node1 = null, node2 = null, outputPlug = null, inputPlug = null})
	{
		let list = [];

		for (let i = 0; i < this.connections.length; i++)
		{
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
	onMouseDown(event)
	{
		if (event.which != 3)
			this.popuptext.classList.toggle("nodegraph-show", false);

		let x = event.clientX;
		let y = event.clientY;
		this.lastMouseX = x;
		this.lastMouseY = y;

		this.cameraDrag = false;
		this.firstMove = true;
		this.nodes.forEach(node => node.dragging = false);

		if (event.which == 1)
		{
			this.mouseDown = true;

			this.nodes.forEach(node =>
			{
				let select = node.isInBounds(x, y);

				if (event.shiftKey && node.select)
					select = !select;

				if (select != node.select)
				{
					node.select = select;
					this.repaint = true;
				}
			});
		}
		else if (event.which == 2)
			this.cameraDrag = true;
	}

	/*
	 * An internal method called to handle mouse move events.
	 */
	onMouseMove(event)
	{
		let x = event.clientX;
		let y = event.clientY;

		let hoverPlug = null;

		this.nodes.forEach(node =>
		{
			let hover = node.isInBounds(x, y);

			node.forEachPlug(plug =>
			{
				let h = plug.isInBounds(x, y);

				if (h)
					hoverPlug = plug;

				if (h != plug.hover)
				{
					plug.hover = h;
					this.repaint = true;
				}

				if (h)
					hover = true;
			});

			if (hover != node.hover)
			{
				node.hover = hover;
				this.repaint = true;
			}
		});

		if (this.mouseDown)
		{
			if (hoverPlug != null && this.firstMove)
				this.tempConnection = new NodeGraph.Connection(this, hoverPlug,
					this.tempConnectionPlug);

			let hasGrid = this.theme.hasGridBehaviour;
			let grid = this.theme.gridSize;

			if (this.tempConnection != null)
			{
				this.tempConnectionPlug._x = this.camera.acamX(x);
				this.tempConnectionPlug._y = this.camera.acamY(y);

				if (hoverPlug != null)
				{
					this.tempConnectionPlug._x = hoverPlug.x;
					this.tempConnectionPlug._y = hoverPlug.y;
				}

				this.repaint = true;
			}
			else
			{
				let dx = (x - this.lastMouseX) / this.camera.zoomSmooth;
				let dy = (y - this.lastMouseY) / this.camera.zoomSmooth;

				this.nodes.forEach(node =>
				{
					if (!node.select)
						return;

					node.dragging = true;
					node.position.x += dx;
					node.position.y += dy;

					if (hasGrid)
						node.snapPos.setFrom(node.position);
					else
					{
						node.snapPos.x = Math.round(node.position.x / grid) * grid;
						node.snapPos.y = Math.round(node.position.y / grid) * grid;
					}
				});
			}
		}

		if (this.cameraDrag)
		{
			this.camera.x -= x - this.lastMouseX;
			this.camera.y -= y - this.lastMouseY;
		}

		this.lastMouseX = x;
		this.lastMouseY = y;
		this.firstMove = false;
	}

	/*
	 * An internal method called to handle mouse up events.
	 */
	onMouseUp(event)
	{
		let x = event.clientX;
		let y = event.clientY;

		this.mouseDown = false;
		this.cameraDrag = false;

		if (this.tempConnection != null)
		{
			let hoverPlug = null;
			this.nodes.forEach(node =>
			{
				node.forEachPlug(plug =>
				{
					let h = plug.isInBounds(x, y);

					if (h)
						hoverPlug = plug;
				});
			})

			if (hoverPlug != null)
			{
				try
				{
					this.addConnection(this.tempConnection.outputPlug, hoverPlug);
				}
				catch (err){}
			}

			this.tempConnection = null;
			this.repaint = true;
		}

		this.nodes.forEach(node =>
		{
			node.dragging = false;
			node.position.setFrom(node.snapPos);
		});
	}

	/*
	 * An internal method called to handle mouse exit events.
	 */
	onMouseExit(event)
	{
		this.mouseDown = false;
		this.cameraDrag = false;

		this.nodes.forEach(node =>
		{
			node.dragging = false;

			if (node.hover)
			{
				node.hover = false;
				this.repaint = true;
			
			}

			node.forEachPlug(plug =>
			{
				if (plug.hover)
				{
					plug.hover = false;
					this.repaint = true;
				}
			});
		});
	}

	/*
	 * An internal method called to handle mouse wheel events.
	 */
	onScroll(event)
	{
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

		if (delta < 0)
		{
			if (this.camera.zoom > 0.2)
				this.camera.zoom *= Math.pow(0.92, -delta);
		}
		else
		{
			if (this.camera.zoom < 5)
				this.camera.zoom *= Math.pow(1/0.92, delta);
		}

		this.camera.x = x * this.camera.zoom - mouseX;
		this.camera.y = y * this.camera.zoom - mouseY;

		this.repaint = true;
	}

	onContextMenu(event)
	{
		this.popuptext.classList.toggle("nodegraph-show");

		let popupContainer = this.popuptext.parentElement;
		popupContainer.style.left = event.clientX + 'px';
		popupContainer.style.top = event.clientY + 'px';

		this.onMouseDown(event);
		this.onMouseUp(event);

		event.preventDefault();
	}
}
