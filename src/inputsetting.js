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
