const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
    let browserContext; // Define here so it's available in finally

    // 1. Detect OS and find the correct User Data Path
    let userDataDir;
    
    if (process.platform === 'win32') {
        const chromePath = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        const edgePath = path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "User Data");
        userDataDir = fs.existsSync(chromePath) ? chromePath : edgePath;
    } else if (process.platform === 'darwin') {
        userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
    } else {
        // Linux / GitHub Actions / Replit
        // Try standard Chrome first, then fallback to Chromium or other browsers
        userDataDir = path.join(os.homedir(), ".config", "google-chrome");
        if (!fs.existsSync(userDataDir)) {
            userDataDir = path.join(os.homedir(), ".config", "chromium");
        }
        if (!fs.existsSync(userDataDir)) {
            console.warn("⚠️ Warning: Could not find default browser profile. Using default context.");
            userDataDir = null;
        }
    }

    if (userDataDir) {
        console.log("Using Profile:", userDataDir);
    }

    // 2. Determine Headless mode
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const headlessMode = isCI ? true : false; 

    try {
        // 3. Launch the browser using YOUR existing profile
        const launchArgs = {
            slowMo: 500,
            args: ['--window-size=1920,1080']
        };

        if (userDataDir) {
            browserContext = await chromium.launchPersistentContext(userDataDir, {
                headless: headlessMode, 
                ...launchArgs
            });
        } else {
            // Fallback if no profile found
            const browser = await chromium.launch({ headless: headlessMode, ...launchArgs });
            browserContext = browser.contexts()[0];
        }

        // 4. Get the page
        const pages = browserContext.pages();
        let page = pages[0];
        
        if (!page || page.url() === 'about:blank') {
            page = await browserContext.newPage();
        }

        // 5. Navigate to Roblox
        console.log("Navigating to Roblox...");
        await page.goto('https://www.roblox.com/', { waitUntil: 'networkidle' });

        // 6. Check for the cookie
        const cookies = await browserContext.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Success! Cookie found from your existing profile.");
            console.log("Token:", robloxCookie.value);
        } else {
            console.log("❌ Not logged in yet.");
            
            if (!headlessMode) {
                console.log("Waiting for manual login in the window...");
                await page.waitForFunction(() => {
                    return document.cookie.includes('.ROBLOSECURITY');
                }, { timeout: 60000 }); 

                const newCookies = await browserContext.cookies();
                const newCookie = newCookies.find(c => c.name === '.ROBLOSECURITY');
                
                if (newCookie) {
                    console.log("✅ Logged in manually! Token:", newCookie.value);
                }
            } else {
                console.log("Running headless on CI, cannot wait for manual login.");
                console.log("Make sure you are already logged in via your main browser profile.");
            }
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 7. Safe closure
        if (browserContext) {
            await browserContext.close();
        }
    }
})();
