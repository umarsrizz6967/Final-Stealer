const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
    let browser;
    let context;
    let page;

    // 1. Configuration
    const ROBLOX_DOMAIN = '.roblox.com';
    const COOKIE_NAME = 'ROBLOSECURITY'; // Note: Playwright often normalizes names

    try {
        console.log("🚀 Launching Chromium...");
        
        // 2. Launch Browser (Headless by default for CI)
        browser = await chromium.launch({ 
            headless: true, 
            args: ['--window-size=1920,1080'] 
        });

        // 3. Create Context
        context = await browser.newContext();
        page = await context.newPage();

        // 4. Navigate to Roblox
        console.log("🌐 Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        // 5. Wait for the document to be ready
        await page.waitForLoadState('domcontentloaded');

        // 6. Extract Cookie
        console.log("🔍 Fetching cookies...");
        const cookies = await context.cookies();
        
        // Find the security cookie (case-insensitive search just in case)
        const robloxCookie = cookies.find(c => c.name.toLowerCase() === 'roblosecurity' || c.name === '.ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Success! Token found.");
            console.log("Token:", robloxCookie.value);
            
            // Optional: Save to file or send to API here
            // fs.writeFileSync('./token.txt', robloxCookie.value);
        } else {
            console.log("❌ No .ROBLOSECURITY cookie found.");
            console.log("Available Cookies:", cookies.map(c => c.name));
            
            // If you want to force login via a specific URL or method, do it here
            // await page.click('button[data-testid="login-button"]');
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 7. Clean up
        if (browser) {
            await browser.close();
            console.log("🛑 Browser closed.");
        }
    }
})();
