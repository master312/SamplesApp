/**
 * Displays paged grid of VOD files with optional delete functionality.
 * 
 * @event vod-selected - Fired when a VOD is selected. Detail contains the VOD object.
 * @event vod-deleted - Fired when a VOD is successfully deleted. Detail contains the deleted VOD object.
 * @event error - Fired on network or server errors. Detail contains the error object.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('vod-browser');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const iconsPath = ComponentCommon.getIconsBootstrapPath();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="vod-browser-container">
        <div class="filter-controls">
            <input type="search" id="search-input" class="form-control form-control-sm" placeholder="Search by ID or Name...">
            <div class="right-controls">
                <button id="refresh-button" class="btn btn-sm btn-primary ml-2">Refresh</button>
            </div>
        </div>
        <div id="vod-list" class="vod-list-grid"></div>
        <div id="loading-indicator" class="loading-indicator" style="display: none;">
            <div class="spinner"></div>
            <span>Loading...</span>
        </div>
        <div class="pagination-controls">
            <button id="prev-button" class="btn btn-secondary">Previous</button>
            <span id="page-indicator">Page 0 of 0</span>
            <button id="next-button" class="btn btn-secondary">Next</button>
        </div>
    </div>
`;

class VodBrowser extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        
        this._currentPage = 0;
        this._allVods = [];
        this._currentSearchTerm = '';
        this._backendUrl = '';
    }

    static get observedAttributes() {
        return ['backend-url', 'page-size', 'disable-delete'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'backend-url') {
            this._backendUrl = newValue ? newValue.replace(/\/$/, '') : '';
        }

        if (oldValue !== newValue) {
            this.refresh();
        }
    }

    setBackendUrl(url) {
        this.setAttribute('backend-url', url);
    }

    connectedCallback() {
        this.shadowRoot.getElementById('prev-button').addEventListener('click', () => this._changePage(-1));
        this.shadowRoot.getElementById('next-button').addEventListener('click', () => this._changePage(1));
        this.shadowRoot.getElementById('vod-list').addEventListener('click', (e) => this._handleVodClick(e));
        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => this.refresh());
        this.shadowRoot.getElementById('search-input').addEventListener('input', (e) => this._handleSearchChange(e));

        this.refresh();
    }
    
    _handleVodClick(event) {
        const deleteButton = event.target.closest('.delete-button');
        if (deleteButton) {
            event.stopPropagation(); // Prevent VOD selection when clicking delete
            const vodItem = deleteButton.closest('.vod-item');
            if (vodItem && vodItem.dataset.vod) {
                try {
                    this._handleDeleteVod(JSON.parse(vodItem.dataset.vod));
                } catch (error) {
                    this._dispatchErrorEvent(new Error('Failed to parse VOD data for deletion.'));
                }
            }
            return;
        }

        const vodItem = event.target.closest('.vod-item');
        if (vodItem && vodItem.dataset.vod) {
            console.log('vodItem', vodItem.dataset.vod);
            try {
                this.dispatchEvent(new CustomEvent('vod-selected', {
                    detail: { vod: JSON.parse(vodItem.dataset.vod) },
                    bubbles: true,
                    composed: true
                }));
            } catch (error) {
                this._dispatchErrorEvent(new Error('Failed to parse VOD data for selection.'));
            }
        }
    }

    _handleSearchChange(event) {
        this._currentSearchTerm = event.target.value.toLowerCase();
        this._currentPage = 0;
        this._renderVods();
        this._updatePagination();
    }

    async _handleDeleteVod(vod) {
        if (!confirm(`Are you sure you want to delete "${vod.vodName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this._backendUrl}/rest/v2/vods/${vod.vodId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.dispatchEvent(new CustomEvent('vod-deleted', {
                    detail: { vod },
                    bubbles: true,
                    composed: true
                }));
    
                this.refresh();
            } else {
                throw new Error(`Server responded with status ${response.status}`);
            }

        } catch (error) {
            console.error('Failed to delete VOD:', error);
            this._dispatchErrorEvent(error);
        }
    }

    _changePage(direction) {
        const newPage = this._currentPage + direction;
        const filteredVods = this._getFilteredVods();
        const totalPages = Math.ceil(filteredVods.length / this.pageSize);

        if (newPage >= 0 && newPage < totalPages) {
            this._currentPage = newPage;
            this._renderVods();
            this._updatePagination();
        }
    }

    get pageSize() {
        return parseInt(this.getAttribute('page-size'), 10) || 10;
    }

    refresh() {
        if (!this._backendUrl) {
            return;
        }
        this._currentPage = 0;
        this._fetchVods();
    }

    _getFilteredVods() {
        if (!this._currentSearchTerm) {
            return this._allVods;
        }

        return this._allVods.filter(vod =>
            (vod.vodName && vod.vodName.toLowerCase().includes(this._currentSearchTerm)) ||
            (vod.vodId && vod.vodId.toLowerCase().includes(this._currentSearchTerm))
        );
    }
    
    async _fetchVods() {
        if (!this._backendUrl) {
            this._dispatchErrorEvent(new Error("Backend URL is required attribute."));
            return;
        }

        this._showLoading(true);

        try {
            const response = await fetch(`${this._backendUrl}/rest/v2/vods/list/0/200`);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            
            const vods = await this._toJson(response);
            this._allVods = vods || [];
            this._renderVods();
        } catch (error) {
            this._dispatchErrorEvent(error);
        } finally {
            this._showLoading(false);
            this._updatePagination();
        }
    }

    _renderVods() {
        const listElement = this.shadowRoot.getElementById('vod-list');
        listElement.innerHTML = '';
        
        const filteredVods = this._getFilteredVods();

        if (!filteredVods || filteredVods.length === 0) {
            listElement.innerHTML = '<div class="no-vods-message">No VODs found.</div>';
            return;
        }
        
        const startIndex = this._currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const vodsToRender = filteredVods.slice(startIndex, endIndex);

        const deleteEnabled = !this.hasAttribute('disable-delete');

        vodsToRender.forEach(vod => {
            const item = document.createElement('div');
            item.className = 'vod-item';
            item.dataset.vod = JSON.stringify(vod);

            const thumbnailUrl = vod.previewFilePath 
                ? `${this._backendUrl}/${vod.previewFilePath}` 
                : '../img/components/video-placeholder.png';
            
            item.innerHTML = `
                <div class="vod-thumbnail">
                    <img src="${thumbnailUrl}" alt="${vod.vodName}" onerror="this.onerror=null;this.src='../img/components/video-placeholder.png';">
                </div>
                <div class="vod-info">
                    <div class="vod-name" title="${vod.vodName}">${vod.vodName}</div>
                    <div class="vod-meta">
                        <span>${new Date(vod.creationDate).toLocaleDateString()}</span>
                        <span>${ComponentCommon.formatDuration(vod.duration)}</span>
                    </div>
                </div>
                ${deleteEnabled ? `
                <button class="delete-button btn btn-danger" title="Delete VOD">
                    <img src="${iconsPath}trash.svg" alt="Delete">
                </button>
                ` : ''}
            `;
            listElement.appendChild(item);
        });
    }

    _updatePagination() {
        const pageIndicator = this.shadowRoot.getElementById('page-indicator');
        const prevButton = this.shadowRoot.getElementById('prev-button');
        const nextButton = this.shadowRoot.getElementById('next-button');
        
        const filteredVods = this._getFilteredVods();
        const totalPages = Math.ceil(filteredVods.length / this.pageSize);

        pageIndicator.textContent = `Page ${this._currentPage + 1} of ${totalPages || 1}`;
        prevButton.disabled = this._currentPage === 0;
        nextButton.disabled = this._currentPage >= totalPages - 1;
    }
    
    async _toJson(response) {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    }

    _showLoading(isLoading) {
        this.shadowRoot.getElementById('loading-indicator').style.display = isLoading ? 'flex' : 'none';
    }

    _dispatchErrorEvent(error) {
        console.error(error);
        this.dispatchEvent(new CustomEvent('error', {
            detail: { message: error.message, name: error.name, error: error },
            bubbles: true,
            composed: true
        }));
    }
}

window.customElements.define('vod-browser', VodBrowser); 