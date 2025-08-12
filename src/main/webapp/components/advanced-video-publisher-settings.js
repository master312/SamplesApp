
/**
 * AdvancedVideoPublisherSettings is a Web Component that provides a collapsible panel
 * with advanced controls for video publishing, such as bitrate.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('advanced-video-publisher-settings');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const templateHtml = document.createElement('template');
templateHtml.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="card">
        <div class="card-header collapsible-header" id="header" data-toggle="collapse" data-target="#collapse-body-video" aria-expanded="false" aria-controls="collapse-body-video">
            <span>Advanced Video Options</span>
        </div>
        <div id="collapse-body-video" class="collapse">
            <div class="card-body">
                <!-- Max Video Bitrate -->
                <div class="form-group">
                    <label for="max-video-bitrate">Max Video Bitrate (Kbps)</label>
                    <div class="input-group">
                        <input type="number" class="form-control" id="max-video-bitrate" placeholder="1200" value="1200">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="button" id="apply-bitrate">Apply</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

class AdvancedVideoPublisherSettings extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(templateHtml.content.cloneNode(true));
        this._adaptor = null;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('apply-bitrate').addEventListener('click', () => this._applyBitrate());
        this._initializeBootstrapCollapse();
    }

    _initializeBootstrapCollapse() {
        if (typeof $ === 'function' && $.fn.collapse) {
            const collapseElement = this.shadowRoot.getElementById('collapse-body-video');
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
                    this._applyCurrentSettings(obj.streamId);
                }, 1500);
            }
        });
    }

    _applyCurrentSettings(streamId) {
        const bitrate = this.shadowRoot.getElementById('max-video-bitrate').value;
        this._adaptor.changeBandwidth(bitrate, streamId);
    }

    _applyBitrate() {
        const streamId = this._adaptor.publishStreamId;
        if (streamId) {
            this._applyCurrentSettings(streamId);
        }
    }
}

window.customElements.define('advanced-video-publisher-settings', AdvancedVideoPublisherSettings); 