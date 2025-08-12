import '../components/input-video-selector.js';
import '../components/input-audio-selector.js';
import '../components/advanced-video-publisher-settings.js';
import '../components/advanced-audio-publisher-settings.js';
import '../components/stream-publish-analytics.js';
import '../components/data-channel-messaging.js';
import '../components/virtual-background-manager.js';

/**
 * Modal Manager for Publish Demo Settings
 * @property {PublishDemoModal}
 */
class PublishDemoModal {
    constructor() {
        this.components = {
            videoSelector: null,
            audioSelector: null,
            videoAdvanced: null,
            audioAdvanced: null,
            streamAnalytics: null,
            dataChannel: null,
            videoPreview: null,
            virtualBackgroundMgr: null,
        };
    }

    async loadModal() {
        try {
            const response = await fetch('./publish-demo-modal.html');
            const modalHtml = await response.text();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.initComponents();
        } catch (error) {
            console.error('Failed to load modal:', error);
        }
    }

    initComponents() {
        this.components.videoSelector = document.getElementById('modal-video-selector');
        this.components.audioSelector = document.getElementById('modal-audio-selector');
        this.components.videoAdvanced = document.getElementById('modal-video-advanced');
        this.components.audioAdvanced = document.getElementById('modal-audio-advanced');
        this.components.streamAnalytics = document.getElementById('modal-stream-analytics');
        this.components.dataChannel = document.getElementById('modal-data-channel');
        this.components.videoPreview = document.getElementById('modal-video-preview');
        this.components.virtualBackgroundMgr = document.getElementById('virtual-background-manager');
    }

    setupComponents(webRTCAdaptor) {
        Object.values(this.components).forEach(component => {
            if (component && component.setup) {
                component.setup(webRTCAdaptor);
            }
        });

        if (webRTCAdaptor.mediaManager?.localStream) {
            this.components.videoPreview.setStream(webRTCAdaptor.mediaManager.localStream);
        }
        
        this.components.virtualBackgroundMgr.addBackgroundImage('AMS', '../img/samples/virtual-background.png');
        this.components.virtualBackgroundMgr.addBackgroundImage('Cloud', '../img/samples/cloud-background.png');
    }

    setupEventListeners(webRTCAdaptor, videoView) {
        if (this.components.videoSelector) {
            this.components.videoSelector.addEventListener('input-changed-video', (e) => {
                videoView.setStream(e.detail.stream);
                this.components.videoPreview.setStream(e.detail.stream);
            });

            this.components.videoSelector.addEventListener('error', (e) => {
                console.error(e.detail.message);
                alert(`Video Error: ${e.detail.name} - ${e.detail.message}`);
            });
        }

        if (this.components.audioSelector) {
            this.components.audioSelector.addEventListener('input-changed-audio', (e) => {
                videoView.setStream(e.detail.stream);
                this.components.videoPreview.setStream(e.detail.stream);
            });

            this.components.audioSelector.addEventListener('error', (e) => {
                console.error(e.detail.message);
                alert(`Audio Error: ${e.detail.name} - ${e.detail.message}`);
            });
        }
    }
}

export { PublishDemoModal }; 