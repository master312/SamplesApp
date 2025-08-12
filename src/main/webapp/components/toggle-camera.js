import { ComponentCommon } from './component-common.js';

const bootstrapPath = ComponentCommon.getBootstrapCss();
const stylePath = ComponentCommon.getComponentCssConfig('toggle-camera');
const commonStylePath = ComponentCommon.getCommonCss();
const iconsPath = ComponentCommon.getIconsBootstrapPath();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">

    <button type="button" class="btn btn-primary" id="toggle-camera-button" title="Disable Camera">
        <img src="${iconsPath}camera-video-fill.svg" id="camera-icon" alt="Camera On">
    </button>
`;

/**
 * ToggleCameraButton is a simple component that provides a button to disable and enable the camera.
 * It is self-managing and, once provided with a WebRTCAdaptor instance,
 * it will automatically call the appropriate methods to toggle the camera.
 */
class ToggleCameraButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._adaptor = null;
        this.isCameraOn = true;
    }

    connectedCallback() {
        this.toggleButton = this.shadowRoot.getElementById('toggle-camera-button');
        this.cameraIcon = this.shadowRoot.getElementById('camera-icon');

        this.toggleButton.addEventListener('click', () => this.toggleCamera());
        this._updateUI();
    }

    setup(adaptor) {
        this._adaptor = adaptor;
    }

    toggleCamera() {
        if (!this._adaptor) {
            console.warn('ToggleCameraButton not setup!');
            return;
        }

        if (this.isCameraOn) {
            this._adaptor.turnOffLocalCamera();
        } else {
            this._adaptor.turnOnLocalCamera();
        }
        this.isCameraOn = !this.isCameraOn;
        this._updateUI();
    }

    _updateUI() {
        if (this.isCameraOn) {
            this.toggleButton.title = 'Disable Camera';
            this.cameraIcon.src = `${iconsPath}camera-video-fill.svg`;
            this.cameraIcon.alt = 'Camera On';
            this.toggleButton.classList.remove('btn-danger');
            this.toggleButton.classList.add('btn-primary');
        } else {
            this.toggleButton.title = 'Enable Camera';
            this.cameraIcon.src = `${iconsPath}camera-video-off-fill.svg`;
            this.cameraIcon.alt = 'Camera Off';
            this.toggleButton.classList.remove('btn-primary');
            this.toggleButton.classList.add('btn-danger');
        }
    }
}

window.customElements.define('toggle-camera', ToggleCameraButton); 