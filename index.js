const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    // 1. Define where your browser data will be stored
    const userDataDir = path.join(__dirname, 'roblox-profile');

    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir);
    }

    console.log("Launching local Chromium with persistent context...");

    let browser; // Declare browser here so it's accessible in finally

    try {
        // 2. Launch the browser locally
        browser = await chromium.launchPersistentContext(userDataDir, {
            headless: true, // Set to false if you want to see the window
            slowMo: 500,     
            args: ['--window-size=1920,1080']
        });

        // 3. Get the first page or create a new one
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
            
            // Wait for manual login (up to 2 minutes)
            try {
                await page.waitForFunction(() => {
                    return document.cookie.includes('.ROBLOSECURITY');
                }, { timeout: 120000 }); 
                console.log("✅ User logged in! Fetching new cookie...");
                
                // Re-fetch cookies after login
                const newCookies = await page.context().cookies();
                const newCookie = newCookies.find(c => c.name === '.ROBLOSECURITY');
                if (newCookie) {
                    console.log("\n🔑 .ROBLOSECURITY Token:");
                    console.log(newCookie.value);
                }
            } catch (e) {
                console.log("⏱️ Timed out waiting for login.");
            }
        } else {
            console.log("✅ Cookie found:", robloxCookie.value);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 6. Close the browser safely
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
    }
})();
