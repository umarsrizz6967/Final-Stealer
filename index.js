const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    let context;
    try {
        console.log("🚀 Launching Playwright...");
        
        // 1. Launch Headless Browser
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox'] 
        });

        // 2. Create Context with DESKTOP User-Agent
        // This forces Roblox to think you are on a PC, not Android
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

        // Wait for the main content
        try {
            await page.waitForSelector('#app-mount, .login-button, .logo-container', { timeout: 30000 });
            console.log("✅ Desktop UI loaded.");
        } catch (e) {
            console.warn("⚠️ UI didn't load fully, taking screenshot...");
        }

        // Give network time to settle
        await page.waitForTimeout(5000); 

        // 4. Extract Cookie
        const cookies = await browserContext.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            const token = robloxCookie.value;
            console.log("✅ Token found!");
            fs.writeFileSync('./roblox_token.txt', token);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found.");
            console.log("Available Cookies:", cookies.map(c => c.name));
            
            // Save debug image
            await page.screenshot({ path: './roblox_error.png' }).catch(() => {});
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (browser) await browser.close();
    }
})();
