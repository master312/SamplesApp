/**
 * ResolutionSelector component provides a dropdown interface for
 * forcing specific stream resolution quality. 
 * If streamId is left NULL, it will use the streamId from the first played stream.
 * Componet works only when Playing streams.
 * 
 * This is self-managed component, meaning it will automatically read&modify with WebRTCAdaptor's state
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('resolution-selector');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="input-group w-100">
        <div class="input-group-prepend">
            <label class="input-group-text" for="resolution-select">Resolution</label>
        </div>
        <select class="custom-select" id="resolution-select">
            <option selected value="0">Automatic</option>
        </select>
    </div>
`;

class ResolutionSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._adaptor = null;
        this._streamId = null;
        this._availableResolutions = [];
    }

    connectedCallback() {
        this.selectElement = this.shadowRoot.getElementById('resolution-select');
        this._setupEventListeners();
    }

    setup(adaptor, streamId = null) {
        this._adaptor = adaptor;
        this._streamId = streamId;
        
        this._adaptor.addEventListener((info, obj) => this._handleAdaptorEvent(info, obj));
    }

    setStreamId(streamId) {
        this._streamId = streamId;
    }

    getSelectedResolution() {
        return parseInt(this.selectElement.value);
    }

    _setupEventListeners() {
        this.selectElement.addEventListener('change', () => {
            this._onResolutionSelect();
        });
    }

    _handleAdaptorEvent(info, obj) {
        if (info === 'streamInformation') {
            this._updateAvailableResolutions(obj.streamInfo);
        } else if (info === 'play_finished' || info === 'publish_finished') {
            this._clearResolutions();
        } else if (info === 'play_started') {
            this._adaptor.getStreamInfo(obj.streamId);
        }
    }

    _updateAvailableResolutions(streamInfo) {
        const resolutions = new Set();
        
        streamInfo.forEach(entry => {
            resolutions.add(entry.streamHeight);
        });
        
        this._clearResolutions();
        
        this._availableResolutions = Array.from(resolutions).sort((a, b) => a - b);
        this._availableResolutions.forEach(resolution => {
            const option = document.createElement('option');
            option.value = resolution;
            option.textContent = `${resolution}p`;
            this.selectElement.appendChild(option);
        });
    }

    _onResolutionSelect() {
        if (!this._adaptor) return;

        const resolutionValue = this.getSelectedResolution();
        const selectedText = this.selectElement.options[this.selectElement.selectedIndex].text;
        
        const targetStreamId = this.getActiveStreamId();
        if (!targetStreamId) return;

        console.log(`Setting resolution to ${resolutionValue} for stream ${targetStreamId}`);
        this._adaptor.forceStreamQuality(targetStreamId, resolutionValue);
        
        this.dispatchEvent(new CustomEvent('resolution-changed', {
            detail: { 
                resolution: resolutionValue,
                text: selectedText,
                streamId: targetStreamId
            }
        }));
    }

    _clearResolutions() {
        while (this.selectElement.options.length > 1) {
            this.selectElement.remove(1);
        }
        this.selectElement.value = "0";
        this._availableResolutions = [];
    }

    getActiveStreamId() {
        if (this._streamId) {
            return this._streamId;
        }

        if (!this._adaptor) return null;
        
        // Use the first active stream from adaptor
        if (this._adaptor.playStreamId && this._adaptor.playStreamId.length > 0) {
            return this._adaptor.playStreamId[0];
        }

        return null;
    }
}

window.customElements.define('resolution-selector', ResolutionSelector); 