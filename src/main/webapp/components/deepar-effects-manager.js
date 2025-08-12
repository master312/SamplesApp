
/**
 * DeeparEffectsManager is a component for selecting DeepAR effects.
 *
 * IMPORTANT: This component needs DeepAR library to work..
 * You must include the following script tag in your HTML file:
 * <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/deepar@4.0.3/js/deepar.js"></script>
 *
 * It also requires an API key, which should be provided via the `api-key` attribute.
 */
import { ComponentCommon } from './component-common.js';
import { VideoEffect } from '../js/ant-sdk/video-effect.js';

const stylePath = ComponentCommon.getComponentCssConfig('deepar-effects-manager');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="input-group">
        <div class="input-group-prepend">
            <span class="input-group-text">DeepAR Effect</span>
        </div>
        <select id="effect_selector" class="custom-select">
        </select>
        <div class="input-group-append">
            <button id="set_apikey_button" class="btn btn-outline-secondary" type="button">Set API Key</button>
        </div>
    </div>
`;

class DeeparEffectsManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._adaptor = null;
        this.apiKey = this.getAttribute('api-key');
        this.hideButton = this.hasAttribute('hide-apikey-button');
    }

    connectedCallback() {
        this.effectSelector = this.shadowRoot.getElementById('effect_selector');
        this.apiKeyButton = this.shadowRoot.getElementById('set_apikey_button');
        
        this.effectSelector.addEventListener('change', this._onEffectChange.bind(this));
        this.apiKeyButton.addEventListener('click', this._onSetApikeyClick.bind(this));
        
        if (this.hideButton) {
            this.apiKeyButton.style.display = 'none';
        }
    }

    _onSetApikeyClick() {
        const newKey = prompt('Enter your DeepAR API Key:', this.getApiKey() || '');
        if (newKey !== null) {
            this.setApiKey(newKey);
        }
    }

    setApiKey(key) {
        if (key === this.apiKey) {
            return;
        }
        
        this.stop();
        this.apiKey = key;
    }

    getApiKey() {
        return this.apiKey;
    }

    setup(adaptor, effectsList = ['flower_face', 'Ping_Pong']) {
        this._adaptor = adaptor;
        this._populateEffects([VideoEffect.NO_EFFECT].concat(effectsList));
    }

    stop() {
        this._adaptor.enableEffect(VideoEffect.NO_EFFECT);
        this.effectSelector.value = VideoEffect.NO_EFFECT;
    }

    _populateEffects(effectsList) {
        this.effectSelector.innerHTML = '';
        
        effectsList.forEach(effect => {
            const option = document.createElement('option');
            option.value = effect;
            option.textContent = effect.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            this.effectSelector.appendChild(option);
        });
    }

    _onEffectChange() {
        if (!this._adaptor) {
            console.warn('WebRTCAdaptor not setup in DeeparEffectsManager');
            return;
        }

        const selectedEffect = this.effectSelector.value;
        if (selectedEffect === VideoEffect.NO_EFFECT) {
            this._adaptor.enableEffect(VideoEffect.NO_EFFECT);
        } else {
            this._adaptor.enableEffect(VideoEffect.DEEPAR, this.apiKey, selectedEffect)
                .then(() => {
                    console.log(`DeepAR effect ${selectedEffect} enabled.`);
                })
                .catch(err => {
                    console.error(`Failed to enable DeepAR effect: ${err}`);
                });
        }
    }
}

window.customElements.define('deepar-effects-manager', DeeparEffectsManager); 