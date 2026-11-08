const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
    let browser;
    try {
        // 1. Define Profile Path (Same as before)
        let userDataDir;
        if (process.platform === 'win32') {
            userDataDir = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        } else if (process.platform === 'darwin') {
            userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
        } else {
            userDataDir = path.join(os.homedir(), ".config", "google-chrome");
        }

        console.log(`📂 Launching Chrome with profile: ${userDataDir}`);

        // 2. Launch Browser with Persistent Context (Inherits your login state)
        const context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Set to true if running on GitHub Actions later
            slowMo: 100,
            args: ['--window-size=1920,1080']
        });

        // 3. Open the HTML file we created
        const filePath = path.join(__dirname, 'index.html');
        console.log("🚀 Opening Roblox via index.html...");
        
        const page = await context.newPage();
        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });

        // 4. Wait for the Roblox iframe to be active
        // We wait for the iframe to finish loading to ensure cookies are present
        await page.waitForSelector('iframe[src*="roblox"]', { timeout: 30000 });
        
        // Give it a few extra seconds to settle
        await page.waitForTimeout(3000); 

        // 5. Fetch the Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            console.log("✅ Token found!");
            console.log("Token:", robloxCookie.value);
            
            // Save to a file for easy copying or use in other scripts
            fs.writeFileSync('./roblox_token.txt', robloxCookie.value);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found. Are you logged into Roblox?");
            console.log("Cookies available:", cookies.map(c => c.name));
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // Keep the browser open for a moment so you can see it worked, then close
        if (browser) await browser.close();
    }
})();
