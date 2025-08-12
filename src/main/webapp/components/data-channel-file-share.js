/**
 * File sharing component over WebRTC data channels.
 * Supports uploading files and displaying received files with image preview.
 * 
 * It works by glueing filename first in the start of data array, then file data, then send's it over WebRTC data channel
 * 
 * TODO: Make component configurable to be only publish or display or both(default current)
 * 
 * @event file-received - Fired when a file is received. Detail contains filename and file data.
 * @event error - Fired on errors. Detail contains the error object.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('data-channel-file-share');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const iconsPath = ComponentCommon.getIconsBootstrapPath();
const commonStylePath = ComponentCommon.getCommonCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="card">
        <div class="card-header collapsible-header" data-toggle="collapse" data-target="#collapse-body" aria-expanded="true">
            <span>File Share</span>
            <span id="status-badge" class="badge stream-status-offline ml-2">Stream Offline</span>
        </div>
        <div id="collapse-body" class="collapse show">
            <div class="card-body">
                <div id="offline-message" class="text-center text-muted p-4">
                    <p><strong>Stream is offline</strong></p>
                    <p>Please start streaming to enable file sharing</p>
                </div>
                <div id="file-content" style="display: none;">
                    <div class="upload-section mb-3">
                        <input type="file" id="file-input" style="display: none;">
                        <button id="upload-button" class="btn btn-primary">
                            <img src="${iconsPath}upload.svg" alt="Upload" style="width: 16px; height: 16px; margin-right: 5px;">
                            Choose File
                        </button>
                        <small class="text-muted ml-2">Select a file to share</small>
                    </div>
                    <div id="file-list" class="file-list"></div>
                    <div id="empty-message" class="text-center text-muted p-3" style="display: none;">
                        <p>No files received yet</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

class DataChannelFileShare extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        this._adaptor = null;
        this._streamId = null;
        this._autoSetStreamId = false;
        this._allFiles = [];
    }

    connectedCallback() {
        this.shadowRoot.getElementById('upload-button').onclick = () => {
            this.shadowRoot.getElementById('file-input').click();
        };
        
        this.shadowRoot.getElementById('file-input').onchange = (e) => {
            if (e.target.files[0]) {
                this._sendFile(e.target.files[0]);
                e.target.value = '';
            }
        };
        
        this.shadowRoot.getElementById('file-list').onclick = (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            
            const file = this._allFiles.find(f => f.id === fileItem.dataset.fileId);
            if (!file) return;

            if (e.target.closest('.download-button')) {
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (file.isImage) {
                window.open(file.url, '_blank');
            }
        };
    }

    setup(adaptor, streamId = null) {
        this._adaptor = adaptor;
        this._streamId = streamId;

        this._adaptor.addEventListener((info, obj) => {
            if (info === "publish_started" || info === "play_started") {
                if (this._streamId == null) {
                    this._streamId = obj.streamId;
                    this._autoSetStreamId = true;
                }

                this._updateUI();
            } else if (info === "publish_finished" || info === "play_finished") {
                if (this._autoSetStreamId) {
                    this._streamId = null;
                }

                this._updateUI();
            } else if (info === "data_received") {
                if (!obj.streamId || obj.streamId != this._streamId) {
                    return;
                }

                if (obj.data instanceof ArrayBuffer) {
                    this._processReceivedFile(obj.data);
                }
            }
        });
    }

    setStreamId(streamId) {
        this._streamId = streamId;
        this._autoSetStreamId = false;
        console.log('data-channel-file-share: setStreamId', this._streamId);
    }

    async _sendFile(file) {
        if (!this._adaptor || !this._streamId) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const fileData = new Uint8Array(reader.result);
                const filename = new TextEncoder().encode(file.name);
                const filenameLength = filename.length;
                
                // Create packet: [4 bytes filenameStr length][filename][file data]
                const packet = new Uint8Array(4 + filenameLength + fileData.length);
                const lengthBytes = new Uint32Array([filenameLength]);
                
                packet.set(new Uint8Array(lengthBytes.buffer), 0);
                packet.set(filename, 4);
                packet.set(fileData, 4 + filenameLength);
                
                this._adaptor.sendData(this._streamId, packet.buffer);
                
                // store sent file to list here
                const sentFile = {
                    id: `sent_${Date.now()}_${Math.random().toString(36)}`,
                    name: file.name,
                    size: file.size,
                    timestamp: Date.now(),
                    url: URL.createObjectURL(file),
                    isImage: ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif'].includes(
                        file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    ),
                    isSent: true
                };
                this._allFiles.unshift(sentFile);
                this._updateUI();
            } catch (error) {
                this._dispatchError('Failed to send file', error);
            }
        };
        reader.onerror = () => {
            this._dispatchError('Failed to read file', reader.error);
        };
        reader.readAsArrayBuffer(file);
    }

    _processReceivedFile(arrayBuffer) {
        try {
            const data = new Uint8Array(arrayBuffer);
            
            // First, we Read filename length (first 4 bytes)
            const filenameLength = new Uint32Array(data.slice(0, 4).buffer)[0];
            
            // Then extract filename
            const filenameBytes = data.slice(4, 4 + filenameLength);
            const filename = new TextDecoder().decode(filenameBytes);
            
            // and finally, the file data 
            const fileData = data.slice(4 + filenameLength);
            
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif'];
            const imageMimeTypes = ['image/jpeg', 'image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/gif'];
            const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
            const extIndex = imageExtensions.indexOf(ext);
            const isImage = extIndex !== -1;
            const mimeType = isImage ? imageMimeTypes[extIndex] : 'application/octet-stream';
            
            const file = {
                id: `received_${Date.now()}_${Math.random().toString(36)}`,
                name: filename,
                size: fileData.length,
                timestamp: Date.now(),
                url: URL.createObjectURL(new Blob([fileData], { type: mimeType })),
                isImage: isImage,
                isSent: false
            };

            this._allFiles.unshift(file);
            this._updateUI();
            
            this.dispatchEvent(new CustomEvent('file-received', {
                detail: { 
                    filename: filename,
                    file: file,
                    size: fileData.length
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            this._dispatchError('Failed to process received file', error);
        }
    }

    _updateUI() {
        const hasStream = !!this._streamId;
        
        this.shadowRoot.getElementById('status-badge').style.display = hasStream ? 'none' : 'inline';
        this.shadowRoot.getElementById('offline-message').style.display = hasStream ? 'none' : 'block';
        this.shadowRoot.getElementById('file-content').style.display = hasStream ? 'block' : 'none';
        this.shadowRoot.getElementById('upload-button').disabled = !hasStream;
        
        const listElement = this.shadowRoot.getElementById('file-list');
        const emptyMessage = this.shadowRoot.getElementById('empty-message');
        
        if (this._allFiles.length === 0) {
            listElement.innerHTML = '';
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';
        listElement.innerHTML = this._allFiles.map(file => `
            <div class="file-item ${file.isSent ? 'sent-file' : ''}" data-file-id="${file.id}">
                <div class="file-preview">
                    ${file.isImage ? 
                        `<img src="${file.url}" alt="${file.name}" class="file-image">` :
                        `<div class="file-icon"><img src="${iconsPath}file-earmark.svg" alt="File"></div>`
                    }
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">
                        ${file.isSent ? '↗ ' : '↙ '}${file.name}
                    </div>
                    <div class="file-meta">
                        <span>${new Date(file.timestamp).toLocaleString()}</span>
                        <span>${ComponentCommon.formatFileSize(file.size)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="download-button btn btn-sm btn-outline-primary" title="Download">
                        <img src="${iconsPath}download.svg" alt="Download">
                    </button>
                </div>
            </div>
                 `).join('');
    }

    _dispatchError(message, error) {
        console.error('data-channel-file-share: ', message, error);
        this.dispatchEvent(new CustomEvent('error', {
            detail: { 
                message: message, 
                originalError: error,
                name: error?.name || 'UnknownError'
            },
            bubbles: true,
            composed: true
        }));
    }
}

window.customElements.define('data-channel-file-share', DataChannelFileShare); 