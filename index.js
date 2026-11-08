const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    let context;
    try {
        console.log("🚀 Launching Playwright...");
        
        // 1. Launch Headless Browser
        context = await chromium.launch({
            headless: true,
            args: ['--no-sandbox'] 
        });

        // 2. Create a new Browser Context
        const browserContext = await context.newContext();
        const page = await browserContext.newPage();

        // 3. Navigate to Roblox
        console.log("🌐 Opening Roblox...");
        await page.goto('https://www.roblox.com/', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Wait for the main content to load (this usually triggers the cookie generation)
        await page.waitForSelector('#root', { timeout: 30000 });
        console.log("✅ Roblox page loaded.");

        // Give it a few extra seconds for network requests to settle
        await page.waitForTimeout(5000); 

        // 4. Extract the Cookie
        const cookies = await browserContext.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            const token = robloxCookie.value;
            console.log("✅ Token found!");
            
            // Save to artifact
            fs.writeFileSync('./roblox_token.txt', token);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found.");
            console.log("Available Cookies:", cookies.map(c => c.name));
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        if (context) await context.close();
    }
})();
