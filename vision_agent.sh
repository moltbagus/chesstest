#!/bin/bash
# Vision agent script to check the deployed website

echo "Vision Agent: Checking https://chesstest-three.vercel.app/"
echo "=========================================================="

# Navigate to repo
cd /Users/colbert1/chesstest

# Use puppeteer to capture screenshot
node << 'PUPPETEER_EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to website...');
    await page.goto('https://chesstest-three.vercel.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if redirected
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for chess board
    const boardExists = await page.evaluate(() => document.getElementById('board') !== null);
    console.log('Board exists:', boardExists);

    // Get body text
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Body text:', bodyText);

    // Capture screenshot
    await page.screenshot({ path: 'vision_agent_screenshot.png', fullPage: false });
    console.log('Screenshot saved to vision_agent_screenshot.png');

    await browser.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
PUPPETEER_EOF

# Report findings
echo ""
echo "=========================================="
echo "VISION AGENT ANALYSIS"
echo "=========================================="
echo ""
echo "Screenshot saved. Check vision_agent_screenshot.png"
