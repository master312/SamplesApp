/**
 * A component that allows the user to select the video input device.
 * Supports camera devices, screen sharing, and screen+camera combination.
 * 
 * @event input-changed-video
 * Fired when the video input device changes.
 * The detail of the event contains the new media stream.
 * 
 * IMPORTANT: View (video-view) must be setup before this component!
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('input-video-selector');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="input-group mb-3">
        <div class="input-group-prepend">
            <span class="input-group-text">Video Source</span>
        </div>
        <select id="video-source" class="form-control custom-select"></select>
    </div>
`;

class InputVideoSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        this.videoSourceElement = this.shadowRoot.getElementById('video-source');
        this._mediaManager = null;
        this._webRTCAdaptor = null;
    }

    connectedCallback() {
        this.videoSourceElement.addEventListener('change', () => this._handleVideoSourceChange());
    }

    setup(webRTCAdaptor) {
        this._webRTCAdaptor = webRTCAdaptor;
        this._mediaManager = webRTCAdaptor.mediaManager;
        this._populateDevices();
    }

    get currentVideoSource() {
        return this.videoSourceElement.value;
    }

    async _handleVideoSourceChange() {
        const videoDeviceId = this.videoSourceElement.value;
        const publishStreamId = this._webRTCAdaptor?.publishStreamId;
        
        if (!this._mediaManager?.localStream) return;

        const actions = {
            'none': () => this._removeVideoTrack(),
            'screen': () => this._webRTCAdaptor.switchDesktopCapture(publishStreamId),
            'screen+camera': () => this._webRTCAdaptor.switchDesktopCaptureWithCamera(publishStreamId),
            'default': () => this._webRTCAdaptor.switchVideoCameraCapture(publishStreamId, videoDeviceId)
        };

        await (actions[videoDeviceId] || actions.default)();
        this._dispatchChangeEvent();
    }

    _removeVideoTrack() {
        const stream = this._mediaManager.localStream;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks[0].stop();
            stream.removeTrack(videoTracks[0]);
        }
    }

    async _populateDevices() {
        if (!this._mediaManager) return console.error("MediaManager is not setup in InputVideoSelector.");
        
        try {
            const devices = await this._mediaManager.getDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            
            this.videoSourceElement.innerHTML = '';
            
            videoInputs.forEach(device => {
                this.videoSourceElement.add(new Option(device.label || `Camera ${this.videoSourceElement.length + 1}`, device.deviceId));
            });

            if (navigator.mediaDevices.getDisplayMedia) {
                this.videoSourceElement.add(new Option('Screen Share', 'screen'));
                this.videoSourceElement.add(new Option('Screen with Camera', 'screen+camera'));
            }

            this.videoSourceElement.add(new Option('No Video', 'none'));
            await this._handleVideoSourceChange();

        } catch (error) {
            console.error('Error populating video devices:', error);
            this._dispatchErrorEvent(error);
        }
    }
    
    _dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('input-changed-video', { 
            detail: { stream: this._mediaManager.localStream },
            bubbles: true,
            composed: true
        }));
    }

    _dispatchErrorEvent(error) {
        this.dispatchEvent(new CustomEvent('error', {
            detail: { message: error.message, name: error.name },
            bubbles: true,
            composed: true
        }));
    }
    
    setInputDisabled(disabled) {
        this.videoSourceElement.disabled = disabled;
    }
}

window.customElements.define('input-video-selector', InputVideoSelector); 