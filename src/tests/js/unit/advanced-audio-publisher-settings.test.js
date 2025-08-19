const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');
const MockWebRTCAdaptor = require('../common/webrtc-adaptor-mock.js');

describe('AdvancedAudioPublisherSettings', function() {
    let page;

    before(async function() {
        page = global.testPage;
    });

    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });

    it('should create the component and set initial default states', async function() {
        const initialState = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-audio-publisher-settings');
            const shadowRoot = comp.shadowRoot;

            return {
                noiseSuppression: shadowRoot.getElementById('noise-suppression').checked,
                echoCancellation: shadowRoot.getElementById('echo-cancellation').checked,
                micGainValue: shadowRoot.getElementById('mic-gain').value,
                micGainText: shadowRoot.getElementById('gain-value').textContent,
            };
        });

        expect(initialState.noiseSuppression).to.be.true;
        expect(initialState.echoCancellation).to.be.true;
        expect(initialState.micGainValue).to.equal('1');
        expect(initialState.micGainText).to.equal('100%');
    });

    it('should call applyConstraints when audio processing settings are changed', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-audio-publisher-settings');
            const mock = new MockWebRTCAdaptor();

            // Mock the specific methods needed for this test
            window.lastConstraints = null;
            mock.applyConstraints = (constraints) => {
                window.lastConstraints = constraints;
                return Promise.resolve();
            };
            comp.setup(mock);

            const noiseSuppressionCheckbox = comp.shadowRoot.getElementById('noise-suppression');
            const echoCancellationCheckbox = comp.shadowRoot.getElementById('echo-cancellation');

            // check noise Suppression off
            noiseSuppressionCheckbox.checked = false;
            noiseSuppressionCheckbox.dispatchEvent(new Event('change'));
            const constraintsAfterNoiseOff = { ...window.lastConstraints.audio };

            // check echo Cancellation off
            echoCancellationCheckbox.checked = false;
            echoCancellationCheckbox.dispatchEvent(new Event('change'));
            const constraintsAfterEchoOff = { ...window.lastConstraints.audio };
            
            delete window.lastConstraints;
            return { constraintsAfterNoiseOff, constraintsAfterEchoOff };
        });

        expect(result.constraintsAfterNoiseOff).to.deep.equal({
            noiseSuppression: false,
            echoCancellation: true
        });
        expect(result.constraintsAfterEchoOff).to.deep.equal({
            noiseSuppression: false,
            echoCancellation: false
        });
    });

    it('should call setVolumeLevel when microphone gain is adjusted', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-audio-publisher-settings');
            const mock = new MockWebRTCAdaptor();
            
            window.lastVolume = null;
            mock.setVolumeLevel = (value) => {
                window.lastVolume = value;
            };
            comp.setup(mock);

            const gainSlider = comp.shadowRoot.getElementById('mic-gain');
            gainSlider.value = '0.32';
            gainSlider.dispatchEvent(new Event('input'));

            const gainValue = window.lastVolume;
            const gainText = comp.shadowRoot.getElementById('gain-value').textContent;
            
            delete window.lastVolume;
            return { gainValue, gainText };
        });

        expect(result.gainValue).to.equal('0.32');
        expect(result.gainText).to.equal('32%');
    });
    
    it('should apply current settings automatically when publish starts', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('advanced-audio-publisher-settings', {
                'apply-delay-ms': '500'
            });
            const mock = new MockWebRTCAdaptor();

            window.constraintsApplied = false;
            mock.applyConstraints = (constraints) => {
                window.constraintsApplied = true;
                return Promise.resolve();
            };
            comp.setup(mock);

            // Simulate publish starting
            mock.triggerEvent('publish_started');

            // Wait for the internal setTimeout
            await new Promise(resolve => setTimeout(resolve, 550));
            
            const applied = window.constraintsApplied;
            delete window.constraintsApplied;
            return applied;
        });

        expect(result).to.be.true;
    });
}); 