const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('ToggleCameraButton', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    describe('Initialization', function() {
        it('should create component', async function() {
            const result = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                const mock = new MockWebRTCAdaptor();
                comp.setup(mock);
                
                return {
                    exists: !!comp,
                    tagName: comp.tagName.toLowerCase(),
                    isCameraOn: comp.isCameraOn
                };
            });
            
            expect(result.exists).to.be.true;
            expect(result.tagName).to.equal('toggle-camera');
            expect(result.isCameraOn).to.be.true;
        });
        
        it('should have shadow DOM', async function() {
            const hasShadowRoot = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                return !!comp.shadowRoot;
            });
            
            expect(hasShadowRoot).to.be.true;
        });
        
        it('should display correct initial UI', async function() {
            const buttonTitle = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                const button = comp.shadowRoot.querySelector('#toggle-camera-button');
                return button ? button.title : null;
            });
            
            expect(buttonTitle).to.equal('Disable Camera');
        });

        it('should reflect initial camera state from media manager', async function() {
            const result = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                const mock = new MockWebRTCAdaptor();
                
                // Set camera as disabled in media manager
                mock.mediaManager.cameraEnabled = false;
                comp.setup(mock);
                
                const button = comp.shadowRoot.querySelector('#toggle-camera-button');
                const icon = comp.shadowRoot.querySelector('#camera-icon');
                
                return {
                    isCameraOn: comp.isCameraOn,
                    buttonTitle: button.title,
                    buttonClass: button.className,
                    iconSrc: icon.src,
                };
            });
            
            expect(result.isCameraOn).to.be.false;
            expect(result.buttonTitle).to.equal('Enable Camera');
            expect(result.buttonClass).to.include('btn-danger');
            expect(result.iconSrc).to.include('camera-video-off-fill.svg');
        });
    });
    
    describe('Camera Toggle', function() {
        it('should toggle camera state when clicked', async function() {
            const result = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                const mock = new MockWebRTCAdaptor();
                comp.setup(mock);
                
                const button = comp.shadowRoot.querySelector('#toggle-camera-button');
                button.click();
                
                return {
                    isCameraOn: comp.isCameraOn,
                    buttonTitle: button.title
                };
            });
            
            expect(result.isCameraOn).to.be.false;
            expect(result.buttonTitle).to.equal('Enable Camera');
        });
        
        it('should toggle back to on', async function() {
            const isCameraOn = await page.evaluate(async () => {
                const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                const mock = new MockWebRTCAdaptor();
                comp.setup(mock);
                
                comp.toggleCamera();
                comp.toggleCamera();
                return comp.isCameraOn;
            });
            
            expect(isCameraOn).to.be.true;
        });
    });
    
    describe('Error Handling', function() {
        it('should handle missing adaptor gracefully', async function() {
            const noError = await page.evaluate(async () => {
                try {
                    const comp = await ComponentTestUtils.createTestComponent('toggle-camera');
                    comp.toggleCamera();
                    return true;
                } catch (error) {
                    console.error(error);
                    return false;
                }
            });
            
            expect(noError).to.be.true;
        });
    });
}); 