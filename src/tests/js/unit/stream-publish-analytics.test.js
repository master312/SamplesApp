const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('StreamPublishAnalytics', function() {
    let page;
    const audioLevelRefreshRate = 250;

    before(async function() {
        page = global.testPage;
    });

    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create the component and correctly reflect the initial offline state', async function() {
        const result = await page.evaluate(async () => {
            const component = await ComponentTestUtils.createTestComponent('stream-publish-analytics');
            const shadowRoot = component.shadowRoot;
            return {
                exists: !!component,
                tagName: component.tagName.toLowerCase(),
                isOfflineMessageVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                isStatsContentVisible: shadowRoot.getElementById('stats-content').style.display !== 'none',
                statusBadgeText: shadowRoot.getElementById('status-badge').textContent.trim()
            };
        });

        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('stream-publish-analytics');
        expect(result.isOfflineMessageVisible).to.be.true;
        expect(result.isStatsContentVisible).to.be.false;
        expect(result.statusBadgeText).to.equal('Stream Offline');
    });

    it('should transition through the full lifecycle and manage the audio meter', async function() {
        const mockStats = {
            averageOutgoingBitrate: '2500', videoPacketsLost: '20', audioPacketsLost: '3',
            videoJitter: '0.03', audioJitter: '0.015', videoRoundTripTime: '0.05',
            audioRoundTripTime: '0.04', resWidth: '1280', resHeight: '720', currentFPS: '30',
        };

        const result = await page.evaluate(async ({ stats, delay }) => {
            const component = await ComponentTestUtils.createTestComponent('stream-publish-analytics');
            const mockAdaptor = new MockWebRTCAdaptor();
            
            mockAdaptor.enableStats = (streamId) => {
                if (!mockAdaptor.remotePeerConnection) {
                    mockAdaptor.remotePeerConnection = {};
                }
                mockAdaptor.remotePeerConnection[streamId] = {
                    getStats: () => Promise.resolve(new Map([
                        ['stats-id-1', { type: 'media-source', kind: 'audio', audioLevel: 0.5 }]
                    ]))
                };
            };

            component.setup(mockAdaptor);

            // 1. Go Online (Publish Started)
            mockAdaptor.triggerEvent('publish_started', { streamId: 'testStream' });
            await new Promise(resolve => setTimeout(resolve, 10));
            const onlineState = {
                isOfflineMessageVisible: component.shadowRoot.getElementById('offline-message').style.display !== 'none',
                isStatsContentVisible: component.shadowRoot.getElementById('stats-content').style.display === 'block',
            };

            // 2. Check Audio Meter Start
            await new Promise(resolve => setTimeout(resolve, delay + 50));
            const audioLevelStarted = component.shadowRoot.getElementById('audio-level').value;

            // 3. Update Stats
            mockAdaptor.triggerEvent('updated_stats', stats);
            await new Promise(resolve => setTimeout(resolve, 10));
            const updatedStats = {
                avgBitrate: component.shadowRoot.getElementById('avg-bitrate').textContent,
                packetLoss: component.shadowRoot.getElementById('packet-loss').textContent,
                resolution: component.shadowRoot.getElementById('resolution').textContent,
            };

            // 4. Go Offline (Publish Finished)
            mockAdaptor.triggerEvent('publish_finished', { streamId: 'testStream' });
            await new Promise(resolve => setTimeout(resolve, 10));
            const offlineState = {
                isOfflineMessageVisibleAfter: component.shadowRoot.getElementById('offline-message').style.display === 'block',
                isStatsContentVisibleAfter: component.shadowRoot.getElementById('stats-content').style.display === 'none',
                audioLevelAfter: component.shadowRoot.getElementById('audio-level').value,
            };

            return { onlineState, audioLevelStarted, updatedStats, offlineState };
        }, { stats: mockStats, delay: audioLevelRefreshRate });

        // Assertions
        expect(result.onlineState.isOfflineMessageVisible).to.be.false;
        expect(result.onlineState.isStatsContentVisible).to.be.true;
        expect(result.audioLevelStarted).to.equal(0.5);
        expect(result.updatedStats.avgBitrate).to.equal('2500');
        expect(result.updatedStats.packetLoss).to.equal('23');
        expect(result.updatedStats.resolution).to.equal('1280x720');
        expect(result.offlineState.isOfflineMessageVisibleAfter).to.be.true;
        expect(result.offlineState.isStatsContentVisibleAfter).to.be.true;
        expect(result.offlineState.audioLevelAfter).to.equal(0);
    });
}); 