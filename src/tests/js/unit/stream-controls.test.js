const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('StreamSimpleControls', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component with basic elements', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const shadowRoot = comp.shadowRoot;
            
            return {
                exists: !!comp,
                hasInput: !!shadowRoot.getElementById('streamName'),
                hasButton: !!shadowRoot.getElementById('toggle_button'),
                hasCheckbox: !!shadowRoot.getElementById('reconnect_checkbox'),
                streamId: comp.getStreamId(),
                isActive: comp.isActive()
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.hasInput).to.be.true;
        expect(result.hasButton).to.be.true;
        expect(result.hasCheckbox).to.be.true;
        expect(result.streamId).to.contain('streamId_');
        expect(result.isActive).to.be.false;
    });
    
    it('should use custom stream ID when provided', async function() {
        const streamId = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls', {
                'default-stream-id': 'test-123'
            });
            return comp.getStreamId();
        });
        
        expect(streamId).to.equal('test-123');
    });
    
    it('should emit start-stream event when idle', async function() {
        const eventFired = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            let fired = false;
            
            comp.addEventListener('start-stream', () => fired = true);
            comp.shadowRoot.getElementById('toggle_button').click();
            
            return fired;
        });
        
        expect(eventFired).to.be.true;
    });
    
    it('should emit stop-stream event when active', async function() {
        const eventFired = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            // Get to active state
            mock.triggerEvent('publish_started', { streamId: comp.getStreamId() });
            
            let fired = false;
            comp.addEventListener('stop-stream', () => fired = true);
            comp.shadowRoot.getElementById('toggle_button').click();
            
            return fired;
        });
        
        expect(eventFired).to.be.true;
    });
    
    it('should change state when stream starts and stops', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            // Start stream
            mock.triggerEvent('publish_started', { streamId: comp.getStreamId() });
            const activeState = comp.isActive();
            const activeButtonText = comp.shadowRoot.getElementById('toggle_button').textContent;
            
            // Stop stream
            mock.reconnectIfRequiredFlag = false;
            mock.triggerEvent('publish_finished', { streamId: comp.getStreamId() });
            const idleState = comp.isActive();
            const idleButtonText = comp.shadowRoot.getElementById('toggle_button').textContent;
            
            return { activeState, activeButtonText, idleState, idleButtonText };
        });
        
        expect(result.activeState).to.be.true;
        expect(result.activeButtonText).to.equal('Stop');
        expect(result.idleState).to.be.false;
        expect(result.idleButtonText).to.equal('Start');
    });
    
    it('should handle reconnecting state', async function() {
        const buttonText = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: comp.getStreamId() });
            mock.reconnectIfRequiredFlag = true;
            mock.triggerEvent('publish_finished', { streamId: comp.getStreamId() });
            
            return comp.shadowRoot.getElementById('toggle_button').textContent;
        });
        
        expect(buttonText).to.equal('Stop Reconnecting');
    });
    
    it('should emit stop-stream event when clicking during reconnecting state', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            // Get to reconnecting state
            mock.triggerEvent('publish_started', { streamId: comp.getStreamId() });
            mock.reconnectIfRequiredFlag = true;
            mock.triggerEvent('publish_finished', { streamId: comp.getStreamId() });
            
            let eventFired = false;
            comp.addEventListener('stop-stream', () => eventFired = true);
            
            // Click button during reconnecting state
            comp.shadowRoot.getElementById('toggle_button').click();
            
            return {
                eventFired,
                isActive: comp.isActive()
            };
        });
        
        expect(result.eventFired).to.be.true;
        expect(result.isActive).to.be.false; // Should go to idle state
    });
    
    it('should sync reconnect checkbox with adaptor', async function() {
        const reconnectFlag = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            const checkbox = comp.shadowRoot.getElementById('reconnect_checkbox');
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
            
            return mock.reconnectIfRequiredFlag;
        });
        
        expect(reconnectFlag).to.be.false;
    });
    
    it('should work with play stream type', async function() {
        const isActive = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock, 'play');
            
            mock.triggerEvent('play_started', { streamId: comp.getStreamId() });
            return comp.isActive();
        });
        
        expect(isActive).to.be.true;
    });
    
    it('should use custom button text', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('stream-controls', {
                'start-button-text': 'Begin',
                'stop-button-text': 'End'
            });
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            const button = comp.shadowRoot.getElementById('toggle_button');
            const startText = button.textContent;
            
            mock.triggerEvent('publish_started', { streamId: comp.getStreamId() });
            const stopText = button.textContent;
            
            return { startText, stopText };
        });
        
        expect(result.startText).to.equal('Begin');
        expect(result.stopText).to.equal('End');
    });
}); 