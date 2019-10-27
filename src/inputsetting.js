NodeGraph.InputSetting = class
{
	constructor(tree, name, domType)
	{
		this.tree = tree;
		this.name = name;
		this.lineHeight = 1;
		this.minWidth = 50;
		this.focusable = true;
		this.dom = null;

		this.dom = document.createElement(domType);
		document.body.appendChild(this.dom);

		this.dom.classList.add('nodegraph-inputsetting');
		this.dom.addEventListener('focus', e => this.onFocus(e));
		this.dom.addEventListener('mousewheel', e => this.onScroll(e));
		this.dom.addEventListener('mousedown', e => this.onMouseDown(e));
		this.dom.addEventListener('mousemove', e => this.onMouseMove(e));
		this.dom.addEventListener('mouseup', e => this.onMouseUp(e));
	}

	update(rect, zoom)
	{
		let borderRadius = 4 * zoom;
		let padding = 3 * zoom;
		let fontSize = 16 * zoom;

		this.dom.style.top = rect.y + 'px';
		this.dom.style.left = rect.x + 'px';
		this.dom.style.width = rect.width + 'px';
		this.dom.style.height = rect.height + 'px';
		this.dom.style.fontSize = fontSize + 'px';
		this.dom.style.borderRadius = borderRadius + 'px';
		this.dom.style.padding = padding + 'px';
	}

	destroy()
	{
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
}

NodeGraph.TextSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name)
	{
		super(tree, name, 'input');
		this.dom.setAttribute("type", "text");

		this.minWidth = 150;
	}
}

NodeGraph.TextBlockSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name)
	{
		super(tree, name, 'textarea');

		this.lineHeight = 6;
		this.minWidth = 150;

		this.dom.rows = this.lineHeight;
		this.dom.style.resize = 'none';
	}
}
