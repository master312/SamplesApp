const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('VirtualBackgroundManager', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
        
        // Mock stuff on browser side
        await page.evaluate(() => {
            window.VideoEffect = {
                NO_EFFECT: "no-effect",
                BLUR_BACKGROUND: "blur-background", 
                VIRTUAL_BACKGROUND: "virtual-background"
            };
            
            // Helper to create real image file from canvas
            window.createTestImageFile = function() {
                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                const ctx = canvas.getContext('2d');
                
                // Draw a simple test pattern
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(0, 0, 50, 50);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(50, 0, 50, 50);
                return new Promise(resolve => {
                    canvas.toBlob(blob => {
                        const file = new File([blob], 'test-image.png', { type: 'image/png' });
                        resolve(file);
                    }, 'image/png');
                });
            };
        });
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect setup state correctly', async function() {
        const result = await page.evaluate(async () => {
            const comp1 = await ComponentTestUtils.createTestComponent('virtual-background-manager');
            const comp2 = await ComponentTestUtils.createTestComponent('virtual-background-manager', { 'disable-upload': 'true' });
            
            const mock = new MockWebRTCAdaptor();
            mock.setBlurEffectRange = function() {};
            mock.setBackgroundImage = function() {};
            mock.enableEffect = function() { return Promise.resolve(); };
            
            comp1.setup(mock);
            
            const backgroundOptions = comp1.shadowRoot.querySelectorAll('.background-option');
            const uploadVisible1 = comp1.shadowRoot.getElementById('custom-background-container').style.display !== 'none';
            const uploadVisible2 = comp2.shadowRoot.getElementById('custom-background-container').style.display !== 'none';
            const noneSelected = comp1.shadowRoot.querySelector('[data-effect="none"]').classList.contains('selected');
            
            return {
                exists: !!comp1,
                tagName: comp1.tagName.toLowerCase(),
                hasShadowRoot: !!comp1.shadowRoot,
                optionsCount: backgroundOptions.length,
                uploadVisible1,
                uploadVisible2,
                noneSelected,
                adaptorSet: comp1._webRTCAdaptor === mock
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('virtual-background-manager');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.optionsCount).to.equal(4); // none, slight-blur, blur, custom
        expect(result.uploadVisible1).to.be.true;
        expect(result.uploadVisible2).to.be.false;
        expect(result.noneSelected).to.be.true;
        expect(result.adaptorSet).to.be.true;
    });
    
    it('should handle background selection and apply effects correctly', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('virtual-background-manager');
            
            const mock = new MockWebRTCAdaptor();
            const effectsApplied = [];
            const blurRanges = [];
            
            mock.setBlurEffectRange = function(min, max) { 
                blurRanges.push({ min, max });
            };

            mock.enableEffect = function(effectName) { 
                effectsApplied.push(effectName);
                return Promise.resolve();
            };
            
            comp.setup(mock);
            
            const noneOption = comp.shadowRoot.querySelector('[data-effect="none"]');
            const blurOption = comp.shadowRoot.querySelector('[data-effect="blur"]');
            const slightBlurOption = comp.shadowRoot.querySelector('[data-effect="slight-blur"]');
            
            // Test blur -> slight blur -> none selection flow
            blurOption.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            
            slightBlurOption.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            
            noneOption.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Check visual selection state
            const finalSelected = comp.shadowRoot.querySelector('.background-option.selected').dataset.effect;
            
            return {
                effectsApplied,
                blurRanges,
                finalSelected
            };
        });
        
        expect(result.effectsApplied).to.deep.equal([
            'blur-background',
            'blur-background',
            'no-effect'
        ]);
        // Blur and slight blur added. TODO: Maybe check specific values?
        expect(result.blurRanges).to.have.length.at.least(2);
        expect(result.finalSelected).to.equal('none');
    });
    
    it('should handle custom background upload and programmatic image addition', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('virtual-background-manager');
            
            const mock = new MockWebRTCAdaptor();
            let backgroundImages = [];
            let effectsApplied = [];
            
            mock.setBackgroundImage = function(img) { 
                backgroundImages.push(img.src);
            };

            mock.enableEffect = function(effectName) { 
                effectsApplied.push(effectName);
                return Promise.resolve();
            };
            
            comp.setup(mock);
            
            comp.addBackgroundImage('Test BG', 'test-bg-url.jpg');
            const addedOption = comp.shadowRoot.querySelector('[data-effect="background"]');
            const addedImg = addedOption?.querySelector('img');
            const addedSpan = addedOption?.querySelector('span');
            
            // Test file upload with real canvas-generated image
            const testFile = await createTestImageFile();
            const fileInput = comp.shadowRoot.getElementById('custom-background-input');
            
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false
            });
            
            fileInput.dispatchEvent(new Event('change'));
            
            // Wait for FileReader and Image loading to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const uploadSelected = comp.shadowRoot.getElementById('custom-background-container').classList.contains('selected');
            
            return {
                backgroundImages,
                effectsApplied,
                addedImgSrc: addedImg?.src,
                addedSpanText: addedSpan?.textContent,
                uploadSelected,
                testFileSize: testFile.size,
                testFileType: testFile.type
            };
        });
        
        expect(result.addedImgSrc).to.include('test-bg-url.jpg');
        expect(result.addedSpanText).to.equal('Test BG');
        expect(result.uploadSelected).to.be.true;
        expect(result.backgroundImages).to.have.length(1);
        expect(result.backgroundImages[0]).to.include('data:image/png;base64,'); // Real canvas data
        expect(result.effectsApplied).to.deep.equal(['virtual-background']);
        expect(result.testFileSize).to.be.greaterThan(0);
        expect(result.testFileType).to.equal('image/png');
    });
    
    it('should handle errors and missing adaptor gracefully', async function() {
        const result = await page.evaluate(async () => {
            const comp1 = await ComponentTestUtils.createTestComponent('virtual-background-manager');
            const comp2 = await ComponentTestUtils.createTestComponent('virtual-background-manager');
            
            let errorEvents = [];
            comp2.addEventListener('error', (e) => {
                errorEvents.push({
                    type: e.type,
                    message: e.detail.message,
                    bubbles: e.bubbles,
                    composed: e.composed
                });
            });
            
            // Test clicking without setup
            const noneOption1 = comp1.shadowRoot.querySelector('[data-effect="none"]');
            noneOption1.click();
            
            // Test with adaptor that rejects promises
            const mockWithErrors = new MockWebRTCAdaptor();
            mockWithErrors.setBlurEffectRange = function() {};
            mockWithErrors.enableEffect = function() { 
                return Promise.reject(new Error('Effect failed'));
            };
            
            comp2.setup(mockWithErrors);
            const blurOption2 = comp2.shadowRoot.querySelector('[data-effect="blur"]');
            blurOption2.click();
            
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // Test null setup (should log error but not crash)
            let consoleErrors = [];
            const originalError = console.error;
            console.error = function(msg) { consoleErrors.push(msg); };
            
            try {
                comp1.setup(null);
                return {
                    noError: true,
                    errorEvents,
                    consoleErrors
                };
            } finally {
                console.error = originalError;
            }
        });
        
        expect(result.noError).to.be.true;
        expect(result.errorEvents).to.have.length(1);
        expect(result.errorEvents[0].type).to.equal('error');
        expect(result.errorEvents[0].message).to.include('Failed to apply');
        expect(result.errorEvents[0].bubbles).to.be.true;
        expect(result.errorEvents[0].composed).to.be.true;
        expect(result.consoleErrors).to.have.length(1);
        expect(result.consoleErrors[0]).to.include('WebRTCAdaptor instance is required');
    });
}); 