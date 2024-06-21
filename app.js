const express = require('express');
const bodyParser = require('body-parser');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

const cors = require("cors")
require('dotenv').config();


const app = express();
app.use(bodyParser.json());
app.use(cors())

app.post('/connect', async (req, res) => {
    const { email, password , number} = req.body;

    let browser;
    try {
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments(
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        );

        const browser = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

        await browser.get('https://www.linkedin.com/login');

        // Log in to LinkedIn
        const user_email = await browser.findElement(By.id('username'));
        await user_email.sendKeys(email);

        const user_password = await browser.findElement(By.id('password'));
        await user_password.sendKeys(password);

        const sign_in = await browser.findElement(By.xpath('//*[@type="submit"]'));
        await sign_in.click();
        await browser.wait(until.urlContains('feed'), 20000); // Increased timeout

        // Debug: log the current URL to ensure login succeeded
        const currentUrl = await browser.getCurrentUrl();
        console.log('Current URL after login:', currentUrl);

        // Navigate to the 'My Network' page
        const my_network = await browser.wait(until.elementLocated(By.css('a[data-test-global-nav-link="mynetwork"]')), 20000); // Using CSS selector
        await my_network.click();
        await browser.sleep(5000);

        // Debug: log the current URL to ensure navigation succeeded
        const networkUrl = await browser.getCurrentUrl();
        console.log('Current URL on My Network page:', networkUrl);

        // Click on "Connect" buttons
        let connect_buttons_clicked = 0;
        while (connect_buttons_clicked < number) {
            let connect_buttons = await browser.findElements(By.xpath('//button[text()="Connect"]'));
            if (connect_buttons.length === 0) {
                connect_buttons = await browser.findElements(By.xpath('//button[contains(@aria-label, "Connect")]'));
            }
            for (const button of connect_buttons) {
                if (connect_buttons_clicked >= number) {
                    break;
                }
                try {
                    const buttonText = await button.getText();
                    if (buttonText === 'Connect' || (await button.getAttribute('aria-label')).includes('Connect')) {
                        await button.click();
                        connect_buttons_clicked++;
                        await browser.sleep(2000);
                    }
                } catch (error) {
                    console.log('Failed to click Connect button:', error);
                }
            }
            await browser.executeScript('window.scrollTo(0, document.body.scrollHeight)');
            await browser.sleep(2000);
        }

        res.json({ status: 'success', message: 'Connected to 25 people.' });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        if (browser) {
            await browser.quit();
        }
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});