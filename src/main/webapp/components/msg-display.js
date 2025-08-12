/**
 * This is basic debug component for logging and displaying events and errors
 * from a WebRTCAdaptor events
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('msg-display');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const MAX_HISTORY_SIZE = 500;

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="msg-display-container">
        <div class="header" id="header">
            <span class="header-title">Adaptor event logs: <span id="collapse-indicator">▼</span></span>
            <div class="controls">
                <button id="settings-toggle-btn" class="btn btn-sm btn-light">Settings</button>
                <button id="clear-btn" class="btn btn-sm btn-light">Clear</button>
            </div>
        </div>
        <div id="collapsible-content">
            <div id="settings-panel" style="display: none;"></div>
            <div id="log-container"></div>
        </div>
    </div>
`;

class MsgDisplay extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._messages = [];
        this._eventVisibility = new Map([
            ['error', true],
            ['play_started', false],
            ['play_finished', false],
            ['publish_started', false],
            ['publish_finished', false]
        ]);
        this._isCollapsed = false;
    }

    connectedCallback() {
        const shadow = this.shadowRoot;
        this.logContainer = shadow.getElementById('log-container');
        this.settingsPanel = shadow.getElementById('settings-panel');
        this.collapsibleContent = shadow.getElementById('collapsible-content');
        this.collapseIndicator = shadow.getElementById('collapse-indicator');

        shadow.getElementById('header').addEventListener('click', (e) => {
            if (!e.target.closest('.controls')) this._toggleCollapse();
        });

        shadow.getElementById('settings-toggle-btn').addEventListener('click', () => {
            if (this._isCollapsed) this._toggleCollapse();
            const panel = this.settingsPanel;
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        shadow.getElementById('clear-btn').addEventListener('click', () => {
            this._messages = [];
            this._render();
        });
    }

    setup(adaptor) {
        if (!adaptor) return console.error("MsgDisplay: WebRTCAdaptor instance is required.");
        adaptor.addEventListener((info, obj) => this._addMessage('info', info, obj));
        adaptor.addErrorEventListener((error, message) => this._addMessage('error', error, message));
        this._updateSettingsPanel();
    }

    _toggleCollapse() {
        this._isCollapsed = !this._isCollapsed;
        this.collapsibleContent.style.display = this._isCollapsed ? 'none' : 'block';
        this.collapseIndicator.textContent = this._isCollapsed ? '▶' : '▼';
        if (this._isCollapsed) this.settingsPanel.style.display = 'none';
    }

    _addMessage(type, name, data) {
        if (!this._eventVisibility.has(name)) {
            this._eventVisibility.set(name, false);
            this._updateSettingsPanel();
        }
        
        const message = { type, name, data, timestamp: new Date() };
        this._messages.push(message);
        if (this._messages.length > MAX_HISTORY_SIZE) this._messages.shift();

        if (this._shouldShow(message)) this._renderMessage(message);
    }

    _shouldShow(msg) {
        return (msg.type === 'error' && this._eventVisibility.get('error')) || 
               this._eventVisibility.get(msg.name);
    }
    
    _render() {
        this.logContainer.innerHTML = '';
        this._messages.filter(msg => this._shouldShow(msg)).forEach(msg => this._renderMessage(msg));
    }

    _renderMessage(msg) {
        const div = document.createElement('div');
        div.className = `log-message${msg.type === 'error' ? ' error' : ''}`;
        
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let dataStr = '';
        if (msg.data != null) {
            if (typeof msg.data === 'object' && Object.keys(msg.data).length > 0) {
                try { dataStr = `- ${JSON.stringify(msg.data)}`; } 
                catch { dataStr = '- [Unserializable data]'; }
            } else if (typeof msg.data !== 'object') {
                dataStr = `- ${msg.data}`;
            }
        }

        div.innerHTML = `<span class="time">[${time}]</span> <span class="name">${msg.name}</span> <span class="data">${dataStr}</span>`;
        this.logContainer.appendChild(div);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    _updateSettingsPanel() {
        this.settingsPanel.innerHTML = '';
        const events = [...this._eventVisibility.keys()].sort();
        
        // Error toggle first
        const errorIndex = events.indexOf('error');
        if (errorIndex > -1) {
            this._createToggle('error', true);
            events.splice(errorIndex, 1);
        }
        
        events.forEach(name => this._createToggle(name));
    }

    _createToggle(eventName, isError = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-control custom-switch custom-control-inline';
        wrapper.innerHTML = `
            <input type="checkbox" class="custom-control-input" id="toggle-${eventName}" ${this._eventVisibility.get(eventName) ? 'checked' : ''}>
            <label class="custom-control-label${isError ? ' error-toggle' : ''}" for="toggle-${eventName}">${eventName}</label>
        `;
        
        wrapper.querySelector('input').addEventListener('change', (e) => {
            this._eventVisibility.set(eventName, e.target.checked);
            this._render();
        });
        
        this.settingsPanel.appendChild(wrapper);
    }
}

window.customElements.define('msg-display', MsgDisplay); 