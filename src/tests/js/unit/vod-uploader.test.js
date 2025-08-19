const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('VodUploader', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
        
        await page.evaluate(() => {
            // Create small blob but override size property for testing
            window.createMockFile = (name, size, type) => {
                const file = new Blob(['mock file content'], { type });
                
                // Override properties to match what we test
                Object.defineProperty(file, 'name', { value: name, writable: false });
                Object.defineProperty(file, 'size', { value: size, writable: false });
                Object.defineProperty(file, 'lastModified', { value: Date.now(), writable: false });                
                return file;
            };
        });
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component and reflect initial state', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('vod-uploader');
            comp.setBackendUrl('http://test-server.com');
            
            const fileInput = comp.shadowRoot.getElementById('file-input');
            const uploadSection = comp.shadowRoot.getElementById('upload-section');
            
            return {
                exists: !!comp,
                tagName: comp.tagName.toLowerCase(),
                hasShadowRoot: !!comp.shadowRoot,
                acceptAttribute: fileInput.getAttribute('accept'),
                uploadSectionHidden: uploadSection.style.display === 'none' || !uploadSection.style.display,
                backendUrl: comp._backendUrl
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.tagName).to.equal('vod-uploader');
        expect(result.hasShadowRoot).to.be.true;
        expect(result.acceptAttribute).to.include('video/mp4');
        expect(result.uploadSectionHidden).to.be.true;
        expect(result.backendUrl).to.equal('http://test-server.com');
    });
    
    it('should validate files and handle selection correctly', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('vod-uploader');

            let errorEvents = [];
            comp.addEventListener('error', (e) => {
                errorEvents.push(e.detail.name);
            });
            
            // Valid file selection
            const validFile = createMockFile('test.mp4', 1024 * 1024, 'video/mp4');
            // console.log('Testing valid file:', validFile.name, validFile.size);
            comp._handleFileSelect(validFile);
            
            const validResult = {
                selectedFileName: comp._selectedFile?.name,
                vodNameValue: comp.shadowRoot.getElementById('vod-name-input').value,
                uploadSectionVisible: comp.shadowRoot.getElementById('upload-section').style.display === 'block'
            };
            // console.log('Valid file result:', validResult);
            
            // Invalid file type test
            const invalidFile = createMockFile('test.txt', 1024, 'text/plain');
            // console.log('Testing invalid file type:', invalidFile.name);
            comp._handleFileSelect(invalidFile);
            // console.log('Error events after invalid file:', errorEvents);
            
            // File too large test
            const largeFile = createMockFile('large.mp4', 600 * 1024 * 1024, 'video/mp4');
            // console.log('Testing large file:', largeFile.name, largeFile.size);
            comp._handleFileSelect(largeFile);
            // console.log('Error events after large file:', errorEvents);
            
            return {
                ...validResult,
                errorEvents,
                hasUnsupportedTypeError: errorEvents.includes('unsupportedFileType'),
                hasFileSizeError: errorEvents.includes('fileSizeExceeded')
            };
        });
        
        expect(result.selectedFileName).to.equal('test.mp4');
        expect(result.vodNameValue).to.equal('test.mp4');
        expect(result.uploadSectionVisible).to.be.true;
        expect(result.hasUnsupportedTypeError).to.be.true;
        expect(result.hasFileSizeError).to.be.true;
    });
    
    it('should handle missing configuration and reset functionality', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('vod-uploader');
            
            let errorFired = false;
            comp.addEventListener('error', (e) => {
                if (e.detail.name === 'missingConfiguration') errorFired = true;
            });
            
            // Try upload without backend URL
            const file = createMockFile('test.mp4', 1024, 'video/mp4');
            comp._handleFileSelect(file);
            comp.shadowRoot.getElementById('vod-name-input').value = 'Test';
            
            await comp._handleUpload();
            
            // Test reset functionality
            comp._resetUploader();
            
            return {
                errorFired,
                selectedFileAfterReset: comp._selectedFile,
                uploadSectionVisible: comp.shadowRoot.getElementById('upload-section').style.display === 'block',
                vodNameAfterReset: comp.shadowRoot.getElementById('vod-name-input').value
            };
        });
        
        expect(result.errorFired).to.be.true;
        expect(result.selectedFileAfterReset).to.be.null;
        expect(result.uploadSectionVisible).to.be.false;
        expect(result.vodNameAfterReset).to.equal('');
    });
}); 