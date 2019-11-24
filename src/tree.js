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

        let eventPos = this.eventPos(event);
        let x = eventPos.x;
        let y = eventPos.y;

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

        let eventPos = this.eventPos(event);
        let x = eventPos.x;
        let y = eventPos.y;

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

    eventPos(event) {
        let elem = this.canvas;
        let top = 0;
        let left = 0;

        if (elem.getClientRects().length) {
            let rect = elem.getBoundingClientRect();
            let win = elem.ownerDocument.defaultView;

            top = rect.top + win.pageYOffset;
            left = rect.left + win.pageXOffset;
        }

        return {
            x: event.pageX - left,
            y: event.pageY - top
        };
    }

	/*
	 * An internal method called to handle mouse up events.
	 */
    onMouseUp(event) {
        event.preventDefault();

        this.nodes.forEach(node => node.input.setFocusable(true));

        let eventPos = this.eventPos(event);
        let x = eventPos.x;
        let y = eventPos.y;

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
        let eventPos = this.eventPos(event);
        let x = eventPos.x;
        let y = eventPos.y;
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
