const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('DataChannelFileShare', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
        
        // Add helper function to browser's global context once
        await page.evaluate(() => {
            window.createFilePacket = (filename, content) => {
                const filenameBytes = new TextEncoder().encode(filename);
                const fileBytes = new TextEncoder().encode(content);
                const packet = new ArrayBuffer(4 + filenameBytes.length + fileBytes.length);
                const view = new DataView(packet);
                const uint8View = new Uint8Array(packet);
                view.setUint32(0, filenameBytes.length, true);
                uint8View.set(filenameBytes, 4);
                uint8View.set(fileBytes, 4 + filenameBytes.length);
                return packet;
            };
        });
    });
    
    afterEach(async function() {
        await page.evaluate(() => ComponentTestUtils.cleanupComponents());
    });
    
    it('should create component with basic elements', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const shadowRoot = comp.shadowRoot;
            
            return {
                exists: !!comp,
                hasUploadButton: !!shadowRoot.getElementById('upload-button'),
                hasFileInput: !!shadowRoot.getElementById('file-input'),
                hasFileList: !!shadowRoot.getElementById('file-list'),
                hasOfflineMessage: !!shadowRoot.getElementById('offline-message'),
                hasStatusBadge: !!shadowRoot.getElementById('status-badge')
            };
        });
        
        expect(result.exists).to.be.true;
        expect(result.hasUploadButton).to.be.true;
        expect(result.hasFileInput).to.be.true;
        expect(result.hasFileList).to.be.true;
        expect(result.hasOfflineMessage).to.be.true;
        expect(result.hasStatusBadge).to.be.true;
    });
    
    it('should show offline state initially and enable when stream starts', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            const shadowRoot = comp.shadowRoot;
            const initialState = {
                offlineVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                fileContentVisible: shadowRoot.getElementById('file-content').style.display === 'none',
                uploadDisabled: shadowRoot.getElementById('upload-button').disabled
            };
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const enabledState = {
                offlineVisible: shadowRoot.getElementById('offline-message').style.display !== 'none',
                fileContentVisible: shadowRoot.getElementById('file-content').style.display !== 'none',
                uploadDisabled: shadowRoot.getElementById('upload-button').disabled
            };
            
            return { initialState, enabledState };
        });
        
        expect(result.initialState.offlineVisible).to.be.true;
        expect(result.initialState.fileContentVisible).to.be.true; // file-content is hidden initially
        expect(result.initialState.uploadDisabled).to.be.true; // upload button is disabled when offline
        
        expect(result.enabledState.offlineVisible).to.be.false;
        expect(result.enabledState.fileContentVisible).to.be.true;
        expect(result.enabledState.uploadDisabled).to.be.false;
    });
    
    it('should handle custom stream ID with correct and incorrect events', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock, 'custom-stream-123');
            
            const shadowRoot = comp.shadowRoot;
            
            mock.triggerEvent('publish_started', { streamId: 'wrong-stream' });
            const wrongStreamState = !shadowRoot.getElementById('upload-button').disabled;
            
            mock.triggerEvent('publish_started', { streamId: 'custom-stream-123' });
            const correctStreamState = !shadowRoot.getElementById('upload-button').disabled;
            
            return { wrongStreamState, correctStreamState };
        });
        
        expect(result.wrongStreamState).to.be.true; // Still enabled with custom stream ID
        expect(result.correctStreamState).to.be.true;
    });
    
    it('should set stream ID dynamically and ignore auto-set', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            comp.setStreamId('dynamic-stream');
            
            mock.triggerEvent('publish_started', { streamId: 'other-stream' });
            const enabledAfterStart = !comp.shadowRoot.getElementById('upload-button').disabled;
            
            mock.triggerEvent('publish_finished', { streamId: 'other-stream' });
            const enabledAfterStop = !comp.shadowRoot.getElementById('upload-button').disabled;
            
            return { enabledAfterStart, enabledAfterStop };
        });
        
        expect(result.enabledAfterStart).to.be.true;
        expect(result.enabledAfterStop).to.be.true; // Should stay enabled with custom stream ID
    });
    
    it('should process files and detect image vs non-image types', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            mock.triggerEvent('data_received', { 
                streamId: 'test-stream', 
                data: window.createFilePacket('image.png', 'fake png data')
            });
            
            mock.triggerEvent('data_received', { 
                streamId: 'test-stream', 
                data: window.createFilePacket('document.pdf', 'fake pdf data')
            });
            
            const fileList = comp.shadowRoot.getElementById('file-list');
            return {
                hasFiles: fileList.children.length === 2,
                hasImagePreview: fileList.innerHTML.includes('file-image'),
                hasFileIcon: fileList.innerHTML.includes('file-earmark.svg'),
                hasDownloadButton: fileList.innerHTML.includes('download-button')
            };
        });
        
        expect(result.hasFiles).to.be.true;
        expect(result.hasImagePreview).to.be.true;
        expect(result.hasFileIcon).to.be.true;
        expect(result.hasDownloadButton).to.be.true;
    });
    
    it('should emit file-received event with correct data', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            let receivedEvent = null;
            comp.addEventListener('file-received', (e) => {
                receivedEvent = e.detail;
            });
            
            mock.triggerEvent('data_received', { 
                streamId: 'test-stream', 
                data: window.createFilePacket('test.txt', 'Hello World!')
            });
            
            return {
                eventFired: !!receivedEvent,
                filename: receivedEvent?.filename,
                size: receivedEvent?.size
            };
        });
        
        expect(result.eventFired).to.be.true;
        expect(result.filename).to.equal('test.txt');
        expect(result.size).to.equal(12); // "Hello World!" length
    });
    
    it('should handle empty message state correctly', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            const emptyMessage = comp.shadowRoot.getElementById('empty-message');
            const emptyState = emptyMessage.style.display !== 'none';
            
            mock.triggerEvent('data_received', { 
                streamId: 'test-stream', 
                data: window.createFilePacket('test.txt', 'Hello World!')
            });
            
            const withFilesState = emptyMessage.style.display !== 'none';
            
            return { emptyState, withFilesState };
        });
        
        expect(result.emptyState).to.be.true;
        expect(result.withFilesState).to.be.false;
    });
    
    it('should validate stream ID security and handle errors', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock, 'correct-stream');
            
            let errorEvent = null;
            comp.addEventListener('error', (e) => {
                errorEvent = e.detail;
            });
            
            mock.triggerEvent('data_received', { 
                streamId: 'wrong-stream', 
                data: window.createFilePacket('test.txt', 'Hello World!')
            });
            
            const wrongStreamFiles = comp.shadowRoot.getElementById('file-list').children.length;
            
            mock.triggerEvent('data_received', { 
                streamId: 'correct-stream', 
                data: window.createFilePacket('test.txt', 'Hello World!')
            });
            
            const correctStreamFiles = comp.shadowRoot.getElementById('file-list').children.length;
            
            const malformedData = new ArrayBuffer(2);
            mock.triggerEvent('data_received', { 
                streamId: 'correct-stream', 
                data: malformedData 
            });
            
            return { 
                wrongStreamFiles, 
                correctStreamFiles,
                errorFired: !!errorEvent,
                errorMessage: errorEvent?.message
            };
        });
        
        expect(result.wrongStreamFiles).to.equal(0);
        expect(result.correctStreamFiles).to.equal(1);
        expect(result.errorFired).to.be.true;
        expect(result.errorMessage).to.include('Failed to process received file');
    });
    
    it('should handle UI interactions and file sending errors', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            let fileInputClicked = false;
            const fileInput = comp.shadowRoot.getElementById('file-input');
            fileInput.click = () => { fileInputClicked = true; };

            let errorEvent = null;
            comp.addEventListener('error', (e) => {
                errorEvent = e.detail;
            });
            
            comp.shadowRoot.getElementById('upload-button').click();

            const originalFileReader = window.FileReader;
            window.FileReader = class {
                readAsArrayBuffer() {
                    setTimeout(() => {
                        this.onerror();
                    }, 0);
                }
                set onerror(fn) { this._onerror = fn; }
                get onerror() { return this._onerror; }
                get error() { return new Error('Mock file read error'); }
            };
            
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            comp._sendFile(mockFile);
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            window.FileReader = originalFileReader;
            
            mock.triggerEvent('publish_finished');
            const disabledAfterStop = comp.shadowRoot.getElementById('upload-button').disabled;
            
            return {
                fileInputClicked,
                disabledAfterStop,
                errorFired: !!errorEvent,
                errorMessage: errorEvent?.message
            };
        });
        
        expect(result.fileInputClicked).to.be.true;
        expect(result.disabledAfterStop).to.be.true;
        expect(result.errorFired).to.be.true;
        expect(result.errorMessage).to.include('Failed to read file');
    });
    
    it('should handle download functionality', async function() {
        const result = await page.evaluate(async () => {
            const comp = await ComponentTestUtils.createTestComponent('data-channel-file-share');
            const mock = new MockWebRTCAdaptor();
            comp.setup(mock);
            
            mock.triggerEvent('publish_started', { streamId: 'test-stream' });
            
            mock.triggerEvent('data_received', { 
                streamId: 'test-stream', 
                data: window.createFilePacket('download-test.txt', 'Download me!')
            });
            
            let downloadTriggered = false;
            const originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                if (tag === 'a') {
                    return {
                        href: '',
                        download: '',
                        click: () => { downloadTriggered = true; }
                    };
                }
                return originalCreateElement.call(document, tag);
            };
            
            const originalAppendChild = document.body.appendChild;
            const originalRemoveChild = document.body.removeChild;
            document.body.appendChild = () => {};
            document.body.removeChild = () => {};
            
            const downloadButton = comp.shadowRoot.querySelector('.download-button');
            downloadButton.click();
            
            document.createElement = originalCreateElement;
            document.body.appendChild = originalAppendChild;
            document.body.removeChild = originalRemoveChild;
            
            return { downloadTriggered };
        });
        
        expect(result.downloadTriggered).to.be.true;
    });
}); 