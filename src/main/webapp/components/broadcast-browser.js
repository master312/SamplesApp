/**
 * Displays a paged grid of broadcasts with filtering options.
 *
 * @event broadcast-selected - Fired when a broadcast is selected. Detail contains the broadcast object.
 * @event error - fired on error
 */
import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('broadcast-browser');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="broadcast-browser-container">
        <div class="filter-controls">
            <input type="search" id="search-input" class="form-control form-control-sm" placeholder="Search by ID or Name...">
            <div class="right-controls">
                <label for="status-filter">Status:</label>
                <select id="status-filter" class="form-control form-control-sm" style="width: auto;">
                    <option value="all">All</option>
                    <option value="broadcasting">Live</option>
                    <option value="finished">Finished</option>
                </select>
                <button id="refresh-button" class="btn btn-sm btn-primary ml-2">Refresh</button>
            </div>
        </div>
        <div id="broadcast-list" class="broadcast-list-grid"></div>
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

class BroadcastBrowser extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));

        this._currentPage = 0;
        this._allBroadcasts = [];
        this._currentFilter = 'all';
        this._currentSearchTerm = '';
        this._backendUrl = '';
    }

    static get observedAttributes() {
        return ['backend-url', 'page-size'];
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
        this.shadowRoot.getElementById('broadcast-list').addEventListener('click', (e) => this._handleBroadcastClick(e));
        this.shadowRoot.getElementById('status-filter').addEventListener('change', (e) => this._handleFilterChange(e));
        this.shadowRoot.getElementById('refresh-button').addEventListener('click', () => this.refresh());
        this.shadowRoot.getElementById('search-input').addEventListener('input', (e) => this._handleSearchChange(e));

        this.refresh();
    }

    _copyToClipboard(event, text) {
        event.stopPropagation(); 
        navigator.clipboard.writeText(text).then(() => {
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    _handleBroadcastClick(event) {
        const broadcastItem = event.target.closest('.broadcast-item');
        if (event.target.classList.contains('copy-icon')) {
            return;
        }
        if (broadcastItem && broadcastItem.dataset.broadcast) {
            try {
                this.dispatchEvent(new CustomEvent('broadcast-selected', {
                    detail: { broadcast: JSON.parse(broadcastItem.dataset.broadcast) },
                    bubbles: true,
                    composed: true
                }));
            } catch (error) {
                this._dispatchErrorEvent(new Error('Failed to parse broadcast data for selection.'));
            }
        }
    }

    _handleFilterChange(event) {
        this._currentFilter = event.target.value;
        this._currentPage = 0;
        this._renderBroadcasts();
        this._updatePagination();
    }

    _handleSearchChange(event) {
        this._currentSearchTerm = event.target.value.toLowerCase();
        this._currentPage = 0;
        this._renderBroadcasts();
        this._updatePagination();
    }

    _changePage(direction) {
        const newPage = this._currentPage + direction;
        const filteredBroadcasts = this._getFilteredBroadcasts();
        const totalPages = Math.ceil(filteredBroadcasts.length / this.pageSize);

        if (newPage >= 0 && newPage < totalPages) {
            this._currentPage = newPage;
            this._renderBroadcasts();
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
        this._fetchBroadcasts();
    }

    async _fetchBroadcasts() {
        this._showLoading(true);

        try {
            const response = await fetch(`${this._backendUrl}/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc`);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

            const broadcasts = await this._toJson(response);
            this._allBroadcasts = broadcasts || [];
            this._renderBroadcasts();
        } catch (error) {
            this._dispatchErrorEvent(error);
        } finally {
            this._showLoading(false);
            this._updatePagination();
        }
    }
    
    _getFilteredBroadcasts() {
        if (this._currentFilter === 'all' && !this._currentSearchTerm) {
            return this._allBroadcasts;
        }

        let broadcasts = this._allBroadcasts;

        if (this._currentFilter !== 'all') {
            broadcasts = broadcasts.filter(b => b.status === this._currentFilter);
        }

        if (this._currentSearchTerm) {
            broadcasts = broadcasts.filter(b =>
                (b.name && b.name.toLowerCase().includes(this._currentSearchTerm)) ||
                (b.streamId && b.streamId.toLowerCase().includes(this._currentSearchTerm))
            );
        }
        return broadcasts;
    }


    _renderBroadcasts() {
        const listElement = this.shadowRoot.getElementById('broadcast-list');
        listElement.innerHTML = '';
        
        const filteredBroadcasts = this._getFilteredBroadcasts();

        if (!filteredBroadcasts || filteredBroadcasts.length === 0) {
            listElement.innerHTML = '<div class="no-broadcasts-message">No broadcasts found.</div>';
            return;
        }
        
        const startIndex = this._currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const broadcastsToRender = filteredBroadcasts.slice(startIndex, endIndex);

        console.log('Got broadcasts:', broadcastsToRender);
        broadcastsToRender.forEach(broadcast => {
            const item = document.createElement('div');
            item.className = 'broadcast-item';
            item.dataset.broadcast = JSON.stringify(broadcast);

            const thumbnailUrl = `${this._backendUrl}/previews/${broadcast.streamId}.png`;
            const copyIconUrl = ComponentCommon.getIconsBootstrapPath() + 'copy.svg';
            
            const statusClass = broadcast.status === 'broadcasting' 
                ? 'broadcast-status-live' 
                : (broadcast.status === 'finished' ? 'broadcast-status-finished' : 'broadcast-status-other');

            const broadcastName = broadcast.name || '[ ]';

            item.innerHTML = `
                <div class="broadcast-thumbnail">
                    <img src="${thumbnailUrl}" alt="${broadcast.name}" onerror="this.onerror=null;this.src='../img/components/video-placeholder.png';">
                    <span class="broadcast-status ${statusClass}">${broadcast.status}</span>
                </div>
                <div class="broadcast-info">
                    <div class="broadcast-name" title="${broadcastName}">
                        <img src="${copyIconUrl}" class="copy-icon" data-copy-text="${broadcastName}">
                        <span>${broadcastName}</span>
                    </div>
                    <div class="broadcast-id" title="${broadcast.streamId}">
                        <img src="${copyIconUrl}" class="copy-icon" data-copy-text="${broadcast.streamId}">
                        <span>${broadcast.streamId}</span>
                    </div>
                    <div class="broadcast-meta">
                        <span>${new Date(broadcast.date).toLocaleDateString()}</span>
                        <span>${ComponentCommon.formatDuration(broadcast.duration)}</span>
                    </div>
                </div>
            `;
            const copyIcons = item.querySelectorAll('.copy-icon');
            copyIcons.forEach(icon => {
                icon.addEventListener('click', (event) => this._copyToClipboard(event, icon.dataset.copyText));
            });
            listElement.appendChild(item);
        });
    }

    _updatePagination() {
        const pageIndicator = this.shadowRoot.getElementById('page-indicator');
        const prevButton = this.shadowRoot.getElementById('prev-button');
        const nextButton = this.shadowRoot.getElementById('next-button');
        
        const filteredBroadcasts = this._getFilteredBroadcasts();
        const totalPages = Math.ceil(filteredBroadcasts.length / this.pageSize);

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

window.customElements.define('broadcast-browser', BroadcastBrowser); 