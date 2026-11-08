const { chromium } = require('playwright-core');

(async () => {
    // 1. Get your token from Environment Variables or Dashboard
    const token = process.env.BROWSERLESS_TOKEN;
    
    if (!token) {
        console.error("❌ Missing BROWSERLESS_TOKEN environment variable.");
        process.exit(1);
    }

    // 2. Connect to Browserless
    // Use the endpoint provided in your Browserless dashboard
    const wsEndpoint = `wss://production-sfo.browserless.io?token=${token}`;
    
    console.log(`Connecting to Browserless at: ${wsEndpoint.split('?')[0]}...`);

    try {
        const browser = await chromium.connectOverCDP(wsEndpoint);

        // 3. Create a new page context
        const context = await browser.newContext();
        const page = await context.newPage();

        // 4. Navigate to Roblox
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 5. Fetch Cookies
        const cookies = await page.context().cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (!robloxCookie) {
            console.log("❌ Not logged in. No .ROBLOSECURITY cookie found.");
            console.log("Stopping execution as requested.");
        } else {
            console.log("✅ Cookie found:", robloxCookie.value);
            // You can add your API call here if needed
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 6. Disconnect cleanly
        console.log("Disconnected from Browserless.");
    }
})();
