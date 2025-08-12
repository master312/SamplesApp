/**
 * VideoView is a Web Component for displaying a single WebRTC video stream.
 * It standardizes the look and feel of the video player and handles common
 * functionalities like muting for local streams.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('video-view');

const templateHtml = document.createElement('template');
templateHtml.innerHTML = `
    <link rel="stylesheet" href="${stylePath}">
    <video id="video" playsinline autoplay muted></video>
    <div id="label" class="label"></div>
`;

class VideoView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(templateHtml.content.cloneNode(true));
        this.videoElement = this.shadowRoot.querySelector('#video');
        this.labelOverlay = this.shadowRoot.querySelector('#label');
        this.videoElement.controls = true;

        this._isLocal = false;
    }

    connectedCallback() {
        // 'is-local' attribute indicated that the video source
        // is the user's own camera, in which case we mute sound
        if (this.hasAttribute('is-local')) {
            this._isLocal = true;
            this.videoElement.muted = true;
        }

        if (this.hasAttribute('muted')) {
            this.videoElement.muted = true;
        }

        if (this.hasAttribute('show-controls') && this.getAttribute('show-controls') !== 'true') {
            this.videoElement.controls = false;
        }

        const label = this.getAttribute('label');
        if (label) {
            this.labelOverlay.textContent = label;
            this.labelOverlay.style.display = 'block';
        } else {
            this.labelOverlay.style.display = 'none';
        }

        this.videoElement.autoplay = true;
    }

    setup(webRtcAdaptor) {
        if (this._isLocal && webRtcAdaptor) {
            webRtcAdaptor.mediaManager.changeLocalVideo(this.videoElement);
        }
    }

    setStream(stream) {
        this.videoElement.srcObject = stream;
    }

    clearStream() {
        this.videoElement.srcObject = null;
    }
    
    /**
     * direct access to the internal video element
     */
    get video() {
        return this.videoElement;
    }
}

window.customElements.define('video-view', VideoView); 