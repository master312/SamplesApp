/**
 * TODO: Hacky test component
 * 
 * Web Component that displays WebRTC stream state and role.
 * Monitors stream type (play/publish) and shows connection status
 * and role (Playing/Broadcasting).
 * 
 * Attribute: stream-type ('play'/'publish')
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('stream-simple-state');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const templateHtml = document.createElement('template');
templateHtml.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="state-container card">
        <div class="card-body">
            <h6 class="card-title">Stream Status</h6>
            <div class="status-row">
                <span class="status-item">
                    <strong>State:</strong> <span id="connection-state" class="badge">Idle</span>
                </span>
                <span class="status-item">
                    <strong>Role:</strong> <span id="stream-role" class="badge">N/A</span>
                </span>
                <span class="status-item reconnect-indicator">
                    <span id="reconnect-status" class="badge badge-outline" title="Auto-reconnect status">
                        <small>↻ Auto</small>
                    </span>
                </span>
            </div>
        </div>
    </div>
`;

class StreamSimpleState extends HTMLElement {
    static get observedAttributes() {
        return ['stream-type'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(templateHtml.content.cloneNode(true));
        
        this._adaptor = null;
        this._streamId = null;
        this._connectionState = 'Idle';
    }

    get streamType() {
        return this.getAttribute('stream-type') || 'play';
    }

    set streamType(value) {
        if (value) {
            this.setAttribute('stream-type', value);
        } else {
            this.removeAttribute('stream-type');
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'stream-type' && oldValue !== newValue && this._adaptor) {
            // Reset state when stream type changes
            this._streamId = null;
            this._connectionState = 'Idle';
            this._updateUI();
        }
    }

    connectedCallback() {
        this.connectionStateElement = this.shadowRoot.getElementById('connection-state');
        this.streamRoleElement = this.shadowRoot.getElementById('stream-role');
        this.reconnectStatusElement = this.shadowRoot.getElementById('reconnect-status');
        this._updateUI();
    }

    setup(adaptor) {
        this._adaptor = adaptor;
        this._adaptor.addEventListener((info, obj) => this._handleStateChange(info, obj));
        this._adaptor.addErrorEventListener((error, message) => this._handleStateChange('error', message));
    }

    _handleStateChange(info, obj) {
        if (!this.isConnected) {
            return;
        }

        const startEvent = this.streamType === 'publish' ? 'publish_started' : 'play_started';
        const stopEvent = this.streamType === 'publish' ? 'publish_finished' : 'play_finished';
        const reconnectEvent = this.streamType === 'publish' ? 'reconnection_attempt_for_publisher' : 'reconnection_attempt_for_player';

        let newConnectionState = this._connectionState;

        // Check if the event is relevant to the stream we are monitoring.
        let eventStreamId = null;
        if (typeof obj === 'string') {
            eventStreamId = obj;
        } else if (obj && obj.streamId) {
            eventStreamId = obj.streamId;
        }

        const isRelevant = this._streamId && eventStreamId === this._streamId;

        if (info === startEvent) {
            this._streamId = eventStreamId;
            newConnectionState = 'Connected';
        } else if (isRelevant) {
            if (info === reconnectEvent) {
                newConnectionState = 'Reconnecting';
            } else if (info === stopEvent) {
                newConnectionState = 'Stopped';
                this._streamId = null;
            } else if (info === 'error') {
                if (this._adaptor && this._adaptor.reconnectIfRequiredFlag) {
                    // An error occurred, but we're set to reconnect.
                    newConnectionState = 'Reconnecting';
                } else {
                    // It's a fatal error because we are not reconnecting.
                    newConnectionState = 'Failed';
                    this._streamId = null;
                }
            }
        } else if (info === 'error' && !this._streamId) {
            // Handle general errors when no stream is active
            // This could be websocket connection failed or stream not found
            newConnectionState = 'Failed';
        } else if (info === reconnectEvent && !this._streamId) {
            // Handle reconnection attempts when no specific stream is tracked yet
            newConnectionState = 'Reconnecting';
        }

        if (this._connectionState !== newConnectionState) {
            this._connectionState = newConnectionState;
            this._updateUI();
        }
    }

    _updateUI() {
        if (!this.connectionStateElement) return;

        this.connectionStateElement.textContent = this._connectionState;
        this.connectionStateElement.className = 'badge'; 
        switch(this._connectionState) {
            case 'Idle':
            case 'Stopped':
            case 'N/A':
                this.connectionStateElement.classList.add('badge-secondary');
                break;
            case 'Connecting':
            case 'Reconnecting':
                this.connectionStateElement.classList.add('badge-warning');
                break;
            case 'Connected':
                this.connectionStateElement.classList.add('badge-success');
                break;
            case 'Disconnected':
            case 'Failed':
                this.connectionStateElement.classList.add('badge-danger');
                break;
        }
        
        let roleText = 'N/A';
        let roleClass = 'badge-secondary';
        
        // Show role based on stream type when we have an active state or when there's activity
        if (this._streamId || this._connectionState !== 'Idle') {
            if (this.streamType === 'publish') {
                roleText = 'Broadcasting';
                roleClass = 'badge-info';
            } else if (this.streamType === 'play') {
                roleText = 'Playing';
                roleClass = 'badge-primary';
            }
        }
       
        this.streamRoleElement.textContent = roleText;
        this.streamRoleElement.className = 'badge ' + roleClass;

        // Update reconnect indicator
        if (this.reconnectStatusElement && this._adaptor) {
            const isReconnectEnabled = this._adaptor.reconnectIfRequiredFlag;
            this.reconnectStatusElement.innerHTML = isReconnectEnabled ? 
                '<small>↻ Auto</small>' : '<small>⊘ Manual</small>';
            this.reconnectStatusElement.className = isReconnectEnabled ? 
                'badge badge-outline badge-success' : 'badge badge-outline badge-secondary';
            this.reconnectStatusElement.title = isReconnectEnabled ? 
                'Auto-reconnect enabled' : 'Auto-reconnect disabled';
        }
    }
}

window.customElements.define('stream-simple-state', StreamSimpleState); 