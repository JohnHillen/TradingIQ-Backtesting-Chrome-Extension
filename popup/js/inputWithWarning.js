// Custom Web Component for input with warning
class InputWithWarning extends HTMLElement {
    connectedCallback() {
        const id = this.getAttribute('input-id');
        const label = this.getAttribute('label') || '';
        const placeholder = this.getAttribute('placeholder');
        const dataType = this.getAttribute('data-type');
        const dataMin = this.getAttribute('data-min');
        const dataMax = this.getAttribute('data-max');
        const warnMsg = this.getAttribute('warn-msg') || '';
        const cellRow = this.getAttribute('cell-row') || 'w3-cell-row';
        const width = this.getAttribute('width');
        let tooltip = this.getAttribute('tooltip');

        // Build input attributes string, only add if present
        let inputAttrs = `data-name="iqSettings" class="w3-input" id="${id}" type="text"`;
        if (placeholder) inputAttrs += ` placeholder="${placeholder}"`;
        if (dataType) inputAttrs += ` data-type="${dataType}"`;
        if (dataMin) inputAttrs += ` data-min="${dataMin}"`;
        if (dataMax) inputAttrs += ` data-max="${dataMax}"`;

        // Tooltip HTML if present
        let tooltipHtml = '';
        if (tooltip) {
            tooltip = tooltip.replace(/#CSL_INFO#/g, CSL_INFO)
                .replace(/#TIMEFRAME_INPUT#/g, TIMEFRAME_INPUT);

            tooltipHtml = `
                <div class="w3-tooltip w3-small w3-cell w3-cell-middle" style="width: 22px;">
                    <span class="w3-text w3-aqua w3-padding w3-round w3-card-4" style="position:absolute;left:-20px;top:20px;width:370px;z-index: 100;">${tooltip}</span>
                    <svg class="w3-cell" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
                        <path fill="currentColor" d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm1-12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.5 9.5H7V8h3v6H8.5V9.5Z"></path>
                    </svg>
                </div>
            `;
        }
        this.innerHTML = `
            <div class="${cellRow}">
                <div class="w3-cell w3-cell-middle"${width ? ` style="width: ${width};"` : ''}>
                    ${tooltipHtml}
                    <label class="w3-cell w3-cell-middle">${label}</label>
                </div>
                <div class="w3-cell w3-cell-middle">
                    <input ${inputAttrs}>
                </div>
            </div>
            <div id="${id}_warning" class="w3-cell-row prevent-select w3-red w3-margin" style="display:none;">
                <span><b>Warning </b><span id="warningMsg">${warnMsg}</span></span>
            </div>
            `;
    }
}
customElements.define('input-with-warning', InputWithWarning);
