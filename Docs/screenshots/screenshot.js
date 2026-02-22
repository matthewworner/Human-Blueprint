import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  // Try a different viewport - portrait/larger size
  await page.setViewport({ width: 2560, height: 1440 });
  
  // Navigate and wait for load
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 60000 });
  
  // Wait for the canvas element
  await page.waitForSelector('#canvas-container', { timeout: 30000 });
  
  // Wait for images to load
  console.log('Waiting for images to load...');
  await new Promise(resolve => setTimeout(resolve, 25000));
  
  // Check loading state
  const infoText = await page.$eval('#info', el => el.textContent);
  console.log('Info text:', infoText);
  
  // Do dramatic camera movements - zoom in and out
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel({ deltaY: 800 });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Move mouse in patterns to trigger different parts of the gallery
  const positions = [
    [1280, 720],   // center
    [640, 360],    // top left
    [1920, 1080],  // bottom right
    [1280, 300],   // top center
    [1280, 1140],  // bottom center
    [300, 720],    // left
    [2260, 720],   // right
  ];
  
  for (const [x, y] of positions) {
    await page.mouse.move(x, y);
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  
  // Dwell in one spot to trigger gaze effect
  await page.mouse.move(1280, 720);
  await new Promise(resolve => setTimeout(resolve, 3500));
  
  await page.screenshot({ path: './screenshot.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshot saved to ./screenshot.png');
})();
