const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Define where your browser data will be stored
    // This keeps your login state between runs
    const userDataDir = path.join(__dirname, 'roblox-profile');

    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir);
    }

    console.log("Launching local Chromium with persistent context...");

    try {
        // 2. Launch the browser locally using your user data directory
        const browser = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Set to true if you want to hide the window
            slowMo: 500,     // Optional: slows down actions so you can see what's happening
            args: ['--window-size=1920,1080']
        });

        // 3. Get the first page (or create one if none exist)
        const pages = browser.pages();
        let page = pages[0];
        
        if (!page || page.url() === 'about:blank') {
            page = await browser.newPage();
        }

        // 4. Navigate to Roblox
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 5. Fetch Cookies
        const cookies = await page.context().cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (!robloxCookie) {
            console.log("❌ Not logged in.");
            console.log("Please log in manually in the browser window that just opened.");
            
            // Wait for you to log in manually
            await page.waitForFunction(() => {
                return document.cookie.includes('.ROBLOSECURITY');
            }, { timeout: 120000 }); // Wait up to 2 minutes
            
            console.log("✅ User logged in! Fetching new cookie...");
        } else {
            console.log("✅ Cookie found:", robloxCookie.value);
        }

        // 6. Output the result
        if (robloxCookie) {
            console.log("\n🔑 .ROBLOSECURITY Token:");
            console.log(robloxCookie.value);
        }

        // Keep the browser open for a few seconds so you can verify
        await new Promise(r => setTimeout(r, 5000));

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 7. Close the browser
        console.log("Closing browser...");
        await browser.close();
    }
})();
