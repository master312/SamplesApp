/**
 * Handles sending and receiving messages over WebRTC data channels.
 * It supports an `onDataReceivedInterceptor` callback to pre-process received messages.
 * It supports an `onDataSendInterceptor` callback to pre-process messages before they are actually sent over data channel.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('data-channel-messaging');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="card">
        <div class="card-header collapsible-header" data-toggle="collapse" data-target="#collapse-body" aria-expanded="true">
            <span>Data Channel</span>
            <span id="status-badge" class="badge stream-status-offline ml-2">Stream Offline</span>
        </div>
        <div id="collapse-body" class="collapse show">
            <div class="card-body">
                <div id="offline-message" class="text-center text-muted p-4">
                    <p><strong>Stream is offline</strong></p>
                    <p>Please start streaming to enable data channel messaging</p>
                </div>
                <div id="data-content" style="display: none;">
                    <div id="all-messages"></div>
                    <div class="input-group">
                        <input type="text" id="data-message" class="form-control" placeholder="Type a message...">
                        <div class="input-group-append">
                            <button id="send-data" class="btn btn-outline-secondary">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

class DataChannelMessaging extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._adaptor = null;
        this._publishStreamId = null;
        this._playStreamId = null;

        /** Whether to display sent messages in the chat */
        this.displaySentMessages = true;

        /**
         * A callback function that is triggered when a new message is received.
         * It allows for intercepting and modifying the message before it is displayed.
         * @param {string} message - The raw message received from the data channel.
         * @returns {string|null} - The modified message to be displayed, or null/empty to display the original message.
         */
        this.onDataReceivedInterceptor = null;

        /** Same as @onDataReceivedInterceptor, but for messages sent over data channel. Called before message is sent. */
        this.onDataSendInterceptor = null;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('send-data').addEventListener('click', () => this._sendData());
        this.shadowRoot.getElementById('data-message').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this._sendData();
        });
        this._updateUI();
    }

    setup(adaptor) {
        this._adaptor = adaptor;
        this._adaptor.addEventListener((info, obj) => {
            if (info === "publish_started") {
                this._publishStreamId = obj.streamId;
                this._updateUI();
            } else if (info === "play_started") {
                this._playStreamId = obj.streamId;
                this._updateUI();
            } else if (info === "publish_finished") {
                this._publishStreamId = null;
                this._updateUI();
            } else if (info === "play_finished") {
                this._playStreamId = null;
                this._updateUI();
            } else if (info === "data_received") {
                if (typeof this.onDataReceivedInterceptor === 'function') {
                    const processedMessage = this.onDataReceivedInterceptor(obj.data);
                    if (typeof processedMessage === 'string' && processedMessage.length > 0) {
                        this._displayMessage('Received', processedMessage);
                    }
                } else {
                    this._displayMessage('Received', obj.data);
                }

            }
        });
    }

    _updateUI() {
        const hasStreams = this._publishStreamId || this._playStreamId;
        
        this.shadowRoot.getElementById('status-badge').style.display = hasStreams ? 'none' : 'inline';
        this.shadowRoot.getElementById('offline-message').style.display = hasStreams ? 'none' : 'block';
        this.shadowRoot.getElementById('data-content').style.display = hasStreams ? 'block' : 'none';
        this.shadowRoot.getElementById('data-message').disabled = !hasStreams;
        this.shadowRoot.getElementById('send-data').disabled = !hasStreams;
    }

    _sendData() {
        let message = this.shadowRoot.getElementById('data-message').value.trim();
        if (!message || !this._adaptor) return;

        const streamId = this._publishStreamId || this._playStreamId;
        if (!streamId) {
            return;
        }

        if (typeof this.onDataSendInterceptor === 'function') {
            const processedMessage = this.onDataSendInterceptor(message);
            if (typeof processedMessage !== 'string' || processedMessage.length === 0) return;

            message = processedMessage;
        }

        this._adaptor.sendData(streamId, message);
        if (this.displaySentMessages) this._displayMessage('Sent', message);
        this.shadowRoot.getElementById('data-message').value = '';
    }

    _displayMessage(type, message) {
        const messagesDiv = this.shadowRoot.getElementById('all-messages');
        const timestamp = new Date().toLocaleTimeString();
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>[${timestamp}] ${type}:</strong> ${message}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

customElements.define('data-channel-messaging', DataChannelMessaging); 