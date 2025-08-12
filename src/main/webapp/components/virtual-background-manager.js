/**
 * Manages virtual background effects for WebRTC video streams.
 * Provides UI for selecting and applying different background effects
 */

import { ComponentCommon } from './component-common.js';
import { VideoEffect } from '../js/ant-sdk/video-effect.js';

const stylePath = ComponentCommon.getComponentCssConfig('virtual-background-manager');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Virtual Background</h5>
            <div id="background-options" class="background-options-container">
                <div class="background-option" data-effect="none">
                    <img src="../img/components/noeffect-background.png">
                    <span>None</span>
                </div>
                <div class="background-option" data-effect="slight-blur">
                   <img src="../img/components/slight-blur-background.png">
                   <span>Slight Blur</span>
               </div>
                <div class="background-option" data-effect="blur">
                    <img src="../img/components/blur-background.png">
                    <span>Blur</span>
                </div>
                <div id="custom-background-container" class="background-option">
                    <label for="custom-background-input">
                        <img src="../img/components/image-upload.png">
                        <span>Custom</span>
                    </label>
                    <input type="file" id="custom-background-input" accept="image/png, image/jpeg" style="display: none;">
                </div>
            </div>
        </div>
    </div>
`;

class VirtualBackgroundManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        this._webRTCAdaptor = null;
        this._updateUploadVisibility();
    }

    static get observedAttributes() { return ['disable-upload']; }

    attributeChangedCallback() { this._updateUploadVisibility(); }

    _updateUploadVisibility() {
        const container = this.shadowRoot.getElementById('custom-background-container');
        if (container) container.style.display = this.hasAttribute('disable-upload') ? 'none' : '';
    }

    connectedCallback() {
        this.shadowRoot.getElementById('background-options').addEventListener('click', (e) => this._handleBackgroundSelection(e));
        this.shadowRoot.getElementById('custom-background-input').addEventListener('change', (e) => this._handleCustomBackgroundUpload(e));
    }

    setup(webRTCAdaptor) {
        if (!webRTCAdaptor) return console.error("VirtualBackgroundManager: WebRTCAdaptor instance is required.");
        
        this._webRTCAdaptor = webRTCAdaptor;
        VideoEffect.LOCATE_FILE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation";
        this.shadowRoot.querySelector('[data-effect="none"]').classList.add('selected');
    }

    addBackgroundImage(name, imageUrl) {
        const container = this.shadowRoot.getElementById('custom-background-container');
        const option = document.createElement('div');
        option.className = 'background-option';
        option.dataset.effect = 'background';
        option.dataset.imgSrc = imageUrl;
        option.innerHTML = `<img src="${imageUrl}" alt="${name}"><span>${name}</span>`;
        
        this.shadowRoot.getElementById('background-options').insertBefore(option, container);
    }

    _handleBackgroundSelection(event) {
        const target = event.target.closest('.background-option');
        if (!target || target.id === 'custom-background-container') return;

        this._updateSelectedElementVisual(target);
        
        const effects = {
            'none': () => VideoEffect.NO_EFFECT,
            'blur': () => { this._webRTCAdaptor.setBlurEffectRange(6, 8); return VideoEffect.BLUR_BACKGROUND; },
            'slight-blur': () => { this._webRTCAdaptor.setBlurEffectRange(3, 4); return VideoEffect.BLUR_BACKGROUND; },
            'background': () => { 
                const img = new Image();
                img.src = target.dataset.imgSrc;
                this._webRTCAdaptor.setBackgroundImage(img);
                return VideoEffect.VIRTUAL_BACKGROUND;
            }
        };
        
        const effectName = effects[target.dataset.effect]?.();
        if (effectName) {
            this._webRTCAdaptor.enableEffect(effectName).catch(err => this._handleError(effectName, err));
        }
    }

    _handleCustomBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                this._updateSelectedElementVisual(this.shadowRoot.getElementById('custom-background-container'));
                this._webRTCAdaptor.setBackgroundImage(img);
                this._webRTCAdaptor.enableEffect(VideoEffect.VIRTUAL_BACKGROUND).catch(err => this._handleError('custom background', err));
            };
        };
        reader.readAsDataURL(file);
    }
    
    _updateSelectedElementVisual(selectedElement) {
        this.shadowRoot.querySelectorAll('.background-option').forEach(opt => opt.classList.remove('selected'));
        selectedElement.classList.add('selected');
    }

    _handleError(effectName, err) {
        console.error("Effect not enabled: " + err);
        this.dispatchEvent(new CustomEvent('error', { 
            detail: { message: `Failed to apply ${effectName}: ${err.name}` }, 
            bubbles: true, 
            composed: true 
        }));
    }
}

window.customElements.define('virtual-background-manager', VirtualBackgroundManager); 