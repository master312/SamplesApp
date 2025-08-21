const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('StreamPlayAnalytics', function() {
    let page;

    before(async function() {
        page = global.testPage;
    });

    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });

    it('should create the component and correctly reflect the initial offline state', async function() {
        const result = await page.evaluate(async () => {
            const component = await ComponentTestUtils.createTestComponent('stream-play-analytics');
            const shadowRoot = component.shadowRoot;
            return {
                exists: !!component,
                tagName: component.tagName.toLowerCase(),
                hasShadowRoot: !!shadowRoot,
                isOfflineMessageVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                isStatsContentVisible: shadowRoot.getElementById('stats-content').style.display !== 'none',
                statusBadgeText: shadowRoot.getElementById('status-badge').textContent.trim()
            };
        });

        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('stream-play-analytics');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.isOfflineMessageVisible).to.be.true;
        expect(result.isStatsContentVisible).to.be.false;
        expect(result.statusBadgeText).to.equal('Stream Offline');
    });

    it('should transition through the full lifecycle: online, stats update, and offline', async function() {
        const mockStats = {
            averageIncomingBitrate: '1500',
            videoPacketsLost: '10',
            audioPacketsLost: '5',
            videoJitterAverageDelay: '0.02',
            audioJitterAverageDelay: '0.01',
            frameWidth: '1920',
            frameHeight: '1080',
        };

        const result = await page.evaluate(async (stats) => {
            const component = await ComponentTestUtils.createTestComponent('stream-play-analytics');
            const mockAdaptor = new MockWebRTCAdaptor();
            component.setup(mockAdaptor);

            // 1. Go Online
            mockAdaptor.triggerEvent('play_started', { streamId: 'testStream' });
            await new Promise(resolve => setTimeout(resolve, 1));
            const onlineState = {
                isOfflineMessageVisible: component.shadowRoot.getElementById('offline-message').style.display !== 'none',
                isStatsContentVisible: component.shadowRoot.getElementById('stats-content').style.display === 'block',
            };

            // 2. Update Stats
            mockAdaptor.triggerEvent('updated_stats', stats);
            await new Promise(resolve => setTimeout(resolve, 1));
            const updatedStats = {
                avgBitrate: component.shadowRoot.getElementById('avg-bitrate').textContent,
                packetLoss: component.shadowRoot.getElementById('packet-loss').textContent,
                jitter: component.shadowRoot.getElementById('jitter').textContent,
                resolution: component.shadowRoot.getElementById('resolution').textContent,
            };

            // 3. Go Offline
            mockAdaptor.triggerEvent('play_finished', { streamId: 'testStream' });
            await new Promise(resolve => setTimeout(resolve, 1));
            const offlineState = {
                isOfflineMessageVisibleAfter: component.shadowRoot.getElementById('offline-message').style.display === 'block',
                isStatsContentVisibleAfter: component.shadowRoot.getElementById('stats-content').style.display === 'none',
            };

            return { onlineState, updatedStats, offlineState };
        }, mockStats);

        // Assertions for Online State
        expect(result.onlineState.isOfflineMessageVisible).to.be.false;
        expect(result.onlineState.isStatsContentVisible).to.be.true;

        // Assertions for Stats Update
        expect(result.updatedStats.avgBitrate).to.equal('1500');
        expect(result.updatedStats.packetLoss).to.equal('15');
        expect(result.updatedStats.jitter).to.equal('0.0150');
        expect(result.updatedStats.resolution).to.equal('1920x1080');
        
        // Assertions for Offline State
        expect(result.offlineState.isOfflineMessageVisibleAfter).to.be.true;
        expect(result.offlineState.isStatsContentVisibleAfter).to.be.true;
    });

    it('should handle missing stats data gracefully', async function() {
        const result = await page.evaluate(async () => {
            const component = await ComponentTestUtils.createTestComponent('stream-play-analytics');
            const mockAdaptor = new MockWebRTCAdaptor();
            component.setup(mockAdaptor);
            
            mockAdaptor.triggerEvent('play_started', { streamId: 'testStream' });
            mockAdaptor.triggerEvent('updated_stats', {}); // Empty stats object
            await new Promise(resolve => setTimeout(resolve, 1));

            const shadowRoot = component.shadowRoot;
            return {
                avgBitrate: shadowRoot.getElementById('avg-bitrate').textContent,
                packetLoss: shadowRoot.getElementById('packet-loss').textContent,
                jitter: shadowRoot.getElementById('jitter').textContent,
                resolution: shadowRoot.getElementById('resolution').textContent,
            };
        });

        expect(result.avgBitrate).to.equal('N/A');
        expect(result.packetLoss).to.equal('N/A');
        expect(result.jitter).to.equal('N/A');
        expect(result.resolution).to.equal('N/A');
    });

    it('should calculate FPS correctly over time', async function() {
        const fpsValue = await page.evaluate(async () => {
            const component = await ComponentTestUtils.createTestComponent('stream-play-analytics');
            const mockAdaptor = new MockWebRTCAdaptor();
            component.setup(mockAdaptor);

            mockAdaptor.triggerEvent('play_started', { streamId: 'testStream' });
            
            // First stat update establishes baseline
            mockAdaptor.triggerEvent('updated_stats', { framesReceived: 0 });
            await new Promise(resolve => setTimeout(resolve, 500)); 

            // Second stat update after 500ms with 30 new frames
            mockAdaptor.triggerEvent('updated_stats', { framesReceived: 30 });
            await new Promise(resolve => setTimeout(resolve, 1));

            return parseFloat(component.shadowRoot.getElementById('fps').textContent);
        });
        
        // Expected FPS is 30 frames / 0.5 seconds = 60 FPS
        // Allow for some tollerance to make tests more stable
        expect(fpsValue).to.be.within(55, 65);
    });
}); 