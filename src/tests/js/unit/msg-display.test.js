const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('MsgDisplay', function() {
    let page;

    before(async function() {
        page = global.testPage;
    });

    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });

    it('should initialize and setup with an adaptor correctly', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('msg-display');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);

            const headerTitle = comp.shadowRoot.querySelector('.header-title').textContent.trim();
            const logContainer = comp.shadowRoot.querySelector('#log-container');
            const settingsPanel = comp.shadowRoot.querySelector('#settings-panel');

            return {
                exists: !!comp,
                tagName: comp.tagName.toLowerCase(),
                hasShadowRoot: !!comp.shadowRoot,
                headerTitle: headerTitle,
                logIsEmpty: logContainer.children.length === 0,
                settingsHidden: settingsPanel.style.display === 'none'
            };
        });

        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('msg-display');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.headerTitle).to.include('Adaptor event logs:');
        expect(result.logIsEmpty).to.be.true;
        expect(result.settingsHidden).to.be.true;
    });

    it('should display messages based on filter settings', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('msg-display');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);

            const logContainer = comp.shadowRoot.querySelector('#log-container');
            const settingsPanel = comp.shadowRoot.querySelector('#settings-panel');

            // 1. Error event is visible by default
            mock.triggerError('test_error', 'This is an error message');
            const errorMsgVisible = logContainer.querySelector('.error').textContent.includes('test_error');

            // 2. Play event is hidden by default
            mock.triggerEvent('play_started', { streamId: 'stream1' });
            const playStartedMsgHidden = !logContainer.textContent.includes('play_started');

            // 3. Enable 'play_started' in settings
            comp.shadowRoot.getElementById('settings-toggle-btn').click();
            settingsPanel.querySelector('#toggle-play_started').click();

            // 4. Trigger 'play_started' again, now it should be visible
            mock.triggerEvent('play_started', { streamId: 'stream2' });
            const playStartedMsgVisible = logContainer.textContent.includes('play_started');

            // 5. new event type should create a new toggle and be hidden by default
            mock.triggerEvent('a_new_event', { data: 'el_data' });
            const newToggleExists = !!settingsPanel.querySelector('#toggle-a_new_event');
            const newEventMsgHidden = !logContainer.textContent.includes('a_new_event');

            return {
                errorMsgVisible,
                playStartedMsgHidden,
                playStartedMsgVisible,
                newToggleExists,
                newEventMsgHidden
            };
        });

        expect(result.errorMsgVisible, 'Error message should be visible').to.be.true;
        expect(result.playStartedMsgHidden, 'play_started should be hidden initially').to.be.true;
        expect(result.playStartedMsgVisible, 'play_started should be visible after toggling').to.be.true;
        expect(result.newToggleExists, 'A new toggle should be created for a new event type').to.be.true;
        expect(result.newEventMsgHidden, 'The new event message should be hidden by default').to.be.true;
    });
}); 