const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('VodBrowser', function() {
    let page;
    
    before(async function() {
        page = global.testPage;
        
        await page.evaluate(() => {
            window.fetchMock.install();
            window.originalConfirm = window.confirm;
            window.confirm = () => true; // Always confirm for tests
        });
    });
    
    after(async function() {
        await page.evaluate(() => {
            window.fetchMock.uninstall();
            window.confirm = window.originalConfirm;
        });
    });
    
    afterEach(async function() {
        await page.evaluate(() => {
            ComponentTestUtils.cleanupComponents();
            window.fetchMock.clearMocks();
        });
    });
    
    it('should create component and handle initial state and attributes', async function() {
        const result = await page.evaluate(async () => {
            window.fetchMock.mock('http://test-server.com/rest/v2/vods/list/0/200', {
                ok: true,
                data: [{ vodId: 'vod1', vodName: 'Test Video', creationDate: 1640995200000, duration: 120000 }]
            });
            
            const comp = await ComponentTestUtils.createTestComponent('vod-browser', {
                'backend-url': 'http://test-server.com',
                'page-size': '5',
                'disable-delete': 'true'
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const pageIndicator = comp.shadowRoot.getElementById('page-indicator');
            const prevButton = comp.shadowRoot.getElementById('prev-button');
            const nextButton = comp.shadowRoot.getElementById('next-button');
            const vodList = comp.shadowRoot.getElementById('vod-list');
            const deleteButton = vodList.querySelector('.delete-button');
            
            return {
                tagName: comp.tagName.toLowerCase(),
                backendUrl: comp._backendUrl,
                pageSize: comp.pageSize,
                currentPage: comp._currentPage,
                pageIndicatorText: pageIndicator.textContent,
                prevButtonDisabled: prevButton.disabled,
                nextButtonDisabled: nextButton.disabled,
                hasDeleteButton: !!deleteButton
            };
        });
        
        expect(result.tagName).to.equal('vod-browser');
        expect(result.backendUrl).to.equal('http://test-server.com');
        expect(result.pageSize).to.equal(5);
        expect(result.currentPage).to.equal(0);
        expect(result.pageIndicatorText).to.equal('Page 1 of 1');
        expect(result.prevButtonDisabled).to.be.true;
        expect(result.nextButtonDisabled).to.be.true;
        expect(result.hasDeleteButton).to.be.false; // Verify disable-delete works
    });
    
    it('should fetch and display VODs with pagination and search functionality', async function() {
        const result = await page.evaluate(async () => {
            const mockVods = [
                { vodId: 'vod1', vodName: 'Test Video 1', creationDate: 1640995200000, duration: 120000, previewFilePath: 'previews/vod1.jpg' },
                { vodId: 'vod2', vodName: 'Test Video 2', creationDate: 1640995300000, duration: 180000 },
                { vodId: 'vod3', vodName: 'Another Video', creationDate: 1640995400000, duration: 90000, previewFilePath: 'previews/vod3.png' }
            ];
            
            window.fetchMock.mock('http://test-server.com/rest/v2/vods/list/0/200', {
                ok: true,
                data: mockVods
            });
            
            const comp = await ComponentTestUtils.createTestComponent('vod-browser', {
                'backend-url': 'http://test-server.com',
                'page-size': '2'
            });
            
            // Wait for initial fetch
            await new Promise(resolve => setTimeout(resolve, 20));
            
            const vodList = comp.shadowRoot.getElementById('vod-list');
            const pageIndicator = comp.shadowRoot.getElementById('page-indicator');
            const nextButton = comp.shadowRoot.getElementById('next-button');
            
            const initialState = {
                vodCount: vodList.children.length,
                pageText: pageIndicator.textContent,
                nextEnabled: !nextButton.disabled,
                firstVodName: vodList.children[0]?.querySelector('.vod-name')?.textContent
            };
            
            // Test pagination - go to next page
            nextButton.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const afterPagination = {
                vodCount: vodList.children.length,
                pageText: pageIndicator.textContent,
                firstVodName: vodList.children[0]?.querySelector('.vod-name')?.textContent
            };
            
            // Test search functionality
            const searchInput = comp.shadowRoot.getElementById('search-input');
            searchInput.value = 'Test';
            searchInput.dispatchEvent(new Event('input'));
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const afterSearch = {
                vodCount: vodList.children.length,
                pageText: pageIndicator.textContent,
                firstVodName: vodList.children[0]?.querySelector('.vod-name')?.textContent
            };
            
            // Test thumbnail handling - with and without previewFilePath
            const firstVodImg = vodList.children[0]?.querySelector('.vod-thumbnail img');
            const secondVodImg = vodList.children[1]?.querySelector('.vod-thumbnail img');
            
            const thumbnailTest = {
                firstVodHasThumbnail: firstVodImg?.src.includes('previews/vod1.jpg'),
                secondVodUsesPlaceholder: secondVodImg?.src.includes('video-placeholder.png'),
                firstVodSrcContainsBackendUrl: firstVodImg?.src.includes('http://test-server.com')
            };
            
            return {
                allVodsLoaded: comp._allVods.length === 3,
                initialState,
                afterPagination,
                afterSearch,
                thumbnailTest
            };
        });
        
        expect(result.allVodsLoaded).to.be.true;
        expect(result.initialState.vodCount).to.equal(2);
        expect(result.initialState.pageText).to.equal('Page 1 of 2');
        expect(result.initialState.nextEnabled).to.be.true;
        expect(result.initialState.firstVodName).to.equal('Test Video 1');
        
        expect(result.afterPagination.vodCount).to.equal(1);
        expect(result.afterPagination.pageText).to.equal('Page 2 of 2');
        expect(result.afterPagination.firstVodName).to.equal('Another Video');
        
        expect(result.afterSearch.vodCount).to.equal(2);
        expect(result.afterSearch.pageText).to.equal('Page 1 of 1');
        expect(result.afterSearch.firstVodName).to.equal('Test Video 1');
        
        expect(result.thumbnailTest.firstVodHasThumbnail).to.be.true;
        expect(result.thumbnailTest.secondVodUsesPlaceholder).to.be.true;
        expect(result.thumbnailTest.firstVodSrcContainsBackendUrl).to.be.true;
    });
    

    it('should handle VOD interactions, refresh, and empty states', async function() {
        const result = await page.evaluate(async () => {
            const initialMockVods = [
                { vodId: 'vod1', vodName: 'Initial Video', creationDate: 1640995200000, duration: 120000 }
            ];
            const refreshedMockVods = [
                { vodId: 'vod2', vodName: 'Refreshed Video', creationDate: 1640995300000, duration: 180000 }
            ];

            // Setup initial and refreshed data fetches
            window.fetchMock.mock('http://test-server.com/rest/v2/vods/list/0/200', { ok: true, data: initialMockVods });
            window.fetchMock.mock('http://refreshed-server.com/rest/v2/vods/list/0/200', { ok: true, data: refreshedMockVods });
            window.fetchMock.mock('http://empty-server.com/rest/v2/vods/list/0/200', { ok: true, data: [] });

            // Mock successful delete
            window.fetchMock.mock('http://test-server.com/rest/v2/vods/vod1', { ok: true, data: null });

            const comp = await ComponentTestUtils.createTestComponent('vod-browser', { 'backend-url': 'http://test-server.com' });
            await new Promise(resolve => setTimeout(resolve, 20));

            let selectedVod = null;
            let deletedVod = null;
            comp.addEventListener('vod-selected', (e) => { selectedVod = e.detail.vod; });
            comp.addEventListener('vod-deleted', (e) => { deletedVod = e.detail.vod; });

            const vodList = comp.shadowRoot.getElementById('vod-list');
            
            // 1. Test VOD selection
            vodList.querySelector('.vod-item').click();
            await new Promise(resolve => setTimeout(resolve, 10));
            const selectionResult = { ...selectedVod };

            // 2. Test VOD deletion
            vodList.querySelector('.delete-button').click();
            await new Promise(resolve => setTimeout(resolve, 20)); // Deletion triggers a refresh
            const deletionResult = { ...deletedVod, listAfterDelete: vodList.textContent };

            // 3. Test Refresh button
            comp.setBackendUrl('http://refreshed-server.com'); // This triggers refresh
            await new Promise(resolve => setTimeout(resolve, 20));
            const refreshResult = { firstVodName: vodList.querySelector('.vod-name')?.textContent };
            
            // 4. Test "No VODs Found" message
            comp.setBackendUrl('http://empty-server.com'); // This triggers refresh
            await new Promise(resolve => setTimeout(resolve, 20));
            const noVodsMessage = vodList.querySelector('.no-vods-message')?.textContent;

            return {
                selectionResult,
                deletionResult,
                refreshResult,
                noVodsMessage
            };
        });

        // Assertions
        expect(result.selectionResult.vodId).to.equal('vod1');
        expect(result.deletionResult.vodId).to.equal('vod1');
        expect(result.refreshResult.firstVodName).to.equal('Refreshed Video');
        expect(result.noVodsMessage).to.equal('No VODs found.');
    });

    it('should handle various error scenarios gracefully', async function() {
        const result = await page.evaluate(async () => {
            // 1. Test missing backend URL on refresh
            const noBackendComp = await ComponentTestUtils.createTestComponent('vod-browser');
            let missingBackendError = false;
            noBackendComp.addEventListener('error', (e) => {
                if (e.detail.message.includes('URL is required')) missingBackendError = true;
            });
            noBackendComp.refresh();
            await new Promise(resolve => setTimeout(resolve, 10));

            // 2. Test network error during fetch
            window.fetchMock.mock('http://network-error.com/rest/v2/vods/list/0/200', { ok: false, status: 500 });
            const networkErrorComp = await ComponentTestUtils.createTestComponent('vod-browser');
            let networkError = false;
            networkErrorComp.addEventListener('error', (e) => {
                if (e.detail.message.includes('status 500')) networkError = true;
            });
            networkErrorComp.setBackendUrl('http://network-error.com');
            await new Promise(resolve => setTimeout(resolve, 20));

            // 3. Test malformed JSON in VOD data for selection
            const malformedComp = await ComponentTestUtils.createTestComponent('vod-browser', { 'backend-url': 'http://test-server.com' });
            let parseError = false;
            malformedComp.addEventListener('error', (e) => {
                if (e.detail.message.includes('Failed to parse VOD data')) parseError = true;
            });
            const malformedItem = document.createElement('div');
            malformedItem.className = 'vod-item';
            malformedItem.dataset.vod = '{invalid-json}';
            malformedComp.shadowRoot.getElementById('vod-list').appendChild(malformedItem);
            malformedItem.click();
            await new Promise(resolve => setTimeout(resolve, 10));

            return {
                missingBackendError,
                networkError,
                parseError
            };
        });

        expect(result.missingBackendError).to.be.true;
        expect(result.networkError).to.be.true;
        expect(result.parseError).to.be.true;
    });
}); 