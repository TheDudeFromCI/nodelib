NodeGraph.InputSetting = class
{
	constructor(tree, name, domType, isOutput)
	{
		this.tree = tree;
		this.name = name;
		this.lineHeight = 1;
		this.minWidth = 50;
		this.focusable = true;
		this.isOutput = isOutput;
		this.filled = false;
		this.unfocusable = false;

		this.domType = domType;
		this.buildDom(domType);
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

		this.buildDom(this.filled ? 'p' : this.domType);

		if (this.filled)
		{
			this.lineHeight = 1;
			this.dom.innerHTML = this.name;

			if (this.isOutput)
				this.dom.style.textAlign = 'right';
			else
				this.dom.style.textAlign = 'left';
		}
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

NodeGraph.TextInputSetting = class extends NodeGraph.InputSetting
{
	constructor(tree, name)
	{
		super(tree, name, 'input', false);
		this.minWidth = 150;
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
		super(tree, name, 'p', isOutput);
		this.unfocusable = true;
	}

	buildDomLate()
	{
		this.dom.innerHTML = this.name;

		if (this.isOutput)
			this.dom.style.textAlign = 'right';
		else
			this.dom.style.textAlign = 'left';

		this.setFocusable(false);
	}
}
