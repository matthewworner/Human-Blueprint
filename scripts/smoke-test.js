import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';

const server = await createServer({
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, open: false }
});

let browser;
try {
    await server.listen();
    const address = server.httpServer.address();
    assert(address && typeof address !== 'string');

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const pageErrors = [];
    let heldArtworkRequest = null;
    let artworkRequestCount = 0;
    let ruptureObserved = false;

    page.on('pageerror', (error) => pageErrors.push(error));
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.resourceType() !== 'image' || !request.url().startsWith('https://')) {
            request.continue();
        } else if (!heldArtworkRequest) {
            artworkRequestCount++;
            heldArtworkRequest = request.url(); // Simulate a third-party image request that never settles.
        } else {
            artworkRequestCount++;
            request.abort();
        }
    });

    const ready = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Blueprint did not become ready within 10 seconds')), 10000);
        page.once('pageerror', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        page.on('console', (message) => {
            if (message.text().startsWith('RUPTURE triggered:')) {
                ruptureObserved = true;
            }
            if (message.text() === 'Blueprint ready.') {
                clearTimeout(timeout);
                resolve();
            }
        });
    });

    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded' });
    await ready;
    await page.mouse.move(400, 300);
    for (let i = 0; i < 60 && !heldArtworkRequest; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    for (let i = 0; i < 100 && !ruptureObserved; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert(ruptureObserved, 'The gaze-to-rupture path did not fire');
    assert.deepEqual(pageErrors, []);

    await page.click('#settings-toggle');
    await page.waitForSelector('#settings-panel.visible');
    for (let i = 0; i < 120 && artworkRequestCount < 2; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.deepEqual(pageErrors, []);
    const state = await page.evaluate(() => ({
        loadingHidden: document.querySelector('#loading')?.classList.contains('hidden'),
        artworkCount: document.querySelector('#info-status')?.textContent,
        tooltipTitle: document.querySelector('#tooltip-title')?.textContent,
        canvasCount: document.querySelectorAll('#canvas-container canvas').length
    }));

    assert.equal(state.loadingHidden, true);
    assert.match(state.artworkCount, /2041/);
    assert(state.tooltipTitle, 'Tooltip metadata was empty');
    assert.doesNotMatch(state.tooltipTitle, /^generated_/);
    assert.equal(state.canvasCount, 1);
    assert(heldArtworkRequest, 'The test did not exercise a hanging artwork request');
    assert(artworkRequestCount > 1, 'The texture queue did not recover after the hanging request timed out');

    const failedPage = await browser.newPage();
    let falseReady = false;
    failedPage.on('console', (message) => {
        if (message.text() === 'Blueprint ready.') falseReady = true;
    });
    await failedPage.setRequestInterception(true);
    failedPage.on('request', (request) => {
        if (!request.url().endsWith('/images.json')) request.continue(); // Hold metadata forever; AbortSignal must end it.
    });
    await failedPage.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded' });
    await failedPage.waitForFunction(() => document.querySelector('#loading')?.textContent.includes('Unable to Load'));
    const failureState = await failedPage.$eval('#loading', (element) => ({
        hidden: element.classList.contains('hidden'),
        text: element.textContent
    }));
    assert.equal(falseReady, false, 'Metadata timeout incorrectly emitted the ready state');
    assert.equal(failureState.hidden, false, 'Metadata timeout hid its error message');
    assert.match(failureState.text, /Unable to Load/);

    console.log('Smoke test passed: ready state, settings, rupture, texture recovery, and metadata timeout.');
} finally {
    await browser?.close();
    await server.close();
}
