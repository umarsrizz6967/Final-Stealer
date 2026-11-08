const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Set up a persistent profile to save cookies automatically
    const userDataDir = path.join(__dirname, 'roblox-profile');
    
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir);
    }

    console.log("Launching local Chromium...");

    let browser;

    try {
        // 2. Launch the browser with the persistent context
        // Set headless: false if you want to see the window on your screen
        browser = await chromium.launchPersistentContext(userDataDir, {
            headless: true, 
            slowMo: 500,
            args: ['--window-size=1920,1080']
        });

        // 3. Get or create a page
        const pages = browser.pages();
        let page = pages[0];
        
        if (!page || page.url() === 'about:blank') {
            page = await browser.newPage();
        }

        // 4. Navigate to Roblox
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 5. Check for the .ROBLOSECURITY cookie
        const cookies = await page.context().cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (!robloxCookie) {
            console.log("❌ Not logged in.");
            
            // If running locally, you can manually log in here if headless is false
            console.log("Waiting for manual login...");
            await page.waitForFunction(() => {
                return document.cookie.includes('.ROBLOSECURITY');
            }, { timeout: 60000 }); 

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
