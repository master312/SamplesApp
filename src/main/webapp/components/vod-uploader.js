/**
 * A component to upload VOD files to the server.
 * It supports drag-and-drop, file validation, and progress tracking.
 *
 * @event vod-uploaded - Fired when a VOD is successfully uploaded. Detail contains the VOD object from the server.
 * @event error - Fired on errorss. Detail contains `message` and a `name` property.
 */
import { ComponentCommon } from './component-common.js';

const SUPPORTED_FORMATS = ['MP4', 'WebM', 'AVI', 'MOV', 'WMV', 'MP3'];
const ACCEPT_MIMES = 'video/mp4,video/webm,video/x-msvideo,video/quicktime,video/x-ms-wmv,audio/mpeg';
const EXTENSIONS_REGEX = /\.(mp4|webm|avi|mov|wmv|mp3)$/i;

const stylePath = ComponentCommon.getComponentCssConfig('vod-uploader');
const bootstrapPath = ComponentCommon.getBootstrapCss();

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <div class="vod-uploader-container">
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Upload VOD</h5>
                <div id="drop-zone" class="drop-zone">
                    <div class="drop-zone-content">
                        <p>Drag and drop video file here or</p>
                        <button type="button" class="btn btn-primary" id="select-file-btn">Select File</button>
                        <input type="file" id="file-input" accept="${ACCEPT_MIMES}" style="display: none;">
                        <small class="text-muted d-block mt-2">Supported formats: ${SUPPORTED_FORMATS.join(', ')}</small>
                    </div>
                </div>
                <div id="upload-section" style="display: none;">
                    <div class="mt-3">
                        <label for="vod-name-input">VOD Name:</label>
                        <input type="text" id="vod-name-input" class="form-control" placeholder="Enter VOD name">
                    </div>
                    <div class="mt-3">
                        <div class="progress" style="display: none;">
                            <div id="progress-bar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div class="mt-2">
                            <button id="upload-btn" class="btn btn-success">Upload</button>
                            <button id="cancel-btn" class="btn btn-secondary ml-2">Cancel</button>
                        </div>
                    </div>
                </div>
                <div id="status-message" class="mt-3" style="display: none;"></div>
            </div>
        </div>
    </div>
`;

class VodUploader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
        
        this._selectedFile = null;
        this._isUploading = false;
        this.xhr = null; // To hold the XMLHttpRequest object for aborting
        this._backendUrl = '';
    }

    static get observedAttributes() {
        return ['backend-url', 'max-file-size'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'backend-url') {
            this._backendUrl = newValue ? newValue.replace(/\/$/, '') : '';
        }
    }

    setBackendUrl(url) {
        this.setAttribute('backend-url', url);
    }

    connectedCallback() {
        this.dropZone = this.shadowRoot.getElementById('drop-zone');
        this.fileInput = this.shadowRoot.getElementById('file-input');
        this.selectFileBtn = this.shadowRoot.getElementById('select-file-btn');
        this.uploadBtn = this.shadowRoot.getElementById('upload-btn');
        this.cancelBtn = this.shadowRoot.getElementById('cancel-btn');
        this.vodNameInput = this.shadowRoot.getElementById('vod-name-input');
        this.uploadSection = this.shadowRoot.getElementById('upload-section');
        this.progress = this.shadowRoot.querySelector('.progress');
        this.progressBar = this.shadowRoot.getElementById('progress-bar');
        this.statusMessage = this.shadowRoot.getElementById('status-message');
        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this._handleFileSelect(e.target.files[0]));
        this.uploadBtn.addEventListener('click', () => this._handleUpload());
        this.cancelBtn.addEventListener('click', () => this._handleCancel());

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drag-over'));
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) this._handleFileSelect(file);
        });

        this.vodNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this._handleUpload();
        });
    }

    _handleFileSelect(file) {
        if (!file) return;
        if (!this._validateFile(file)) {
            this.fileInput.value = ''; // Reset file input
            return;
        }

        this._selectedFile = file;
        this.vodNameInput.value = file.name;
        this.uploadSection.style.display = 'block';
        this._showStatus(`Selected: ${file.name} (${ComponentCommon.formatFileSize(file.size)})`, 'info');
    }

    _validateFile(file) {
        const maxSize = this._parseFileSize(this.getAttribute('max-file-size') || '500MB');

        if (file.size > maxSize) {
            this._dispatchErrorEvent(`File size exceeds limit of ${this.getAttribute('max-file-size') || '500MB'}.`, 'fileSizeExceeded');
            return false;
        }

        if (!EXTENSIONS_REGEX.test(file.name)) {
            this._dispatchErrorEvent(`Unsupported file format. Please use ${SUPPORTED_FORMATS.join(', ')}.`, 'unsupportedFileType');
            return false;
        }

        return true;
    }

    async _handleUpload() {
        if (!this._selectedFile || this._isUploading) return;

        const vodName = this.vodNameInput.value.trim();
        if (!vodName) {
            this._showStatus('Please enter a VOD name.', 'error');
            return;
        }

        const serverUrl = this._backendUrl;
        if (!serverUrl) {
            this._dispatchErrorEvent('Server URL and App Name are required.', 'missingConfiguration');
            return;
        }

        this._isUploading = true;
        this._updateUploadUI(true);

        const formData = new FormData();
        formData.append('file', this._selectedFile);

        try {
            const url = `${serverUrl}/rest/v2/vods/create?name=${encodeURIComponent(vodName)}`;
            const result = await this._uploadWithProgress(url, formData);
            
            if (result.success === false) {
                throw new Error(result.message || 'Server rejected the upload');
            }
            
            this._showStatus('Upload completed successfully!', 'success');
            console.log("From upload, result ", result);
            this.dispatchEvent(new CustomEvent('vod-uploaded', { detail: { vod: result }, bubbles: true, composed: true }));
            setTimeout(() => this._resetUploader(), 2000);

        } catch (error) {
            // Don't show status here, as the error event is now dispatched
            this._dispatchErrorEvent(error.message, 'uploadFailed');
        } finally {
            this._isUploading = false;
            this._updateUploadUI(false);
            this.xhr = null;
        }
    }

    _handleCancel() {
        if (this.xhr) {
            this.xhr.abort();
        }
        this._resetUploader();
    }

    _uploadWithProgress(url, formData) {
        return new Promise((resolve, reject) => {
            this.xhr = new XMLHttpRequest();
            this.xhr.open('POST', url, true);

            this.xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    this._updateProgress(percentComplete);
                }
            });

            this.xhr.addEventListener('load', () => {
                if (this.xhr.status >= 200 && this.xhr.status < 300) {
                    try {
                        resolve(JSON.parse(this.xhr.responseText));
                    } catch (e) {
                        reject(new Error("Failed to parse server response."));
                    }
                } else {
                    let errorMessage = `HTTP ${this.xhr.status}`;
                    try {
                        const errorResponse = JSON.parse(this.xhr.responseText);
                        errorMessage = errorResponse.message || errorMessage;
                    } catch (e) {
                        // Ignore if response is not JSON
                    }
                    reject(new Error(errorMessage));
                }
            });
            this.xhr.addEventListener('error', () => reject(new Error('Network error')));
            this.xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
                this._showStatus('Upload cancelled.', 'info');
            });
            
            this.xhr.send(formData);
        });
    }

    _updateProgress(percentage) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressBar.textContent = `${Math.round(percentage)}%`;
    }

    _updateUploadUI(isUploading) {
        this.uploadBtn.disabled = isUploading;
        this.vodNameInput.disabled = isUploading;
        this.selectFileBtn.disabled = isUploading;
        this.fileInput.disabled = isUploading;
        this.dropZone.style.pointerEvents = isUploading ? 'none' : 'auto';
        this.uploadBtn.textContent = isUploading ? 'Uploading...' : 'Upload';
        this.progress.style.display = isUploading ? 'flex' : 'none';
        this.cancelBtn.style.display = isUploading ? 'inline-block' : 'none';
        this.uploadBtn.style.display = isUploading ? 'none' : 'inline-block';
    }
    
    _resetUploader() {
        this._selectedFile = null;
        this._isUploading = false;
        
        this.uploadSection.style.display = 'none';
        this.statusMessage.style.display = 'none';
        this.fileInput.value = '';
        this.vodNameInput.value = '';
        this._updateProgress(0);
        this._updateUploadUI(false);
    }
    
    _showStatus(message, type) {
        const alertType = type === 'error' ? 'danger' : type;
        this.statusMessage.className = `alert mt-3 alert-${alertType}`;
        this.statusMessage.textContent = message;
        this.statusMessage.style.display = 'block';
    }
    _dispatchErrorEvent(message, name) {
        console.error(`${name}: ${message}`);
        this.dispatchEvent(new CustomEvent('error', {
            detail: { message: message, name: name },
            bubbles: true,
            composed: true
        }));
        this._showStatus(`${name}: ${message}`, 'error');
    }

    _formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    _parseFileSize(sizeStr) {
        const units = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3 };
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
        return match ? parseFloat(match[1]) * units[match[2].toUpperCase()] : 500 * 1024**2;
    }
}

window.customElements.define('vod-uploader', VodUploader); 