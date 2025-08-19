const { expect } = require('chai');
const ComponentTestUtils = require('../common/component-test-utils.js');

describe('BroadcastBrowser', function() {
    let page;

    before(async function() {
        page = global.testPage;

        await page.evaluate(() => {
            window.fetchMock.install();
        });
    });

    after(async function() {
        await page.evaluate(() => {
            window.fetchMock.uninstall();
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
            window.fetchMock.mock('http://test-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
                ok: true,
                data: [{ streamId: 'stream1', name: 'Test Broadcast', date: 1640995200000, duration: 120, status: 'finished' }]
            });

            const comp = await ComponentTestUtils.createTestComponent('broadcast-browser', {
                'backend-url': 'http://test-server.com',
                'page-size': '5'
            });

            await new Promise(resolve => setTimeout(resolve, 50)); // Wait for fetch and render

            const pageIndicator = comp.shadowRoot.getElementById('page-indicator');
            const prevButton = comp.shadowRoot.getElementById('prev-button');
            const nextButton = comp.shadowRoot.getElementById('next-button');
            const list = comp.shadowRoot.getElementById('broadcast-list');

            return {
                tagName: comp.tagName.toLowerCase(),
                backendUrl: comp._backendUrl,
                pageSize: comp.pageSize,
                currentPage: comp._currentPage,
                pageIndicatorText: pageIndicator.textContent,
                prevButtonDisabled: prevButton.disabled,
                nextButtonDisabled: nextButton.disabled,
                broadcastItemCount: list.children.length
            };
        });

        expect(result.tagName).to.equal('broadcast-browser');
        expect(result.backendUrl).to.equal('http://test-server.com');
        expect(result.pageSize).to.equal(5);
        expect(result.currentPage).to.equal(0);
        expect(result.pageIndicatorText).to.equal('Page 1 of 1');
        expect(result.prevButtonDisabled).to.be.true;
        expect(result.nextButtonDisabled).to.be.true;
        expect(result.broadcastItemCount).to.be.above(0);
    });

    it('should fetch, display, and filter broadcasts with pagination and search', async function() {
        const result = await page.evaluate(async () => {
            const mockBroadcasts = [
                { streamId: 's1', name: 'Live Stream Alpha', date: 1641000000000, duration: 10, status: 'broadcasting' },
                { streamId: 's2', name: 'Finished Stream Beta', date: 1640990000000, duration: 20, status: 'finished' },
                { streamId: 's3', name: 'Live Stream Gamma', date: 1640980000000, duration: 30, status: 'broadcasting' },
                { streamId: 's4', name: 'Old Finished Stream', date: 1640970000000, duration: 40, status: 'finished' }
            ];

            window.fetchMock.mock('http://test-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
                ok: true,
                data: mockBroadcasts
            });

            const comp = await ComponentTestUtils.createTestComponent('broadcast-browser', {
                'backend-url': 'http://test-server.com',
                'page-size': '2'
            });

            await new Promise(resolve => setTimeout(resolve, 50)); // wait for initial fetch

            const list = comp.shadowRoot.getElementById('broadcast-list');
            const pageIndicator = comp.shadowRoot.getElementById('page-indicator');
            const nextButton = comp.shadowRoot.getElementById('next-button');

            const getVisibleItems = () => Array.from(list.children).filter(item => item.style.display !== 'none' && item.classList.contains('broadcast-item'));
            
            const initialState = {
                visibleCount: getVisibleItems().length,
                pageText: pageIndicator.textContent,
                nextEnabled: !nextButton.disabled,
                firstItemName: getVisibleItems()[0]?.querySelector('.broadcast-name span').textContent
            };

            // Test pagination
            nextButton.click();
            await new Promise(resolve => setTimeout(resolve, 20));

            const afterPagination = {
                visibleCount: getVisibleItems().length,
                pageText: pageIndicator.textContent,
                firstItemName: getVisibleItems()[0]?.querySelector('.broadcast-name span').textContent
            };

            // Test filtering
            const statusFilter = comp.shadowRoot.getElementById('status-filter');
            statusFilter.value = 'broadcasting';
            statusFilter.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 20));

            const afterFilter = {
                visibleCount: getVisibleItems().length,
                pageText: pageIndicator.textContent,
                firstItemName: getVisibleItems()[0]?.querySelector('.broadcast-name span').textContent
            };
            
            // Test search
            const searchInput = comp.shadowRoot.getElementById('search-input');
            searchInput.value = 'alpha';
            searchInput.dispatchEvent(new Event('input'));
            await new Promise(resolve => setTimeout(resolve, 20));
            
             const afterSearch = {
                visibleCount: getVisibleItems().length,
                pageText: pageIndicator.textContent,
                firstItemName: getVisibleItems()[0]?.querySelector('.broadcast-name span').textContent
            };

            return {
                initialState,
                afterPagination,
                afterFilter,
                afterSearch
            };
        });

        // Assert initial state
        expect(result.initialState.visibleCount).to.equal(2);
        expect(result.initialState.pageText).to.equal('Page 1 of 2');
        expect(result.initialState.nextEnabled).to.be.true;
        expect(result.initialState.firstItemName).to.equal('Live Stream Alpha');

        // Assert after pagination
        expect(result.afterPagination.visibleCount).to.equal(2);
        expect(result.afterPagination.pageText).to.equal('Page 2 of 2');
        expect(result.afterPagination.firstItemName).to.equal('Live Stream Gamma');
        
        // Assert after filtering
        expect(result.afterFilter.visibleCount).to.equal(2);
        expect(result.afterFilter.pageText).to.equal('Page 1 of 1');
        expect(result.afterFilter.firstItemName).to.equal('Live Stream Alpha');
        
        // Assert after search
        expect(result.afterSearch.visibleCount).to.equal(1);
        expect(result.afterSearch.pageText).to.equal('Page 1 of 1');
        expect(result.afterSearch.firstItemName).to.equal('Live Stream Alpha');
    });

    it('should correctly construct thumbnail URLs and set fallback', async function() {
        const result = await page.evaluate(async () => {
            const mockBroadcasts = [
                { streamId: 'stream1', name: 'Test Broadcast', date: 1, duration: 1, status: 'finished' }
            ];

            window.fetchMock.mock('http://test-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
               ok: true,
                data: mockBroadcasts
            });

            const comp = await ComponentTestUtils.createTestComponent('broadcast-browser', {
                'backend-url': 'http://test-server.com'
            });

            await new Promise(resolve => setTimeout(resolve, 50)); // Wait for render

            const thumbnailImg = comp.shadowRoot.querySelector('.broadcast-thumbnail img');

            return {
                thumbnailSrc: thumbnailImg ? thumbnailImg.src : null,
                thumbnailOnError: thumbnailImg ? thumbnailImg.getAttribute('onerror') : null
            };
        });

        expect(result.thumbnailSrc).to.equal('http://test-server.com/previews/stream1.png');
        expect(result.thumbnailOnError).to.equal("this.onerror=null;this.src='../img/components/video-placeholder.png';");
    });

    it('should handle user interactions and error scenarios', async function() {
        const result = await page.evaluate(async () => {
            const mockBroadcast = { streamId: 's1', name: 'Test Broadcast', date: 1, duration: 1, status: 'finished' };

            window.fetchMock.mock('http://test-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
                ok: true,
                data: [mockBroadcast]
            });

            const comp = await ComponentTestUtils.createTestComponent('broadcast-browser', {
                'backend-url': 'http://test-server.com'
            });

            let selectedBroadcast = null;
            let errorEventDetail = null;

            comp.addEventListener('broadcast-selected', (e) => {
                selectedBroadcast = e.detail.broadcast;
            });
            comp.addEventListener('error', (e) => {
                errorEventDetail = e.detail;
            });

            await new Promise(resolve => setTimeout(resolve, 50)); // Wait for render

            const broadcastItem = comp.shadowRoot.querySelector('.broadcast-item');
            
            // 1. Test successful selection
            broadcastItem.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            const selectionResult = { ...selectedBroadcast };

            // 2. Test that clicking copy icon does not trigger selection
            selectedBroadcast = null; // Reset for next test
            const copyIcon = comp.shadowRoot.querySelector('.copy-icon');
            copyIcon.click();
            await new Promise(resolve => setTimeout(resolve, 10));
            const copyClickResult = selectedBroadcast === null;

            // 3. Test network error handling
            window.fetchMock.mock('http://error-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
                ok: false,
                status: 500
            });
            const errorComp = await ComponentTestUtils.createTestComponent('broadcast-browser');
             let networkErrorFired = false;
            errorComp.addEventListener('error', (e) => { 
                if (e.detail.message.includes('status 500')) networkErrorFired = true;
            });
            errorComp.setBackendUrl('http://error-server.com');
            await new Promise(resolve => setTimeout(resolve, 35));

            // 4. Test "No broadcasts found" message
            window.fetchMock.mock('http://empty-server.com/rest/v2/broadcasts/list/0/200?sort_by=date&order_by=desc', {
                ok: true,
                data: []
            });
            const emptyComp = await ComponentTestUtils.createTestComponent('broadcast-browser', { 'backend-url': 'http://empty-server.com'});
            await new Promise(resolve => setTimeout(resolve, 35));
            const noBroadcastsMessage = emptyComp.shadowRoot.querySelector('.no-broadcasts-message');

            // 5. Test malformed data handling
            const malformedItem = document.createElement('div');
            malformedItem.className = 'broadcast-item';
            malformedItem.dataset.broadcast = '{invalid-json';
            comp.shadowRoot.getElementById('broadcast-list').appendChild(malformedItem);
            errorEventDetail = null; // Reset for test
            malformedItem.click();
            await new Promise(resolve => setTimeout(resolve, 10));

            return {
                selectionResult,
                copyClickDidNotSelect: copyClickResult,
                networkErrorFired: networkErrorFired,
                noBroadcastsMessageDisplayed: !!noBroadcastsMessage,
                malformedDataError: errorEventDetail ? errorEventDetail.message : null
            };
        });

        expect(result.selectionResult.streamId).to.equal('s1');
        expect(result.copyClickDidNotSelect).to.be.true;
        expect(result.networkErrorFired).to.be.true;
        expect(result.noBroadcastsMessageDisplayed).to.be.true;
        expect(result.malformedDataError).to.include('Failed to parse broadcast data');
    });
}); 