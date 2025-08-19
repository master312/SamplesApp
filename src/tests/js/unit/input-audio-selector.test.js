const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('InputAudioSelector', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect initial state', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-audio-selector');
            const select = comp.shadowRoot.getElementById('audio-source');
            
            return {
                exists: !!comp,
                tagName: comp.tagName.toLowerCase(),
                hasShadowRoot: !!comp.shadowRoot,
                selectExists: !!select,
                optionsCount: select.options.length,
                currentAudioSource: comp.currentAudioSource
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('input-audio-selector');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.selectExists).to.be.true;
        expect(result.optionsCount).to.equal(0);
        expect(result.currentAudioSource).to.equal('');
    });
    
    it('should setup with adaptor and handle audio device selection', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-audio-selector');
            const mock = new MockWebRTCAdaptor();
            
            mock.mediaManager.getDevices = async function() {
                return [
                    { kind: 'audioinput', deviceId: 'mic1', label: 'Built-in Microphone' },
                    { kind: 'audioinput', deviceId: 'mic2', label: '' },
                    { kind: 'audioinput', deviceId: 'mic3', label: null },
                    { kind: 'videoinput', deviceId: 'cam1', label: 'Camera' }
                ];
            };
            
            mock.mediaManager.localStream = {
                getAudioTracks: () => [{ stop: () => {}, enabled: true }],
                removeTrack: () => {}
            };
            
            mock.switchAudioInputSource = function(streamId, deviceId) {
                this._lastSwitchCall = { streamId, deviceId };
                return Promise.resolve();
            };
            
            mock.publishStreamId = 'test-stream';
            
            await comp.setup(mock);
            
            const select = comp.shadowRoot.getElementById('audio-source');
            const options = Array.from(select.options).map(opt => ({
                value: opt.value,
                text: opt.textContent
            }));
            
            let eventFired = null;
            comp.addEventListener('input-changed-audio', (e) => {
                eventFired = e.detail;
            });
            
            select.value = 'mic2';
            await comp._handleAudioSourceChange();
            
            return {
                optionsCount: select.options.length,
                options: options,
                switchCall: mock._lastSwitchCall,
                eventDetail: eventFired,
                currentSource: comp.currentAudioSource
            };
        });
        
        expect(result.optionsCount).to.equal(4);
        expect(result.options[0]).to.deep.equal({ value: 'mic1', text: 'Built-in Microphone' });
        expect(result.options[1]).to.deep.equal({ value: 'mic2', text: 'Microphone 1' });
        expect(result.options[2]).to.deep.equal({ value: 'mic3', text: 'Microphone 2' });
        expect(result.options[3]).to.deep.equal({ value: 'none', text: 'No Audio' });
        expect(result.switchCall).to.deep.equal({ streamId: 'test-stream', deviceId: 'mic2' });
        expect(result.eventDetail).to.deep.equal({ stream: result.eventDetail.stream });
        expect(result.currentSource).to.equal('mic2');
    });
    
    it('should handle no audio option select, and error scenarios', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('input-audio-selector');
            const mock = new MockWebRTCAdaptor();
            
            mock.mediaManager.getDevices = async function() {
                return [{ kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' }];
            };
            
            let trackStopped = false;
            let trackRemoved = false;
            
            mock.mediaManager.localStream = {
                getAudioTracks: () => [{
                    stop: () => { trackStopped = true; },
                    enabled: true
                }],
                removeTrack: () => { trackRemoved = true; }
            };
            
            await comp.setup(mock);
            
            const select = comp.shadowRoot.getElementById('audio-source');
            
            select.value = 'none';
            await comp._handleAudioSourceChange();
            
            mock.mediaManager = null;
            let noErrorWithoutMediaManager = true;
            try {
                await comp._handleAudioSourceChange();
            } catch (error) {
                noErrorWithoutMediaManager = false;
            }
            
            // Test null adaptor safety
            comp._webRTCAdaptor = null;
            comp._mediaManager = { localStream: { getAudioTracks: () => [] } };
            let noErrorWithNullAdaptor = true;
            try {
                await comp._handleAudioSourceChange();
            } catch (error) {
                noErrorWithNullAdaptor = false;
            }
            
            comp.setInputDisabled(true);
            const isDisabled = select.disabled;
            
            return {
                trackStopped,
                trackRemoved,
                noErrorWithoutMediaManager,
                noErrorWithNullAdaptor,
                isDisabled
            };
        });
        
        expect(result.trackStopped).to.be.true;
        expect(result.trackRemoved).to.be.true;
        expect(result.noErrorWithoutMediaManager).to.be.true;
        expect(result.noErrorWithNullAdaptor).to.be.true;
        expect(result.isDisabled).to.be.true;
    });
}); 