const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');
const MockWebRTCAdaptor = require('../common/webrtc-adaptor-mock.js');

describe('AdvancedVideoPublisherSettings', function() {
    let page;

    before(async function() {
        page = global.testPage;
    });

    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });

    it('should create the component and set the initial bitrate value', async function() {
        const initialBitrate = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-video-publisher-settings');
            return comp.shadowRoot.getElementById('max-video-bitrate').value;
        });

        expect(initialBitrate).to.equal('1200');
    });

    it('should call changeBandwidth when the Apply button is clicked', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-video-publisher-settings');
            const mock = new MockWebRTCAdaptor();

            window.lastBandwidth = null;
            window.lastStreamId = null;
            mock.changeBandwidth = (bandwidth, streamId) => {
                window.lastBandwidth = bandwidth;
                window.lastStreamId = streamId;
            };
            mock.publishStreamId = 'stream1';
            comp.setup(mock);

            const bitrateInput = comp.shadowRoot.getElementById('max-video-bitrate');
            bitrateInput.value = '1555';

            comp.shadowRoot.getElementById('apply-bitrate').click();

            const appliedBandwidth = window.lastBandwidth;
            const appliedStreamId = window.lastStreamId;
            
            delete window.lastBandwidth;
            delete window.lastStreamId;

            return { appliedBandwidth, appliedStreamId };
        });

        expect(result.appliedBandwidth).to.equal('1555');
        expect(result.appliedStreamId).to.equal('stream1');
    });

    it('should apply the default bitrate when publish starts', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-video-publisher-settings', {
                'apply-delay-ms': '500'
            });
            const mock = new MockWebRTCAdaptor();
            
            window.lastBandwidth = null;
            window.lastStreamId = null;
            mock.changeBandwidth = (bandwidth, streamId) => {
                window.lastBandwidth = bandwidth;
                window.lastStreamId = streamId;
            };
            comp.setup(mock);

            // Simulate publish starting
            mock.triggerEvent('publish_started', { streamId: 'stream-on-start' });

            // Wait for the internal setTimeout
            await new Promise(resolve => setTimeout(resolve, 550));

            const appliedBandwidth = window.lastBandwidth;
            const appliedStreamId = window.lastStreamId;
            
            delete window.lastBandwidth;
            delete window.lastStreamId;

            return { appliedBandwidth, appliedStreamId };
        });

        expect(result.appliedBandwidth).to.equal('1200');
        expect(result.appliedStreamId).to.equal('stream-on-start');
    });
}); 