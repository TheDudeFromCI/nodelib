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
