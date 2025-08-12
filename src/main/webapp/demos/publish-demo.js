import {WebRTCAdaptor} from '../js/ant-sdk/webrtc_adaptor.js';
import '../components/video-view.js';
import '../components/stream-controls.js';
import '../components/toggle-camera.js';
import '../components/toggle-microphone.js';
import {PublishDemoModal} from './publish-demo-modal.js';

document.addEventListener('DOMContentLoaded', async () => {
    const videoPreview = document.getElementById('video-preview');
    const streamControls = document.getElementById('stream-controls');
    const toggleCamera = document.getElementById('toggle-camera');
    const toggleMicrophone = document.getElementById('toggle-microphone');

    var mediaConstraints = {
        audio: {
            noiseSuppression: true,
            echoCancellation: true
        },
        video: true
    };

    const webRTCAdaptor = new WebRTCAdaptor({
        websocket_url: "ws://localhost:5080/WebRTCAppEE/websocket",
        localVideoElement: document.createElement('video'), 
        dataChannelEnabled: true,
        mediaConstraints: mediaConstraints,
    });

    // Setup initial components
    videoPreview.setup(webRTCAdaptor);
    streamControls.setup(webRTCAdaptor);
    toggleCamera.setup(webRTCAdaptor);
    toggleMicrophone.setup(webRTCAdaptor);

    const watchStreamButton = document.getElementById('watch-stream-button');
    watchStreamButton.disabled = true;

    // Disable settings and watch button initially
    const settingsButton = document.getElementById('settings-button');
    settingsButton.disabled = true;

    // Watch stream button functionality
    watchStreamButton.addEventListener('click', () => {
        const playUrl = `http://localhost:5080/WebRTCAppEE/play.html?id=${streamControls.getStreamId()}&autoplay=true&mute=true`;
        window.open(playUrl, '_blank');
    });

    // Initialize settings modal
    const modal = new PublishDemoModal();
    await modal.loadModal();

    webRTCAdaptor.addEventListener((info) => {
        if (info === 'initialized') {
            // Setup modal components after WebRTC is initialized
            modal.setupComponents(webRTCAdaptor);
            modal.setupEventListeners(webRTCAdaptor, videoPreview);
            settingsButton.disabled = false;
        } else if (info === 'publish_started') {
            const labelElement = videoPreview.shadowRoot.querySelector('#label');
            labelElement.textContent = 'Live';
            labelElement.style.display = 'block';
            watchStreamButton.disabled = false;
        } else if (info === 'publish_finished') {
            const labelElement = videoPreview.shadowRoot.querySelector('#label');
            labelElement.textContent = 'Preview';
            labelElement.style.display = 'block';
            watchStreamButton.disabled = true;
        }
    });

    // Stream control events
    streamControls.addEventListener('start-stream', (e) => {
        webRTCAdaptor.publish(e.detail.streamId);
    });
    
    streamControls.addEventListener('stop-stream', (e) => {
        webRTCAdaptor.stop(e.detail.streamId);
    });

    webRTCAdaptor.addErrorEventListener((error, message) => {
        console.error('WebRTC Error:', error, message);
        alert(`Connection Error: ${message || error}`);
        watchStreamButton.disabled = true;
    });
}); 