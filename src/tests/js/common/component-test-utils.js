
class ComponentTestUtils {
    
    /**
     * Creates a test component and adds it to DOM with test marker
     */
    static async createTestComponent(tagName, attributes = {}) {
        await customElements.whenDefined(tagName);
        
        const element = document.createElement(tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        const container = document.getElementById('test-container');
        container.appendChild(element);
        element.setAttribute('data-test-component', 'true');
        
        // Wait for connectedCallback to complete
        await new Promise(resolve => setTimeout(resolve, 0));
        return element;
    }
    
    /**
     * Removes all test components from DOM after test completion
     */
    static cleanupComponents() {
        const container = document.getElementById('test-container');
        if (container) container.innerHTML = '';
    }
    
    /**
     * Triggers custom events on elements for testing event handling
     */
    static triggerEvent(element, eventType, eventData = {}) {
        const event = new CustomEvent(eventType, { detail: eventData });
        element.dispatchEvent(event);
    }
    
    /**
     * Creates a real MediaStream using canvas for testing video components
     * This generates a genuine MediaStream that browsers accept for srcObject
     */
    static createMockMediaStream(width = 320, height = 240, frameRate = 30) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // draw something
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST STREAM', width / 2, height / 2);
        
        const stream = canvas.captureStream(frameRate);
        
        // Add mock properties for testing
        stream._mockCanvas = canvas;
        stream._mockType = 'canvas-generated';
        stream._mockId = 'test-stream-' + Math.random().toString(36).substr(2, 9);
        return stream;
    }

    
    static cleanupMockStreams(...streams) {
        streams.forEach(stream => {
            if (stream && stream.getTracks) {
                stream.getTracks().forEach(track => {
                    if (track.stop) track.stop();
                });
            }
        });
    }
}

// Make available in both Node.js and browser contexts
if (typeof window !== 'undefined') {
    window.ComponentTestUtils = ComponentTestUtils;
} else if (typeof global !== 'undefined') {
    global.ComponentTestUtils = ComponentTestUtils;
}

module.exports = ComponentTestUtils; 