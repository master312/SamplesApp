const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('InputVideoSelector', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect initial state', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-video-selector');
            const select = comp.shadowRoot.getElementById('video-source');
            
            return {
                exists: !!comp,
                tagName: comp.tagName.toLowerCase(),
                hasShadowRoot: !!comp.shadowRoot,
                selectExists: !!select,
                optionsCount: select.options.length,
                currentVideoSource: comp.currentVideoSource
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('input-video-selector');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.selectExists).to.be.true;
        expect(result.optionsCount).to.equal(0);
        expect(result.currentVideoSource).to.equal('');
    });
    
    it('should setup with adaptor and populate devices', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-video-selector');
            const mock = new MockWebRTCAdaptor();
            
            mock.mediaManager.getDevices = async function() {
                return [
                    { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
                    { kind: 'videoinput', deviceId: 'camera2', label: '' },
                    { kind: 'videoinput', deviceId: 'camera3', label: null },
                    { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' }
                ];
            };
            
            mock.mediaManager.localStream = {
                getVideoTracks: () => [{ enabled: true }],
                removeTrack: () => {}
            };
            
            mock.switchVideoCameraCapture = function(streamId, deviceId) {
                this._lastSwitchCall = { type: 'camera', streamId, deviceId };
                return Promise.resolve();
            };
            
            mock.switchDesktopCapture = function(streamId) {
                this._lastSwitchCall = { type: 'screen', streamId };
                return Promise.resolve();
            };
            
            mock.switchDesktopCaptureWithCamera = function(streamId) {
                this._lastSwitchCall = { type: 'screen+camera', streamId };
                return Promise.resolve();
            };
            
            mock.publishStreamId = 'test-stream';
            
            await comp.setup(mock);
            
            const select = comp.shadowRoot.getElementById('video-source');
            const options = Array.from(select.options).map(opt => ({
                value: opt.value,
                text: opt.textContent
            }));
            
            let eventFired = null;
            comp.addEventListener('input-changed-video', (e) => {
                eventFired = e.detail;
            });
            
            select.value = 'camera2';
            await comp._handleVideoSourceChange();
            
            return {
                optionsCount: select.options.length,
                options: options,
                switchCall: mock._lastSwitchCall,
                eventDetail: eventFired,
                currentSource: comp.currentVideoSource
            };
        });
        
        expect(result.optionsCount).to.equal(6);
        expect(result.options[0]).to.deep.equal({ value: 'camera1', text: 'Front Camera' });
        expect(result.options[1]).to.deep.equal({ value: 'camera2', text: 'Camera 1' });
        expect(result.options[2]).to.deep.equal({ value: 'camera3', text: 'Camera 2' });
        expect(result.options[3]).to.deep.equal({ value: 'screen', text: 'Screen Share' });
        expect(result.options[4]).to.deep.equal({ value: 'screen+camera', text: 'Screen with Camera' });
        expect(result.options[5]).to.deep.equal({ value: 'none', text: 'No Video' });
        expect(result.switchCall).to.deep.equal({ type: 'camera', streamId: 'test-stream', deviceId: 'camera2' });
        expect(result.eventDetail).to.deep.equal({ stream: result.eventDetail.stream });
        expect(result.currentSource).to.equal('camera2');
    });
    
    it('should handle no audio selection, error recovery, and UI states', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-video-selector');
            const mock = new MockWebRTCAdaptor();
            
            mock.mediaManager.getDevices = async function() {
                return [{ kind: 'videoinput', deviceId: 'camera1', label: 'Camera' }];
            };
            
            mock.mediaManager.localStream = {
                getVideoTracks: () => [{ stop: () => {}, enabled: true }],
                removeTrack: () => {}
            };
            
            mock.switchDesktopCapture = function(streamId) {
                this._lastCall = 'screen';
                return Promise.resolve();
            };
            
            mock.switchDesktopCaptureWithCamera = function(streamId) {
                this._lastCall = 'screen+camera';
                return Promise.resolve();
            };
            
            mock.publishStreamId = 'test-stream';
            
            await comp.setup(mock);
            
            const select = comp.shadowRoot.getElementById('video-source');
            
            select.value = 'screen';
            await comp._handleVideoSourceChange();
            const screenCall = mock._lastCall;
            
            select.value = 'screen+camera';
            await comp._handleVideoSourceChange();
            const screenCameraCall = mock._lastCall;
            
            select.value = 'none';
            await comp._handleVideoSourceChange();
            
            mock.mediaManager = null;
            let noErrorWithoutMediaManager = true;
            try {
                await comp._handleVideoSourceChange();
            } catch (error) {
                noErrorWithoutMediaManager = false;
            }
            
            comp.setInputDisabled(true);
            const isDisabled = select.disabled;
            
            return {
                screenCall,
                screenCameraCall,
                noErrorWithoutMediaManager,
                isDisabled
            };
        });
        
        expect(result.screenCall).to.equal('screen');
        expect(result.screenCameraCall).to.equal('screen+camera');
        expect(result.noErrorWithoutMediaManager).to.be.true;
        expect(result.isDisabled).to.be.true;
    });
}); 