/**
 * Mock WebRTC adaptor for component testing
 */
class MockWebRTCAdaptor {
    constructor() {
        this.mediaManager = new MockMediaManager();
        this.callbacks = {};
        this.localStream = null;
        this.remoteStreams = new Map();
        this.isPublishing = false;
        this.isPlaying = false;
    }
    
    turnOffLocalCamera() {
        this.localStream = null;
        this.triggerCallback('camera_turned_off');
    }
    
    turnOnLocalCamera() {
        this.localStream = new MockMediaStream();
        this.triggerCallback('camera_turned_on');
    }
    
    muteLocalMic() {
        this.triggerCallback('mic_muted');
    }
    
    unmuteLocalMic() {
        this.triggerCallback('mic_unmuted');
    }
    
    startPublishing(streamId) {
        this.isPublishing = true;
        this.triggerCallback('publish_started', { streamId });
    }
    
    stopPublishing() {
        this.isPublishing = false;
        this.triggerCallback('publish_finished');
    }
    
    play(streamId) {
        this.isPlaying = true;
        this.triggerCallback('play_started', { streamId });
    }
    
    stop(streamId) {
        this.isPlaying = false;
        this.triggerCallback('play_finished', { streamId });
    }
    
    /**
     * Simulates WebRTC adaptor event system
     */
    triggerCallback(eventType, data = {}) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType](data);
        }
    }
    
    setCallback(eventType, callback) {
        this.callbacks[eventType] = callback;
    }
}

class MockMediaManager {
    constructor() {
        this.cameraEnabled = true;
        this.isMuted = false;
    }
    
    changeLocalVideo(videoElement) {
        if (videoElement) {
            videoElement.srcObject = new MockMediaStream();
        }
    }
    
    setLocalVideoTrackEnabled(enabled) {
        return enabled;
    }
    
    setLocalAudioTrackEnabled(enabled) {
        return enabled;
    }
}

/**
 * Mock media stream for video elements
 */
class MockMediaStream {
    constructor() {
        this.id = 'mock-stream-' + Math.random();
        this.active = true;
    }
    
    getTracks() {
        return [];
    }
    
    getVideoTracks() {
        return [{ enabled: true }];
    }
    
    getAudioTracks() {
        return [{ enabled: true }];
    }
}

// Make available in both Node.js and browser contexts
if (typeof window !== 'undefined') {
    window.MockWebRTCAdaptor = MockWebRTCAdaptor;
} else if (typeof global !== 'undefined') {
    global.MockWebRTCAdaptor = MockWebRTCAdaptor;
}

module.exports = MockWebRTCAdaptor; 