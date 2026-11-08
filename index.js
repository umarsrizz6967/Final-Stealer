const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
    let browser;
    let context;
    let page;

    // 1. Find Local Chrome Profile Path
    let userDataDir = null;
    
    if (process.platform === 'win32') {
        const chromePath = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        userDataDir = fs.existsSync(chromePath) ? chromePath : null;
    } else if (process.platform === 'darwin') {
        userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
    } else {
        // Linux / CI
        userDataDir = path.join(os.homedir(), ".config", "google-chrome");
        if (!fs.existsSync(userDataDir)) {
            userDataDir = path.join(os.homedir(), ".config", "chromium");
        }
    }

    try {
        console.log("🚀 Launching Browser...");

        // 2. Decide how to launch
        if (userDataDir && fs.existsSync(userDataDir)) {
            console.log("📂 Using Local Profile:", userDataDir);
            // Use persistent context to load your existing cookies/login state
            context = await chromium.launchPersistentContext(userDataDir, {
                headless: true, // Set to false if you want to see the login screen
                slowMo: 100
            });
        } else {
            console.log("⚪ No local profile found. Launching fresh browser.");
            browser = await chromium.launch({ headless: true });
            context = await browser.newContext();
        }

        // 3. Get Page
        const pages = context.pages();
        page = pages[0] || await context.newPage();

        // 4. Navigate
        console.log("🌐 Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 5. Check for Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Success! Token found.");
            console.log("Token:", robloxCookie.value);
        } else {
            console.log("❌ Not logged in.");
            
            // If we used a local profile but aren't logged in, maybe we need to log in?
            // Or just exit if headless.
            if (!userDataDir) {
                 console.log("Fresh browser launched. No session available.");
            } else {
                 console.log("Local profile loaded but not logged in. Try setting headless: false to log in manually.");
            }
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
