/**
 * Mock WebRTC adaptor for component testing
 */
class MockWebRTCAdaptor {
    constructor() {
        this.mediaManager = new MockMediaManager();
        this.callbacks = {};
        this.errorCallbacks = [];
        this.localStream = null;
        this.remoteStreams = new Map();
        this.isPublishing = false;
        this.isPlaying = false;
        this.reconnectIfRequiredFlag = false;
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
        this.mediaManager.isMuted = true;
        this.triggerCallback('mic_muted');
    }
    
    unmuteLocalMic() {
        this.mediaManager.isMuted = false;
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
    
    triggerCallback(eventType, data = {}) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType](data);
        }
    }
    
    setCallback(eventType, callback) {
        this.callbacks[eventType] = callback;
    }
    
    addEventListener(callback) {
        this.eventCallback = callback;
    }
    
    addErrorEventListener(callback) {
        this.errorCallbacks.push(callback);
    }
    
    triggerEvent(eventType, data = {}) {
        if (this.eventCallback) {
            this.eventCallback(eventType, data);
        }
    }
    
    triggerError(error, message) {
        this.errorCallbacks.forEach(callback => callback(error, message));
    }
    
    sendData(streamId, data) {
        // Simulate sending data over data channel
        this.triggerEvent('data_sent', { streamId, data });
        return true;
    }
    
    simulateDataReceived(streamId, data) {
        // Helper method to simulate receiving data
        this.triggerEvent('data_received', { streamId, data });
    }
}

class MockMediaManager {
    constructor() {
        this.cameraEnabled = true;
        this.isMuted = false;
    }
    
    changeLocalVideo(videoElement) {
        if (videoElement) {
            // Mock the behavior without actually setting srcObject
            // since browsers reject non-MediaStream objects
            videoElement._mockStreamAssigned = true;
            videoElement._mockStreamId = 'mock-local-stream-' + Math.random();
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