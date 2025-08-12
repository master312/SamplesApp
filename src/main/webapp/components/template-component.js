const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
            border: 1px solid #ccc;
            padding: 10px;
        }
    </style>
    <div>
        <p>This is a template component.</p>
        <p>WebRTCAdaptor status: <span id="status">Not set</span></p>
    </div>
`;

class TemplateComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._adaptor = null;
    }

    setup(adaptor) {
        this._adaptor = adaptor;
        const statusEl = this.shadowRoot.getElementById('status');
        if (this._adaptor) {
            console.log('WebRTCAdaptor instance has been set on the template component:', this._adaptor);
            statusEl.textContent = 'Set successfully!';
            statusEl.style.color = 'green';
        } else {
            statusEl.textContent = 'Not set';
            statusEl.style.color = 'red';
        }
    }

    getAdaptor() {
        return this._adaptor;
    }
}

window.customElements.define('template-component', TemplateComponent); 