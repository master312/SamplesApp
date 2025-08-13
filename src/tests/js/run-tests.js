const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

function findChromiumPath() {
    try {
        const chromiumPath = execSync('which chromium', { encoding: 'utf8' }).trim();
        if (chromiumPath) return chromiumPath;
    } catch (error) {
        const fallbackPaths = [
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            '/run/current-system/sw/bin/chromium' // nixos
        ];
        
        for (const path of fallbackPaths) {
            try {
                execSync(`test -f ${path}`, { stdio: 'ignore' });
                return path;
            } catch (e) {
                continue;
            }
        }
    }
    return null;
}

/**
 * Creates HTTP server for testing
 * Serves webapp files at root and test files under /tests/
 */
function createTestServer() {
    const server = http.createServer((req, res) => {
        const webappRoot = path.resolve(__dirname, '../../main/webapp');
        const testRoot = path.resolve(__dirname);
        
        let filePath;
        
        // Serve test files under /tests/ prefix
        if (req.url.startsWith('/tests/')) {
            const testPath = req.url.substring(7); // Remove '/tests/' prefix
            filePath = path.join(testRoot, testPath);
        } else {
            // Serve webapp files at root
            filePath = path.join(webappRoot, req.url === '/' ? '/index.html' : req.url);
        }
        
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`Not found: ${req.url}`);
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.json': 'application/json'
        };
        
        const contentType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
    
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            resolve({ server, port });
        });
    });
}

/**
 * Runs component tests with Playwright browser environment
 */
async function runTests() {
    const chromiumPath = findChromiumPath();
    
    const launchOptions = { headless: true };
    
    if (chromiumPath) {
        console.log('Using system Chromium at:', chromiumPath);
        launchOptions.executablePath = chromiumPath;
    } else {
        console.log('System Chromium not found, using Playwright browser');
    }
    
    // Start HTTP server to serve test files on
    const { server, port } = await createTestServer();
    console.log(`Test server running on port ${port}`);
    
    const browser = await chromium.launch(launchOptions);
    const page = await browser.newPage();
    
    try {
        const testUrl = `http://localhost:${port}/tests/test-runner.html`;
        await page.goto(testUrl);
        await page.waitForLoadState('networkidle');
        
        await page.addScriptTag({
            url: `http://localhost:${port}/tests/common/component-test-utils.js`
        });
        
        await page.addScriptTag({
            url: `http://localhost:${port}/tests/common/webrtc-adaptor-mock.js`
        });
        
        console.log('DOM environment ready, running tests...');
        
        const mocha = new (require('mocha'))();
        
        // Load all unit test files
        const testFiles = fs.readdirSync(path.join(__dirname, 'unit'))
            .filter(file => file.endsWith('.test.js'));
        
        testFiles.forEach(file => {
            mocha.addFile(path.join(__dirname, 'unit', file));
        });
        
        global.testPage = page;
        
        return new Promise((resolve) => {
            mocha.run(async (failures) => {
                await browser.close();
                server.close();
                resolve(failures === 0);
            });
        });
    } catch (error) {
        await browser.close();
        server.close();
        throw error;
    }
}

if (require.main === module) {
    runTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}

module.exports = { runTests }; 