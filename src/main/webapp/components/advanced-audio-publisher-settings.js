/**
 * AdvancedAudioPublisherSettings is a Web Component that provides a collapsible panel
 * with advanced controls for audio publishing, such as audio processing and microphone gain.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('advanced-audio-publisher-settings');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const templateHtml = document.createElement('template');
templateHtml.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">

    <div class="card">
        <div class="card-header collapsible-header" id="header" data-toggle="collapse" data-target="#collapse-body-audio" aria-expanded="false" aria-controls="collapse-body-audio">
            <span>Advanced Audio Options</span>
        </div>
        <div id="collapse-body-audio" class="collapse">
            <div class="card-body">
                <!-- Audio Processing -->
                <div class="form-group">
                    <label>Audio Processing</label>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="noise-suppression" checked>
                        <label class="form-check-label" for="noise-suppression">Noise Suppression</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="echo-cancellation" checked>
                        <label class="form-check-label" for="echo-cancellation">Echo Cancellation</label>
                    </div>
                </div>

                <!-- Microphone Gain -->
                <div class="form-group">
                    <label for="mic-gain">Microphone Gain</label>
                    <div class="gain-container">
                        <input type="range" class="custom-range" id="mic-gain" min="0" max="1" step="0.01" value="1">
                        <span class="gain-value" id="gain-value">100%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

class AdvancedAudioPublisherSettings extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(templateHtml.content.cloneNode(true));
        this._adaptor = null;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('noise-suppression').addEventListener('change', (e) => this._applyAudioProcessingSettings());
        this.shadowRoot.getElementById('echo-cancellation').addEventListener('change', (e) => this._applyAudioProcessingSettings());
        
        const gainSlider = this.shadowRoot.getElementById('mic-gain');
        const gainValue = this.shadowRoot.getElementById('gain-value');
        
        gainSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            gainValue.textContent = `${Math.round(value * 100)}%`;
            this._setMicrophoneGain(value);
        });
        
        this._initializeBootstrapCollapse();
    }

    _initializeBootstrapCollapse() {
        if (typeof $ === 'function' && $.fn.collapse) {
            const collapseElement = this.shadowRoot.getElementById('collapse-body-audio');
            const header = this.shadowRoot.getElementById('header');

            $(collapseElement).on('show.bs.collapse', () => {
                header.setAttribute('aria-expanded', 'true');
            }).on('hide.bs.collapse', () => {
                header.setAttribute('aria-expanded', 'false');
            });

            header.addEventListener('click', () => {
                $(collapseElement).collapse('toggle');
            });
        } else {
            console.warn('Bootstrap JS with Collapse plugin is not loaded. The panel will not be collapsible.');
        }
    }

    setup(adaptor) {
        this._adaptor = adaptor;

        this._adaptor.addEventListener((info, obj) => {
            if (info === "publish_started") {
                setTimeout(() => {
                    this._applyCurrentSettings();
                }, 1500);
            }
        });
    }

    _applyCurrentSettings() {
        this._applyAudioProcessingSettings();
    }

    _applyAudioProcessingSettings() {
        const noiseSuppression = this.shadowRoot.getElementById('noise-suppression').checked;
        const echoCancellation = this.shadowRoot.getElementById('echo-cancellation').checked;

        const constraints = {
            audio: {
                noiseSuppression: noiseSuppression,
                echoCancellation: echoCancellation
            }
        };

        this._adaptor.applyConstraints(constraints)
            .catch(error => {
                console.error('Error applying audio constraints:', error);
            });
    }

    _setMicrophoneGain(value) {
        if (!this._adaptor) return;
        this._adaptor.setVolumeLevel(value);
    }
}

window.customElements.define('advanced-audio-publisher-settings', AdvancedAudioPublisherSettings); 