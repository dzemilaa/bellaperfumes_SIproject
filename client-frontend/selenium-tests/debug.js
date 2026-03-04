require("chromedriver");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function main() {
    const options = new chrome.Options();
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    try {
        console.log("Otvaram stranicu...");

        // Postavi page load timeout na 30s
        await driver.manage().setTimeouts({ pageLoad: 30000 });

        await driver.get("https://bellaperfumes-s-iproject-dd56.vercel.app");
        console.log("URL:", await driver.getCurrentUrl());
        console.log("Title:", await driver.getTitle());
        console.log("USPJESNO!");
    } catch (e) {
        console.error("GRESKA:", e.message);
    } finally {
        await driver.quit();
    }
}

main();