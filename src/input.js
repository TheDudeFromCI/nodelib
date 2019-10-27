NodeGraph.Input = class
{
	constructor(node)
	{
		this.node = node;

		//this.canvas = document.createElement('canvas');
		this.width = node.width;
		this.height = 0;

		this.settingHeight = 24;
		this.settings = [];
	}

	addSetting(setting)
	{
		this.settings.push(setting);
		this.recalculateHeight();
	}

	recalculateHeight()
	{
		let height = 0;

		for (let setting of this.settings)
			height += setting.lines * this.settingHeight;

		this.height = height;
	}

	update()
	{
		let zoom = this.node.tree.camera.zoomSmooth;
		let width = (this.node.width - 10) * zoom;
		let height = this.settingHeight * zoom;

		let pos = this.node.posSmooth.copy();
		pos.shift(5, this.node.tree.theme.nodeHeaderSize + 4);
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

	destroy()
	{
		for (let input of this.settings)
			input.destroy();

		this.settings = [];
	}

	setFocusable(state)
	{
		for (let input of this.settings)
		{
			input.focusable = state;

			if (input.dom != null)
				input.dom.style.pointerEvents = state ? 'auto' : 'none';
		}
	}
}
