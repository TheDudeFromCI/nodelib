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
	constructor(tree, element1, element2)
	{
		this.element1 = element1;
		this.element2 = element2;

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
