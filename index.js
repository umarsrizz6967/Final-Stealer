const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
    let context;
    try {
        // 1. Define Profile Path
        let userDataDir;
        if (process.platform === 'win32') {
            userDataDir = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");
        } else if (process.platform === 'darwin') {
            userDataDir = path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome");
        } else {
            userDataDir = path.join(os.homedir(), ".config", "google-chrome");
        }

        console.log(`📂 Launching Chrome with profile: ${userDataDir}`);

        // 2. Launch Browser (Headless for GitHub)
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: true, 
            slowMo: 50,
            args: ['--window-size=1920,1080']
        });

        const page = await context.newPage();
        
        // 3. Open local HTML file
        const filePath = path.join(__dirname, 'index.html');
        console.log("🚀 Opening Roblox via index.html...");
        
        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('iframe[src*="roblox"]', { timeout: 30000 });
        await page.waitForTimeout(3000); 

        // 4. Fetch Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            const token = robloxCookie.value;
            console.log("✅ Token found!");
            
            // Save to a specific file for artifacts
            fs.writeFileSync('./roblox_token.txt', token);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (context) await context.close();
    }
})();
