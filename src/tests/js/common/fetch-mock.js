/**
 * A utility for mocking the window.fetch API in browser-based tests.
 * This script should be loaded into the test runner (browser window)
 */
class FetchMock {
    constructor() {
        this._originalFetch = null;
        this._mockResponses = new Map();
    }

    /**
     * Replaces the global window.fetch with a mock implementation.
     */
    install() {
        if (this._originalFetch) return; // Already installed

        this._originalFetch = window.fetch;

        window.fetch = async (url) => {
            const mockResponse = this._mockResponses.get(url);
            if (mockResponse) {
                return {
                    ok: mockResponse.ok !== false,
                    status: mockResponse.status || 200,
                    text: async () => JSON.stringify(mockResponse.data || [])
                };
            }
            // Fallback for unmocked requests
            return { ok: false, status: 404, text: async () => 'Not Found' };
        };
    }

    uninstall() {
        if (this._originalFetch) {
            window.fetch = this._originalFetch;
            this._originalFetch = null;
        }
    }

    /**
     * Sets up a mock response for a specific URL.
     */
    mock(url, response) {
        this._mockResponses.set(url, response);
    }

    clearMocks() {
        this._mockResponses.clear();
    }
}

window.fetchMock = new FetchMock(); 