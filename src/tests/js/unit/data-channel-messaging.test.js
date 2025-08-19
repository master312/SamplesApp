const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('DataChannelMessaging', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component with basic elements', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const shadowRoot = comp.shadowRoot;
            
            return {
                exists: !!comp,
                hasInput: !!shadowRoot.getElementById('data-message'),
                hasButton: !!shadowRoot.getElementById('send-data'),
                hasMessagesDiv: !!shadowRoot.getElementById('all-messages'),
                hasOfflineMessage: !!shadowRoot.getElementById('offline-message'),
                hasStatusBadge: !!shadowRoot.getElementById('status-badge')
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.hasInput).to.be.true;
        expect(result.hasButton).to.be.true;
        expect(result.hasMessagesDiv).to.be.true;
        expect(result.hasOfflineMessage).to.be.true;
        expect(result.hasStatusBadge).to.be.true;
    });
    
    it('should show offline state initially', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const shadowRoot = comp.shadowRoot;
            
            return {
                offlineVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                dataContentVisible: shadowRoot.getElementById('data-content').style.display === 'none',
                inputDisabled: shadowRoot.getElementById('data-message').disabled,
                buttonDisabled: shadowRoot.getElementById('send-data').disabled
            };
        });
        
        expect(result.offlineVisible).to.be.true;
        expect(result.dataContentVisible).to.be.true; // data-content is hidden initially
        expect(result.inputDisabled).to.be.true; // inputs are disabled when offline
        expect(result.buttonDisabled).to.be.true; // buttons are disabled when offline
    });
    
    it('should enable messaging when publish stream starts', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const shadowRoot = comp.shadowRoot;
            return {
                offlineVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                dataContentVisible: shadowRoot.getElementById('data-content').style.display !== 'none',
                inputDisabled: shadowRoot.getElementById('data-message').disabled,
                buttonDisabled: shadowRoot.getElementById('send-data').disabled
            };
        });
        
        expect(result.offlineVisible).to.be.false;
        expect(result.dataContentVisible).to.be.true;
        expect(result.inputDisabled).to.be.false;
        expect(result.buttonDisabled).to.be.false;
    });
    
    it('should enable messaging when play stream starts', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('play_started', { streamId: 'test-stream' });
            
            const shadowRoot = comp.shadowRoot;
            return {
                dataContentVisible: shadowRoot.getElementById('data-content').style.display !== 'none',
                inputDisabled: shadowRoot.getElementById('data-message').disabled
            };
        });
        
        expect(result.dataContentVisible).to.be.true;
        expect(result.inputDisabled).to.be.false;
    });
    
    it('should send message when send button clicked', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const input = comp.shadowRoot.getElementById('data-message');
            input.value = 'test message';
            
            let sentData = null;
            mock.sendData = function(streamId, data) {
                sentData = { streamId, data };
                return true;
            };
            
            comp.shadowRoot.getElementById('send-data').click();
            
            return {
                sentData,
                inputValue: input.value
            };
        });
        
        expect(result.sentData).to.not.be.null;
        expect(result.sentData.streamId).to.equal('test-stream');
        expect(result.sentData.data).to.equal('test message');
        expect(result.inputValue).to.equal(''); // Should clear input
    });
    
    it('should send message when enter key pressed', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const input = comp.shadowRoot.getElementById('data-message');
            input.value = 'enter message';
            
            let sentData = null;
            mock.sendData = function(streamId, data) {
                sentData = { streamId, data };
                return true;
            };
            
            const event = new KeyboardEvent('keypress', { key: 'Enter' });
            input.dispatchEvent(event);
            
            return {
                sentData,
                inputValue: input.value
            };
        });
        
        expect(result.sentData).to.not.be.null;
        expect(result.sentData.data).to.equal('enter message');
        expect(result.inputValue).to.equal('');
    });
    
    it('should not send empty messages', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            let sendCalled = false;
            mock.sendData = function() {
                sendCalled = true;
                return true;
            };
            
            // Try empty message
            comp.shadowRoot.getElementById('data-message').value = '';
            comp.shadowRoot.getElementById('send-data').click();
            
            const emptyResult = sendCalled;
            sendCalled = false;
            
            // Try whitespace only
            comp.shadowRoot.getElementById('data-message').value = '   ';
            comp.shadowRoot.getElementById('send-data').click();
            
            return {
                emptyMessageSent: emptyResult,
                whitespaceMessageSent: sendCalled
            };
        });
        
        expect(result.emptyMessageSent).to.be.false;
        expect(result.whitespaceMessageSent).to.be.false;
    });
    
    it('should display received messages', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            mock.triggerEvent('data_received', { data: 'Hello from peer!' });
            
            const messagesDiv = comp.shadowRoot.getElementById('all-messages');
            return {
                messageCount: messagesDiv.children.length,
                messageText: messagesDiv.innerHTML.includes('Hello from peer!')
            };
        });
        
        expect(result.messageCount).to.equal(1);
        expect(result.messageText).to.be.true;
    });
    
    it('should display sent messages', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const input = comp.shadowRoot.getElementById('data-message');
            input.value = 'outgoing message';
            comp.shadowRoot.getElementById('send-data').click();
            
            const messagesDiv = comp.shadowRoot.getElementById('all-messages');
            return {
                messageCount: messagesDiv.children.length,
                messageText: messagesDiv.innerHTML.includes('outgoing message'),
                hasSentLabel: messagesDiv.innerHTML.includes('Sent:')
            };
        });
        
        expect(result.messageCount).to.equal(1);
        expect(result.messageText).to.be.true;
        expect(result.hasSentLabel).to.be.true;
    });
    
    it('should disable messaging when streams stop', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            // Start stream
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            const enabledState = !comp.shadowRoot.getElementById('data-message').disabled;
            
            // Stop stream
            mock.triggerEvent('publish_finished');
            const disabledState = comp.shadowRoot.getElementById('data-message').disabled;
            
            return { enabledState, disabledState };
        });
        
        expect(result.enabledState).to.be.true;
        expect(result.disabledState).to.be.true;
    });
    
    it('should validate stream ID for security', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-messaging');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'correct-stream' });
            
            let sendCalled = false;
            mock.sendData = function() {
                sendCalled = true;
                return true;
            };
            
            // Try to send without proper stream
            comp._publishStreamId = null;
            comp._playStreamId = null;
            
            comp.shadowRoot.getElementById('data-message').value = 'test';
            comp.shadowRoot.getElementById('send-data').click();
            
            return { sendCalled };
        });
        
        expect(result.sendCalled).to.be.false;
    });
}); 