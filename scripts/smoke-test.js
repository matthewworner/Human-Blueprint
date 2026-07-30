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
        // Treat local artwork textures as the requests worth exercising. Hold the
        // first one forever (never settles) to prove the texture timeout still
        // protects startup; let the rest through so the LOD queue recovers.
        const isArtwork = request.resourceType() === 'image' && /\/images\/[^/]+\.webp$/.test(request.url());
        if (!isArtwork) {
            request.continue();
        } else if (!heldArtworkRequest) {
            artworkRequestCount++;
            heldArtworkRequest = request.url();
        } else {
            artworkRequestCount++;
            request.continue();
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
    // Point at a real artwork rather than a fixed coordinate: with a sparse
    // corpus the screen centre may be empty.
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
        target = await page.evaluate(() => window.__bpPointAtArtwork?.() ?? null);
        if (!target) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert(target, 'No artwork was available to gaze at');
    await page.mouse.move(target.x, target.y);
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
    // At least one real artwork texture must land on a plane (not just placeholders).
    let loaded = 0;
    for (let i = 0; i < 120 && !loaded; i++) {
        loaded = await page.evaluate(() => window.__bpLoadedTextureCount?.() ?? 0);
        if (!loaded) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert(loaded > 0, 'No artwork texture loaded onto a plane');
    const state = await page.evaluate(() => ({
        loadingHidden: document.querySelector('#loading')?.classList.contains('hidden'),
        artworkCount: document.querySelector('#info-status')?.textContent,
        tooltipTitle: document.querySelector('#tooltip-title')?.textContent,
        canvasCount: document.querySelectorAll('#canvas-container canvas').length
    }));

    assert.equal(state.loadingHidden, true);
    const expectedCount = await page.evaluate(() => fetch('/images.json').then(r => r.json()).then(a => a.length));
    assert.match(state.artworkCount, new RegExp(String(expectedCount)));
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
