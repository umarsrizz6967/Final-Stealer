const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Define a persistent profile folder
    // This saves cookies so you don't have to log in every time
    const userDataDir = path.join(__dirname, 'roblox-profile');

    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir);
    }

    console.log("Launching local Chromium...");

    let browser;

    try {
        // 2. Launch the browser locally
        browser = await chromium.launchPersistentContext(userDataDir, {
            headless: true, // Set to false if running locally and want to see the window
            slowMo: 500,    // Optional: slows down actions for debugging
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
            
            // If running locally (headless: false), you can wait for manual login
            // If running in GitHub Actions, it will just fail here unless you pre-seeded the profile
            console.log("Waiting for manual login...");
            await page.waitForFunction(() => {
                return document.cookie.includes('.ROBLOSECURITY');
            }, { timeout: 60000 }); // Wait up to 1 minute
            
            // Re-fetch after login
            const newCookies = await page.context().cookies();
            const newCookie = newCookies.find(c => c.name === '.ROBLOSECURITY');
            
            if (newCookie) {
                console.log("✅ Logged in! Token:", newCookie.value);
            } else {
                console.log("❌ Still no cookie after wait.");
            }
        } else {
            console.log("✅ Cookie found immediately:", robloxCookie.value);
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
