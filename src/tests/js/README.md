# Component Testing

Node.js testing infrastructure for Web Components using Mocha + Chai + Playwright.

## Running Tests

```bash
# Install dependencies
npm install

# Run headless tests
npm test
```

**Note:** Runs completely headless. Uses system Chromium browser if available, otherwise downloads Playwright browser.

## Writing unit tests
- Import component in test-runner.html
- Create new test in ./unit/ directory. All tests placed there will be automatically loaded
- There is 'global.testPage' variable, pointing to the root of the test page