
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
}

// Make available in both Node.js and browser contexts
if (typeof window !== 'undefined') {
    window.ComponentTestUtils = ComponentTestUtils;
} else if (typeof global !== 'undefined') {
    global.ComponentTestUtils = ComponentTestUtils;
}

module.exports = ComponentTestUtils; 