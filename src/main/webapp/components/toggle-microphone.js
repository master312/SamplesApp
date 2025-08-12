import { ComponentCommon } from './component-common.js';

const bootstrapPath = ComponentCommon.getBootstrapCss();
const stylePath = ComponentCommon.getComponentCssConfig('toggle-microphone');
const commonStylePath = ComponentCommon.getCommonCss();
const iconsPath = ComponentCommon.getIconsBootstrapPath();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">

    <button type="button" class="btn btn-primary" id="toggle-microphone-button" title="Mute Microphone">
        <img src="${iconsPath}mic-fill.svg" id="microphone-icon" alt="Microphone On">
    </button>
`;

/**
 * ToggleMicrophoneButton is a simple component that provides a button to mute and unmute the microphone.
 * It is self-managing and, once provided with a WebRTCAdaptor instance,
 * it will automatically call the appropriate methods to toggle the microphone.
 */
class ToggleMicrophoneButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._adaptor = null;
        this.isMicrophoneOn = true;
    }

    connectedCallback() {
        this.toggleButton = this.shadowRoot.getElementById('toggle-microphone-button');
        this.microphoneIcon = this.shadowRoot.getElementById('microphone-icon');

        this.toggleButton.addEventListener('click', () => this.toggleMicrophone());
        this._updateUI();
    }
    
    setup(adaptor) {
        this._adaptor = adaptor;
    }

    toggleMicrophone() {
        if (!this._adaptor) {
            console.warn('ToggleMicrophoneButton not setup!');
            return;
        }

        if (this.isMicrophoneOn) {
            this._adaptor.muteLocalMic();
        } else {
            this._adaptor.unmuteLocalMic();
        }
        this.isMicrophoneOn = !this.isMicrophoneOn;
        this._updateUI();
    }

    _updateUI() {
        if (this.isMicrophoneOn) {
            this.toggleButton.title = 'Mute Microphone';
            this.microphoneIcon.src = `${iconsPath}mic-fill.svg`;
            this.microphoneIcon.alt = 'Microphone On';
            this.toggleButton.classList.remove('btn-danger');
            this.toggleButton.classList.add('btn-primary');
        } else {
            this.toggleButton.title = 'Unmute Microphone';
            this.microphoneIcon.src = `${iconsPath}mic-mute-fill.svg`;
            this.microphoneIcon.alt = 'Microphone Off';
            this.toggleButton.classList.remove('btn-primary');
            this.toggleButton.classList.add('btn-danger');
        }
    }
}

window.customElements.define('toggle-microphone', ToggleMicrophoneButton); 