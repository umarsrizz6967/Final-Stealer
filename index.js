const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
    let context;
    
    // 1. Get the profile path from GitHub Actions environment variable
    const profilePath = process.env.CHROME_PROFILE_PATH || "/tmp/chrome-profile/User Data";
    
    console.log(`📂 Using Chrome Profile Path: ${profilePath}`);

    try {
        // 2. Launch Persistent Context with the specific profile
        context = await chromium.launchPersistentContext(profilePath, {
            headless: true, 
            slowMo: 50,
            args: [
                '--window-size=1920,1080',
                '--no-sandbox' // Often needed in Docker/Ubuntu environments
            ]
        });

        const page = await context.newPage();
        
        // 3. Load your local HTML file
        const filePath = path.join(__dirname, 'index.html');
        console.log("🚀 Loading index.html...");
        
        // Ensure the file exists before trying to load it
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
        
        // Wait for the iframe to appear (Roblox embed)
        try {
            await page.waitForSelector('iframe[src*="roblox"]', { timeout: 30000 });
            console.log("✅ Roblox iframe loaded.");
        } catch (e) {
            console.warn("⚠️ Iframe didn't appear in time, proceeding anyway...");
        }

        // Give it a moment to fully initialize cookies
        await page.waitForTimeout(5000); 

        // 4. Extract the Cookie
        const cookies = await context.cookies();
        const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY' || c.name === 'ROBLOSECURITY');

        if (robloxCookie) {
            const token = robloxCookie.value;
            console.log("✅ Token found!");
            
            // Save to artifact file
            fs.writeFileSync('./roblox_token.txt', token);
            console.log("💾 Saved to roblox_token.txt");
        } else {
            console.log("❌ No cookie found.");
            // Debug: Log all cookies to see what's there
            console.log("Available Cookies:", cookies.map(c => c.name));
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        if (context) await context.close();
    }
})();
