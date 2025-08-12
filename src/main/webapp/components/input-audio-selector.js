/**
 * A component that allows the user to select the audio input device.
 * Supports microphone devices and no audio option.
 * 
 * @event input-changed-audio
 * Fired when the audio input device changes.
 * The detail of the event contains the updated media stream.
 * 
 * IMPORTANT: View (video-view) must be setup before this component!
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('input-audio-selector');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="input-group mb-3">
        <div class="input-group-prepend">
            <span class="input-group-text">Audio Source</span>
        </div>
        <select id="audio-source" class="form-control custom-select"></select>
    </div>
`;

class InputAudioSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        this.audioSource = this.shadowRoot.getElementById('audio-source');
        this._mediaManager = null;
        this._webRTCAdaptor = null;
    }

    connectedCallback() {
        this.audioSource.addEventListener('change', () => this._handleAudioSourceChange());
    }

    setup(webRTCAdaptor) {
        this._webRTCAdaptor = webRTCAdaptor;
        this._mediaManager = webRTCAdaptor.mediaManager;
        this._populateDevices();
    }

    get currentAudioSource() {
        return this.audioSource.value;
    }

    async _handleAudioSourceChange() {
        const audioDeviceId = this.audioSource.value;
        const stream = this._mediaManager.localStream;

        if (!stream || !this._mediaManager) return;

        if (audioDeviceId !== 'none') {
            await this._webRTCAdaptor.switchAudioInputSource(this._webRTCAdaptor.publishStreamId, audioDeviceId);
        } else {
            this._removeAudioTrack(stream);
        }
        
        this._dispatchChangeEvent();
    }

    _removeAudioTrack(stream) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].stop();
            stream.removeTrack(audioTracks[0]);
        }
    }

    async _populateDevices() {
        if (!this._mediaManager) return console.error("MediaManager is not setup in InputAudioSelector.");
        
        try {
            const devices = await this._mediaManager.getDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            this.audioSource.innerHTML = '';

            audioInputs.forEach(device => {
                this.audioSource.add(new Option(device.label || `Microphone ${this.audioSource.length + 1}`, device.deviceId));
            });
            
            this.audioSource.add(new Option('No Audio', 'none'));

        } catch (error) {
            console.error('Error populating audio devices:', error);
            this._dispatchErrorEvent(error);
        }
    }
    
    _dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('input-changed-audio', {
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
        this.audioSource.disabled = disabled;
    }
}

window.customElements.define('input-audio-selector', InputAudioSelector); 