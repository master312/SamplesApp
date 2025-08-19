const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('ResolutionSelector', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect initial state', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('resolution-selector');
            const select = comp.shadowRoot.getElementById('resolution-select');
            
            return {
                exists: !!comp,
                tagName: comp.tagName.toLowerCase(),
                hasShadowRoot: !!comp.shadowRoot,
                optionsCount: select.options.length,
                defaultValue: select.value,
                defaultText: select.options[0].text,
                selectedResolution: comp.getSelectedResolution()
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('resolution-selector');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.optionsCount).to.equal(1);
        expect(result.defaultValue).to.equal('0');
        expect(result.defaultText).to.equal('Automatic');
        expect(result.selectedResolution).to.equal(0);
    });
    
    it('should handle stream information and resolution selection workflow', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('resolution-selector');
            const mock = new MockWebRTCAdaptor();
            
            mock.getStreamInfo = function(streamId) {
                this.triggerEvent('streamInformation', {
                    streamInfo: [
                        { streamHeight: 720 },
                        { streamHeight: 480 },
                        { streamHeight: 1080 },
                        { streamHeight: 480 }
                    ]
                });
            };
            
            mock.forceStreamQuality = function(streamId, resolution) {
                this._lastForceCall = { streamId, resolution };
            };
            mock.playStreamId = ['test-stream'];
            
            comp.setup(mock, 'test-stream');
            
            mock.triggerEvent('play_started', { streamId: 'test-stream' });
            
            const select = comp.shadowRoot.getElementById('resolution-select');
            const afterStreamInfo = {
                optionsCount: select.options.length,
                availableResolutions: comp._availableResolutions,
                options: Array.from(select.options).map(opt => ({ value: opt.value, text: opt.textContent }))
            };
            
            let eventFired = null;
            comp.addEventListener('resolution-changed', (e) => {
                eventFired = e.detail;
            });
            
            select.value = '720';
            select.dispatchEvent(new Event('change'));
            
            const afterSelection = {
                selectedResolution: comp.getSelectedResolution(),
                forceCall: mock._lastForceCall,
                eventDetail: eventFired
            };
            
            mock.triggerEvent('play_finished', {});
            
            const afterFinish = {
                optionsCount: select.options.length,
                value: select.value,
                availableResolutions: comp._availableResolutions.length
            };
            
            return { afterStreamInfo, afterSelection, afterFinish };
        });
        
        expect(result.afterStreamInfo.optionsCount).to.equal(4);
        expect(result.afterStreamInfo.availableResolutions).to.deep.equal([480, 720, 1080]);
        expect(result.afterStreamInfo.options[0]).to.deep.equal({ value: '0', text: 'Automatic' });
        expect(result.afterStreamInfo.options[3]).to.deep.equal({ value: '1080', text: '1080p' });
        
        expect(result.afterSelection.selectedResolution).to.equal(720);
        expect(result.afterSelection.forceCall).to.deep.equal({ streamId: 'test-stream', resolution: 720 });
        expect(result.afterSelection.eventDetail).to.deep.equal({
            resolution: 720,
            text: '720p',
            streamId: 'test-stream'
        });
        
        expect(result.afterFinish.optionsCount).to.equal(1);
        expect(result.afterFinish.value).to.equal('0');
        expect(result.afterFinish.availableResolutions).to.equal(0);
    });
}); 