const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('--- Testing AIVERSE App ---');
    await page.goto('http://localhost:5000');

    // 1. Check Welcome Message and Date
    const welcome = await page.innerText('#welcome-msg');
    console.log('Welcome message contains date:', welcome.includes('4 avril 2026') ? '✅' : '❌');
    console.log('Welcome message contains Markdown headers:', welcome.includes('Ce que je peux faire') ? '✅' : '❌');

    // 2. Test Chat and Markdown (Table/Code)
    console.log('Sending message to test Markdown rendering...');
    await page.fill('#chat-input', 'Crée un petit tableau de 2 colonnes sur les fruits et un bloc de code javascript hello world.');
    await page.click('#send-btn');

    // Wait for response (up to 30s)
    await page.waitForSelector('.msg.ai .bubble table', { timeout: 30000 });
    const hasTable = await page.isVisible('.msg.ai .bubble table');
    const hasCode = await page.isVisible('.msg.ai .bubble pre code');
    const hasCopyBtn = await page.isVisible('.msg.ai .bubble .copy-btn');

    console.log('Renders Table:', hasTable ? '✅' : '❌');
    console.log('Renders Code Block:', hasCode ? '✅' : '❌');
    console.log('Has Copy Button:', hasCopyBtn ? '✅' : '❌');

    // 3. Test Sidebar and Docs link
    const docsLink = await page.getAttribute('a[href="/docs"]', 'href');
    console.log('Docs link present:', docsLink === '/docs' ? '✅' : '❌');

    // 4. Test User Identity Persistence
    const userId = await page.evaluate(() => localStorage.getItem('aiverse_user_id'));
    console.log('User ID generated and stored:', userId ? '✅ (' + userId + ')' : '❌');

    await page.screenshot({ path: 'verification_final.png', fullPage: true });
    console.log('Screenshot saved as verification_final.png');

  } catch (err) {
    console.error('Verification failed:', err);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
})();
