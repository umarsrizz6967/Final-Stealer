const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    let browser;
    try {
        console.log("🚀 Launching Playwright (Visible Mode)...");
        
        // CHANGE THIS TO FALSE TO SEE THE BROWSER WINDOW
        browser = await chromium.launch({
            headless: false, 
            slowMo: 50, // Slows down actions by 50ms so you can see what's happening
            args: ['--no-sandbox'] 
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US'
        });

        const page = await context.newPage();

        console.log("🌐 Opening Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // Wait for the Login button to appear (indicates full load)
        await page.waitForSelector('button[data-testid="login-button"]', { timeout: 30000 });
        console.log("✅ Page Loaded!");

        // Take a screenshot of YOUR screen
        await page.screenshot({ path: './roblox_live.png' }).catch(() => {});

        // Extract Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Token found:", robloxCookie.value.substring(0, 20) + "...");
            fs.writeFileSync('./roblox_token.txt', robloxCookie.value);
        } else {
            console.log("❌ No cookie found.");
            console.log("Cookies:", cookies.map(c => c.name));
        }

        // Keep browser open for 10 seconds so you can inspect it
        await new Promise(r => setTimeout(r, 10000));

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (browser) await browser.close();
    }
})();
