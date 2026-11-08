const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    let browser; // Declare here so it's available in finally
    try {
        console.log("🚀 Launching Playwright...");
        
        // 1. Launch Headless Browser
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox'] 
        });

        // 2. Create Context with DESKTOP User-Agent
        const browserContext = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US'
        });

        const page = await browserContext.newPage();

        // 3. Navigate to Roblox
        console.log("🌐 Opening Roblox (Desktop Mode)...");
        await page.goto('https://www.roblox.com/', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Wait for the LOGIN button specifically. This ensures the page is fully interactive.
        console.log("⏳ Waiting for Login button...");
        try {
            await page.waitForSelector('button[data-testid="login-button"], .login-button', { 
                timeout: 45000 
            });
            console.log("✅ Desktop UI fully loaded.");
        } catch (e) {
            console.warn("⚠️ Login button not found, taking screenshot anyway...");
        }

        // Extra wait for any background network requests (like cookie generation)
        await page.waitForTimeout(5000); 

        // 4. Extract Cookie
        const cookies = await browserContext.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            const token = robloxCookie.value;
            console.log("✅ Token found!");
            
            // Save token
            fs.writeFileSync('./roblox_token.txt', token);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found.");
            console.log("Available Cookies:", cookies.map(c => c.name));
            
            // Save debug image
            await page.screenshot({ path: './roblox_error.png' }).catch(() => {});
            console.log("📸 Saved error screenshot to roblox_error.png");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stack) console.error(error.stack);
        
        // Try to save screenshot on crash too
        try {
            if (browser) {
                // We need a page instance for screenshot, simplified here
            }
        } catch(e) {}
    } finally {
        if (browser) await browser.close();
    }
})();
