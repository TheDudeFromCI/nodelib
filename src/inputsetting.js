NodeGraph.InputSetting = class
{
	constructor(name)
	{
		this.name = name;
		this.lineHeight = 1;
		this.minWidth = 50;
	}

	update()
	{

	}

	destroy()
	{
	}
}

NodeGraph.TextSetting = class extends NodeGraph.InputSetting
{
	constructor(name, isLong)
	{
		super(name);

		this.minWidth = 150;

		this.textInput = document.createElement('input');
		document.body.appendChild(this.textInput);

		this.textInput.setAttribute("type", "text");
		this.textInput.classList.add('nodegraph-inputsetting');
	}

	update(rect, zoom)
	{
		let borderRadius = 4 * zoom;
		let padding = 3 * zoom;
		let fontSize = 16 * zoom;

		this.textInput.style.top = rect.y + 'px';
		this.textInput.style.left = rect.x + 'px';
		this.textInput.style.width = rect.width + 'px';
		this.textInput.style.height = rect.height + 'px';
		this.textInput.style.fontSize = fontSize + 'px';
		this.textInput.style.borderRadius = borderRadius + 'px';
		this.textInput.style.padding = padding + 'px';
	}

	destroy()
	{
		document.body.removeChild(this.textInput);
	}
}

NodeGraph.TextBlockSetting = class extends NodeGraph.InputSetting
{
	constructor(name)
	{
		super(name);

		this.lineHeight = 6;
		this.minWidth = 150;

		this.textInput = document.createElement('textarea');
		document.body.appendChild(this.textInput);

		this.textInput.classList.add('nodegraph-inputsetting');
		this.textInput.rows = this.lineHeight;
		this.textInput.style.resize = 'none';
	}

	update(rect, zoom)
	{
		let borderRadius = 4 * zoom;
		let padding = 3 * zoom;
		let fontSize = 16 * zoom;

		this.textInput.style.top = rect.y + 'px';
		this.textInput.style.left = rect.x + 'px';
		this.textInput.style.width = rect.width + 'px';
		this.textInput.style.height = rect.height + 'px';
		this.textInput.style.fontSize = fontSize + 'px';
		this.textInput.style.borderRadius = borderRadius + 'px';
		this.textInput.style.padding = padding + 'px';
	}

	destroy()
	{
		document.body.removeChild(this.textInput);
	}
}
