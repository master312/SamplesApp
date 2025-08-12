
import { ComponentCommon } from './component-common.js';
import { CanvasDesigner } from '../js/canvas-designer/canvas-designer-widget.js';

const stylePath = ComponentCommon.getComponentCssConfig('collaborative-canvas');
const commonStylePath = ComponentCommon.getCommonCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div id="canvas-container"></div>
`;

/**
 * This component provides collaborative, real-time drawing canvas. 
 * Encapsulates the CanvasDesigner. Utilizes WebRTC data channel communication.
 *
 * USAGE: place it as a sibling to a <video-view> component, and call setup() and setStreamId()
 */
class CollaborativeCanvas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._adaptor = null;
        this._streamId = null;
        this._designer = null;
        this._handleDataReceived = this._handleDataReceived.bind(this);
        this._handleStreamEnd = this._handleStreamEnd.bind(this);
        this._handleDataChannelOpened = this._handleDataChannelOpened.bind(this);
    }

    connectedCallback() {
        this.canvasContainer = this.shadowRoot.getElementById('canvas-container');
    }

    setup(adaptor, designerSettings) {
        if (!adaptor) {
            this._dispatchErrorEvent(new Error('WebRTC adaptor is required'), 'setup');
            return;
        }

        this._adaptor = adaptor;
        try {
            this._adaptor.addEventListener((info, obj) => {
                 if (info === 'data_received') {
                    this._handleDataReceived(obj);
                } else if (info === 'publish_finished' || info === 'play_finished') {
                    this._handleStreamEnd(obj);
                }
                else if (info === 'data_channel_opened') {
                    this._handleDataChannelOpened(obj);
                }
            });

            this._designer = new CanvasDesigner();
            this._designer.widgetHtmlURL = '../js/canvas-designer/canvas-designer.html';
            this._designer.widgetJsURL = 'canvas-designer.js';

            const defaultSettings = {
                pencil: true,
                eraser: true,
                line: true,
                arrow: true,
                text: true,
                image: true,
                dragSingle: true,
                dragMultiple: true,
                arc: true,
                rectangle: true,
                marker: true,
                undo: true,
            };

            this._designer.setTools(designerSettings || defaultSettings);
            this._designer.setSelected('pencil');
            this._designer.appendTo(this.canvasContainer);
            this._designer.addSyncListener((data) => {
                if (!this._streamId) return;
                try {
                    this._adaptor.sendData(this._streamId, JSON.stringify(data));
                } catch (error) {
                    this._dispatchErrorEvent(error, 'send data');
                }
            });
        } catch (error) {
            this._dispatchErrorEvent(error, 'setup');
        }
    }

    /**
     * Sets the stream ID for the canvas and initializes the drawing tool.
     */
    setStreamId(streamId) {
        if (!this._adaptor) {
            console.error('CollaborativeCanvas: setup() not invoked');
            return;
        }

        if (this._streamId === streamId) return;
        this._streamId = streamId;
    }

    _handleDataReceived(obj) {
        if (!this._designer || obj.streamId !== this._streamId) {
            return;
        }

        try {
            if (obj.data === "request") {
                this._designer.sync();
            } else if (obj.data === "clear") {
                this._designer.clearCanvas();
                this._designer.sync();
            } else {
                this._designer.syncData(JSON.parse(obj.data));
            }
        } catch (error) {
            this._dispatchErrorEvent(error, 'data processing');
        }
    }
    
     _handleDataChannelOpened(streamId) {
        if (!this._designer || streamId !== this._streamId) {
            return;
        }

        if (this._designer.pointsLength > 0) {
            this._designer.undo('all');
        }

        this._sendData("request");
    }
    
    _sendData(data) {
        try {
            if (!this._streamId) return;
            const iceState = this._adaptor.iceConnectionState(this._streamId);
            if (iceState != null && iceState != "failed" && iceState != "disconnected") {
                 this._adaptor.sendData(this._streamId, data);
            }
        } catch (error) {
            this._dispatchErrorEvent(error, 'send data');
        }
    }

    _handleStreamEnd(obj) {
        if (!this._designer || obj.streamId !== this._streamId) return;
        this._designer.clearCanvas();
        this._streamId = null;
    }

    _dispatchErrorEvent(error, context) {
        const message = context ? `CollaborativeCanvas ${context}: ${error.message}` : `CollaborativeCanvas: ${error.message}`;
        console.error(message);
        this.dispatchEvent(new CustomEvent('error', {
            detail: { message, name: error.name },
            bubbles: true,
            composed: true
        }));
    }
}

window.customElements.define('collaborative-canvas', CollaborativeCanvas); 