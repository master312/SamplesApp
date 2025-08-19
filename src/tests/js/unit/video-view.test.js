const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('VideoView', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and handle attributes correctly', async function() {
        const result = await page.evaluate(async () => {
            const localVideo = await ComponentTestUtils.createTestComponent('video-view', { 
                'is-local': 'true', 
                'label': 'Local Camera' 
            });
            const remoteVideo = await ComponentTestUtils.createTestComponent('video-view', { 
                'muted': 'true',
                'show-controls': 'false'
            });
            const defaultVideo = await ComponentTestUtils.createTestComponent('video-view');
            
            const localVideoEl = localVideo.shadowRoot.querySelector('#video');
            const localLabel = localVideo.shadowRoot.querySelector('#label');
            const remoteVideoEl = remoteVideo.shadowRoot.querySelector('#video');
            const defaultVideoEl = defaultVideo.shadowRoot.querySelector('#video');
            const defaultLabel = defaultVideo.shadowRoot.querySelector('#label');
            
            return {
                local: {
                    exists: !!localVideo,
                    tagName: localVideo.tagName.toLowerCase(),
                    hasShadowRoot: !!localVideo.shadowRoot,
                    isLocal: localVideo._isLocal,
                    videoMuted: localVideoEl.muted,
                    videoControls: localVideoEl.controls,
                    videoAutoplay: localVideoEl.autoplay,
                    labelText: localLabel.textContent,
                    labelDisplay: window.getComputedStyle(localLabel).display
                },
                remote: {
                    videoMuted: remoteVideoEl.muted,
                    videoControls: remoteVideoEl.controls
                },
                default: {
                    videoMuted: defaultVideoEl.muted,
                    videoControls: defaultVideoEl.controls,
                    labelDisplay: window.getComputedStyle(defaultLabel).display
                }
            };
        });
        
        expect(result.local.exists).to.be.true;
        expect(result.local.tagName).to.equal('video-view');
        expect(result.local.hasShadowRoot).to.be.true;
        expect(result.local.isLocal).to.be.true;
        expect(result.local.videoMuted).to.be.true;
        expect(result.local.videoControls).to.be.true;
        expect(result.local.videoAutoplay).to.be.true;
        expect(result.local.labelText).to.equal('Local Camera');
        expect(result.local.labelDisplay).to.equal('block');
        
        expect(result.remote.videoMuted).to.be.true;
        expect(result.remote.videoControls).to.be.false;
        
        expect(result.default.videoMuted).to.be.false;
        expect(result.default.videoControls).to.be.true;
        expect(result.default.labelDisplay).to.equal('none');
    });
    
    it('should handle stream operations and adaptor setup correctly', async function() {
        const result = await page.evaluate(async () => {
            const localVideo = await ComponentTestUtils.createTestComponent('video-view', { 'is-local': 'true' });
            const remoteVideo = await ComponentTestUtils.createTestComponent('video-view');
            
            const mock = new MockWebRTCAdaptor();
            let changeLocalVideoCalled = false;
            const originalChangeLocalVideo = mock.mediaManager.changeLocalVideo;
            mock.mediaManager.changeLocalVideo = function(videoElement) {
                changeLocalVideoCalled = true;
                return originalChangeLocalVideo.call(this, videoElement);
            };
            
            // Test setup with local video
            localVideo.setup(mock);
            
            // Test setup with remote video (should not call changeLocalVideo)
            remoteVideo.setup(mock);
            
            // Test stream operations with real canvas-based MediaStream
            const mockStream = ComponentTestUtils.createMockMediaStream();
            localVideo.setStream(mockStream);
            
            // Test remote stream with another canvas stream
            const remoteStream = ComponentTestUtils.createMockMediaStream();
            remoteVideo.setStream(remoteStream);
            
            const localVideoEl = localVideo.shadowRoot.querySelector('#video');
            const remoteVideoEl = remoteVideo.shadowRoot.querySelector('#video');
            
            const streamSet = {
                localHasStream: !!localVideoEl.srcObject,
                localStreamId: localVideoEl.srcObject?.id,
                localMockType: localVideoEl.srcObject?._mockType,
                remoteHasStream: !!remoteVideoEl.srcObject,
                remoteStreamId: remoteVideoEl.srcObject?.id,
                remoteMockType: remoteVideoEl.srcObject?._mockType,
                localMockAssigned: localVideoEl._mockStreamAssigned
            };
            
            // Test clear stream
            localVideo.clearStream();
            const streamCleared = !localVideoEl.srcObject;
            
            // Test video property access
            const videoPropertyAccess = localVideo.video === localVideoEl;
            
            // Clean up streams
            ComponentTestUtils.cleanupMockStreams(mockStream, remoteStream);
            
            return {
                changeLocalVideoCalled,
                streamSet,
                streamCleared,
                videoPropertyAccess
            };
        });
        
        expect(result.changeLocalVideoCalled).to.be.true;
        expect(result.streamSet.localHasStream).to.be.true;
        expect(result.streamSet.localStreamId).to.be.a('string');
        expect(result.streamSet.localMockType).to.equal('canvas-generated');
        expect(result.streamSet.localMockAssigned).to.be.true;
        expect(result.streamSet.remoteHasStream).to.be.true;
        expect(result.streamSet.remoteStreamId).to.be.a('string');
        expect(result.streamSet.remoteMockType).to.equal('canvas-generated');
        expect(result.streamCleared).to.be.true;
        expect(result.videoPropertyAccess).to.be.true;
    });
}); 