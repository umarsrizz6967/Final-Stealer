const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
    let context;
    try {
        console.log("🚀 Launching Playwright...");
        
        // 1. Launch Headless Browser
        context = await chromium.launch({
            headless: true,
            args: ['--no-sandbox'] 
        });

        const browserContext = await context.newContext();
        const page = await browserContext.newPage();

        // 2. Force Login Redirect
        // This URL forces Roblox to try and authenticate, which triggers cookie creation
        console.log("🌐 Forcing Auth Redirect...");
        await page.goto('https://www.roblox.com/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Wait for the page to stabilize (wait for any element)
        try {
            await page.waitForSelector('body', { timeout: 30000 });
            console.log("✅ Page loaded.");
        } catch (e) {
            console.warn("⚠️ Timeout waiting for body, taking screenshot...");
        }

        // Give network requests time to settle
        await page.waitForTimeout(5000); 

        // 3. Extract Cookie
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
            
            // Take screenshot of current state
            await page.screenshot({ path: './roblox_error.png' }).catch(() => {});
            console.log("📸 Saved error screenshot to roblox_error.png");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stack) console.error(error.stack);
        
        // Try to save screenshot on crash too
        try {
            if (context) {
                // Note: We need a page instance for screenshot, simplified here
            }
        } catch(e) {}
    } finally {
        if (context) await context.close();
    }
})();
