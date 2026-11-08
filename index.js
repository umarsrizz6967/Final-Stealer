const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
    // 1. Detect OS and find the correct User Data Path
    let userDataDir;
    
    if (process.platform === 'win32') {
        // Windows: Try Chrome first, then Edge
        const chromePath = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        const edgePath = path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "User Data");
        
        userDataDir = fs.existsSync(chromePath) ? chromePath : edgePath;
    } else if (process.platform === 'darwin') {
        // Mac
        userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
    } else {
        // Linux
        userDataDir = path.join(os.homedir(), ".config", "google-chrome");
    }

    console.log("Using Profile:", userDataDir);

    try {
        // 2. Launch the browser using YOUR existing profile
        // headless: false lets you see the window so you can verify it's working
        const browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: false, 
            slowMo: 500,
            args: ['--window-size=1920,1080']
        });

        // 3. Get the page
        const pages = browserContext.pages();
        let page = pages[0];
        
        if (!page || page.url() === 'about:blank') {
            page = await browserContext.newPage();
        }

        // 4. Navigate to Roblox
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 5. Check for the cookie
        const cookies = await browserContext.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Success! Cookie found from your existing profile.");
            console.log("Token:", robloxCookie.value);
        } else {
            console.log("❌ Not logged in yet. Waiting for manual login...");
            
            // If you aren't logged in, you can click "Log In" manually in the window
            // and this script will wait for you.
            await page.waitForFunction(() => {
                return document.cookie.includes('.ROBLOSECURITY');
            }, { timeout: 60000 }); // Wait up to 60 seconds

            // Re-fetch after manual login
            const newCookies = await browserContext.cookies();
            const newCookie = newCookies.find(c => c.name === '.ROBLOSECURITY');
            
            if (newCookie) {
                console.log("✅ Logged in manually! Token:", newCookie.value);
            } else {
                console.log("❌ Still no cookie.");
            }
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // We don't close immediately so you can inspect the window if needed
        // await browserContext.close();
    }
})();
