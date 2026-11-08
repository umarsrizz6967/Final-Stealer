const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    let browser;
    try {
        console.log("🚀 Launching Playwright...");
        
        // Set headless to FALSE if running locally, TRUE if using xvfb in GitHub
        const isHeadless = process.env.GITHUB_ACTIONS === 'true'; 
        
        browser = await chromium.launch({
            headless: isHeadless, 
            slowMo: 50,
            args: ['--no-sandbox'] 
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US'
        });

        const page = await context.newPage();

        console.log("🌐 Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // Wait for the Login/Sign Up area to load
        await page.waitForSelector('button[data-testid="login-button"]', { timeout: 30000 }).catch(() => {
            console.warn("⚠️ Login button not found, continuing anyway.");
        });

        // Wait extra time for any JS to finish generating cookies
        await page.waitForTimeout(3000); 

        // Screenshot for debugging
        await page.screenshot({ path: './roblox_debug.png' }).catch(() => {});

        // Extract Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Token Found!");
            fs.writeFileSync('./roblox_token.txt', robloxCookie.value);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No .ROBLOSECURITY cookie found.");
            console.log("Available Cookies:", cookies.map(c => c.name));
            
            // Save screenshot if failed
            await page.screenshot({ path: './roblox_error.png' }).catch(() => {});
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (browser) await browser.close();
    }
})();
