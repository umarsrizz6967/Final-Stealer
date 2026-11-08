const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
    let context;
    let browser; // Only used if fallback is triggered

    // 1. Determine Profile Path
    // Priority: 
    // 1. ENV_VAR (for CI flexibility)
    // 2. Standard Local Paths (for local testing)
    
    let userDataDir = process.env.CHROME_PROFILE_PATH;
    
    if (!userDataDir) {
        if (process.platform === 'win32') {
            userDataDir = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        } else if (process.platform === 'darwin') {
            userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
        } else {
            userDataDir = path.join(os.homedir(), ".config", "google-chrome");
        }
    }

    const profileExists = fs.existsSync(userDataDir);
    
    try {
        console.log(`🚀 Launching with profile: ${userDataDir} (Exists: ${profileExists})`);

        if (profileExists) {
            // Use Persistent Context to inherit existing cookies/login state
            context = await chromium.launchPersistentContext(userDataDir, {
                headless: true, // Headless is fine if already logged in
                slowMo: 50,
                args: ['--window-size=1920,1080']
            });
        } else {
            console.warn("⚠️ No local profile found. Launching fresh browser.");
            browser = await chromium.launch({ headless: true });
            context = await browser.newContext();
        }

        // 2. Navigate to Roblox
        const pages = context.pages();
        let page = pages[0];
        if (!page || page.url() === 'about:blank') {
            page = await context.newPage();
        }

        console.log("🌐 Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 3. Fetch Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Success! Token found.");
            console.log("Token:", robloxCookie.value);
            
            // Optional: Save to file for next steps
            fs.writeFileSync('./roblox_token.txt', robloxCookie.value);
        } else {
            console.log("❌ Not logged in.");
            console.log("Available Cookies:", cookies.map(c => c.name));
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (context) {
            await context.close();
        }
        if (browser) {
            await browser.close();
        }
        console.log("🛑 Browser closed.");
    }
})();
