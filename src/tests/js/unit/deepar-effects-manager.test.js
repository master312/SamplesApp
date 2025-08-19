const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('DeeparEffectsManager', function () {
    let page;

    before(async function () {
        page = global.testPage;
        
        await page.evaluate(async () => {
            const { VideoEffect } = await import('/js/ant-sdk/video-effect.js');
            window.VideoEffect = VideoEffect;
        });
    });

    afterEach(async function () {
        await page.evaluate(() => {
            ComponentTestUtils.cleanupComponents();
        });
    });

    it('should create component and handle initial state and attributes', async function () {
        const result = await page.evaluate(async () => {
            const compDefault = await ComponentTestUtils.createTestComponent('deepar-effects-manager');
            const compWithAttrs = await ComponentTestUtils.createTestComponent('deepar-effects-manager', {
                'api-key': 'test-key',
                'hide-apikey-button': ''
            });

            return {
                defaultApiKey: compDefault.getApiKey(),
                defaultButtonVisible: !compDefault.shadowRoot.getElementById('set_apikey_button').hidden,
                
                initialApiKey: compWithAttrs.getApiKey(),
                buttonIsHidden: compWithAttrs.shadowRoot.getElementById('set_apikey_button').style.display === 'none',
                
                initialOptionsCount: compDefault.shadowRoot.getElementById('effect_selector').options.length
            };
        });

        expect(result.defaultApiKey).to.be.null;
        expect(result.defaultButtonVisible).to.be.true;
        expect(result.initialApiKey).to.equal('test-key');
        expect(result.buttonIsHidden).to.be.true;
        expect(result.initialOptionsCount).to.equal(0);
    });

    it('should setup correctly and populate the effect selector UI', async function () {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('deepar-effects-manager');
            const mockAdaptor = new window.MockWebRTCAdaptor();
            
            comp.setup(mockAdaptor, ['effect_one', 'effect_two']);

            const selector = comp.shadowRoot.getElementById('effect_selector');
            const options = Array.from(selector.options).map(opt => ({
                value: opt.value,
                text: opt.textContent
            }));

            return {
                options,
                selectedValue: selector.value
            };
        });

        expect(result.options).to.have.lengthOf(3);
        expect(result.options[0]).to.deep.equal({ value: 'no-effect', text: 'No Effect' });
        expect(result.options[1]).to.deep.equal({ value: 'effect_one', text: 'Effect One' });
        expect(result.options[2]).to.deep.equal({ value: 'effect_two', text: 'Effect Two' });
        expect(result.selectedValue).to.equal('no-effect');
    });

    it('should handle user interactions for effect selection and API key updates', async function () {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('deepar-effects-manager', {
                'api-key': 'initial-key'
            });

            // This is a browser-context mock, not related to the Node.js MockWebRTCAdaptor class
            const adaptorMock = {
                _calledEnableEffect: [],
                enableEffect: function(...args) {
                    this._calledEnableEffect.push(args);
                    return Promise.resolve();
                }
            };
            
            comp.setup(adaptorMock, ['test_effect']);
            
            // 1. Select an effect
            const selector = comp.shadowRoot.getElementById('effect_selector');
            selector.value = 'test_effect';
            selector.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 20));

            // 2. Select no effect
            selector.value = window.VideoEffect.NO_EFFECT;
            selector.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // 3. Update API key via prompt
            window.prompt = () => 'new-key'; // Stub prompt
            comp.shadowRoot.getElementById('set_apikey_button').click();
            await new Promise(resolve => setTimeout(resolve, 20));

            return {
                apiKeyAfterUpdate: comp.getApiKey(),
                enableEffectCalls: adaptorMock._calledEnableEffect
            };
        });
        
        expect(result.enableEffectCalls).to.have.lengthOf(3);
        // Call 1: selecting 'test_effect'
        expect(result.enableEffectCalls[0]).to.deep.equal(['deepar', 'initial-key', 'test_effect']);
        // Call 2: selecting 'no-effect'
        expect(result.enableEffectCalls[1]).to.deep.equal(['no-effect']);
        // Call 3: stop() is called inside setApiKey, triggering a reset
        expect(result.enableEffectCalls[2]).to.deep.equal(['no-effect']);
        
        expect(result.apiKeyAfterUpdate).to.equal('new-key');
    });

    it('should handle edge cases and errors gracefully', async function () {
        const result = await page.evaluate(async () => {
            const results = {};
            const originalWarn = console.warn;
            const originalError = console.error;
            let capturedWarn = '';
            let capturedError = '';

            console.warn = (msg) => { capturedWarn = msg; };
            console.error = (msg) => { capturedError = msg; };

            // 1. Interact without setup
            const compNoSetup = await ComponentTestUtils.createTestComponent('deepar-effects-manager');
            compNoSetup.shadowRoot.getElementById('effect_selector').dispatchEvent(new Event('change'));
            results.warnOnNoSetup = capturedWarn;

            // 2. Cancel prompt for API key
            const compPrompt = await ComponentTestUtils.createTestComponent('deepar-effects-manager', { 'api-key': 'key1' });
            window.prompt = () => null; // Simulate user canceling
            compPrompt.shadowRoot.getElementById('set_apikey_button').click();
            results.apiKeyAfterCancel = compPrompt.getApiKey();
            
            // 3. Handle rejected promise from enableEffect
            const compReject = await ComponentTestUtils.createTestComponent('deepar-effects-manager', { 'api-key': 'key2' });
            const failingAdaptor = { enableEffect: () => Promise.reject('Effect failed') };
            compReject.setup(failingAdaptor, ['failing_effect']);
            
            const selector = compReject.shadowRoot.getElementById('effect_selector');
            selector.value = 'failing_effect';
            selector.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 20)); // wait for promise rejection
            results.errorOnFail = capturedError;
            
            console.warn = originalWarn;
            console.error = originalError;
            return results;
        });

        expect(result.warnOnNoSetup).to.include('WebRTCAdaptor not setup');
        expect(result.apiKeyAfterCancel).to.equal('key1');
        expect(result.errorOnFail).to.include('Failed to enable DeepAR effect: Effect failed');
    });
    
    it('should dynamically hide and show the API key button', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('deepar-effects-manager');
            const apiKeyButton = comp.shadowRoot.getElementById('set_apikey_button');

            const initialState = {
                buttonVisible: apiKeyButton.style.display !== 'none'
            };

            // hide button
            comp.setAttribute('hide-apikey-button', '');
            await new Promise(resolve => setTimeout(resolve, 20)); 

            const afterHide = {
                buttonVisible: apiKeyButton.style.display !== 'none'
            };

            // show button
            comp.removeAttribute('hide-apikey-button');
            await new Promise(resolve => setTimeout(resolve, 20));

            const afterShow = {
                buttonVisible: apiKeyButton.style.display !== 'none'
            };

            return { initialState, afterHide, afterShow };
        });

        expect(result.initialState.buttonVisible).to.be.true;
        expect(result.afterHide.buttonVisible).to.be.false;
        expect(result.afterShow.buttonVisible).to.be.true;
    });
}); 