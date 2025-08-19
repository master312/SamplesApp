const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('ToggleMicrophoneButton', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect media manager state', async function() {
        const result = await page.evaluate(async () => {
            const comp1 = await ComponentTestUtils.createTestComponent('toggle-microphone');
            const comp2 = await ComponentTestUtils.createTestComponent('toggle-microphone');
            
            // Test with unmuted media manager
            const mock1 = new MockWebRTCAdaptor();
            comp1.setup(mock1);
            
            // Test with muted media manager
            const mock2 = new MockWebRTCAdaptor();
            mock2.mediaManager.isMuted = true;
            comp2.setup(mock2);
            
            const button1 = comp1.shadowRoot.querySelector('#toggle-microphone-button');
            const icon1 = comp1.shadowRoot.querySelector('#microphone-icon');
            const button2 = comp2.shadowRoot.querySelector('#toggle-microphone-button');
            const icon2 = comp2.shadowRoot.querySelector('#microphone-icon');
            
            return {
                unmuted: {
                    exists: !!comp1,
                    tagName: comp1.tagName.toLowerCase(),
                    isMicOn: comp1.getIsMicOn(),
                    buttonTitle: button1.title,
                    buttonClass: button1.className,
                    iconSrc: icon1.src,
                    hasShadowRoot: !!comp1.shadowRoot
                },
                muted: {
                    isMicOn: comp2.getIsMicOn(),
                    buttonTitle: button2.title,
                    buttonClass: button2.className,
                    iconSrc: icon2.src
                }
            };
        });
        
        // unmuted
        expect(result.unmuted.exists).to.be.true;
        expect(result.unmuted.tagName).to.equal('toggle-microphone');
        expect(result.unmuted.hasShadowRoot).to.be.true;
        expect(result.unmuted.isMicOn).to.be.true;
        expect(result.unmuted.buttonTitle).to.equal('Mute Microphone');
        expect(result.unmuted.buttonClass).to.include('btn-primary');
        expect(result.unmuted.iconSrc).to.include('mic-fill.svg');
        
        // muted
        expect(result.muted.isMicOn).to.be.false;
        expect(result.muted.buttonTitle).to.equal('Unmute Microphone');
        expect(result.muted.buttonClass).to.include('btn-danger');
        expect(result.muted.iconSrc).to.include('mic-mute-fill.svg');
    });
    
    it('should toggle microphone state and call correct adaptor methods', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('toggle-microphone');
            const mock = new MockWebRTCAdaptor();
            
            // Track adaptor method calls
            const calls = [];
            const originalMute = mock.muteLocalMic;
            const originalUnmute = mock.unmuteLocalMic;
            
            mock.muteLocalMic = function() {
                calls.push('muteLocalMic');
                return originalMute.call(this);
            };
            
            mock.unmuteLocalMic = function() {
                calls.push('unmuteLocalMic');
                return originalUnmute.call(this);
            };
            
            comp.setup(mock);
            const button = comp.shadowRoot.querySelector('#toggle-microphone-button');
            const icon = comp.shadowRoot.querySelector('#microphone-icon');
            
            // Initial state
            const initial = {
                isMicOn: comp.getIsMicOn(),
                buttonTitle: button.title,
                buttonClass: button.className,
                iconSrc: icon.src
            };
            
            // Click to mute
            button.click();
            const afterMute = {
                isMicOn: comp.getIsMicOn(),
                buttonTitle: button.title,
                buttonClass: button.className,
                iconSrc: icon.src
            };
            
            // Toggle back to unmuted
            comp.toggleMicrophone();
            const afterUnmute = {
                isMicOn: comp.getIsMicOn(),
                buttonTitle: button.title,
                buttonClass: button.className,
                iconSrc: icon.src
            };
            
            return { initial, afterMute, afterUnmute, calls };
        });
        
        // Unmuted (initial sttate)
        expect(result.initial.isMicOn).to.be.true;
        expect(result.initial.buttonTitle).to.equal('Mute Microphone');
        expect(result.initial.buttonClass).to.include('btn-primary');
        expect(result.initial.iconSrc).to.include('mic-fill.svg');
        
        // After mute
        expect(result.afterMute.isMicOn).to.be.false;
        expect(result.afterMute.buttonTitle).to.equal('Unmute Microphone');
        expect(result.afterMute.buttonClass).to.include('btn-danger');
        expect(result.afterMute.iconSrc).to.include('mic-mute-fill.svg');
        
        // After unmute
        expect(result.afterUnmute.isMicOn).to.be.true;
        expect(result.afterUnmute.buttonTitle).to.equal('Mute Microphone');
        expect(result.afterUnmute.buttonClass).to.include('btn-primary');
        expect(result.afterUnmute.iconSrc).to.include('mic-fill.svg');
        
        expect(result.calls).to.deep.equal(['muteLocalMic', 'unmuteLocalMic']);
    });
    
    it('should handle missing or null adaptor gracefully', async function() {
        const result = await page.evaluate(async () => {
            try {
                const comp1 = await ComponentTestUtils.createTestComponent('toggle-microphone');
                const comp2 = await ComponentTestUtils.createTestComponent('toggle-microphone');
                
                // Test without setup
                comp1.toggleMicrophone();
                const noSetupState = comp1.getIsMicOn();
                
                // Test with null setup
                comp2.setup(null);
                comp2.toggleMicrophone();
                const nullSetupState = comp2.getIsMicOn();
                
                return {
                    noError: true,
                    noSetupState,
                    nullSetupState
                };
            } catch (error) {
                return {
                    noError: false,
                    error: error.message
                };
            }
        });
        
        expect(result.noError).to.be.true;
        expect(result.noSetupState).to.be.false;
        expect(result.nullSetupState).to.be.false;
    });
}); 