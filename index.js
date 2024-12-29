console.log("Script started");

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fetch = require("node-fetch"); // For Telegram API requests
require("dotenv").config(); // Load environment variables

// Environment variables
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;
const username = "wabcdefghij14w@gmail.com";
const password = process.env.PASSWORD;

const loginUrl = "https://ais.usvisa-info.com/en-et/niv/users/sign_in";
const scrapeUrl =
  "https://ais.usvisa-info.com/en-et/niv/schedule/57941991/payment";

// Function to send messages to Telegram
async function postToTelegram(slotInfo) {
  console.log("Posting to Telegram...");
  if (slotInfo) {
    try {
      const message = `Available slot: ${slotInfo}`;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      console.log("Message sent to Telegram");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  } else {
    console.log("No slots available");
  }
}

// Main function to automate login and scraping
async function automateLogin() {
  console.log("Starting Puppeteer...");

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    console.log("Browser launched and new page created");

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("Navigating to login page...");
    await page.goto(loginUrl, { waitUntil: "networkidle2" });

    console.log("Filling in login form...");
    await page.type("#user_email", username);
    await page.type("#user_password", password);
    await page.click('input[name="policy_confirmed"]');
    await page.click('input[type="submit"]');

    console.log("Submitting login form...");
    await page.waitForNavigation();

    const currentUrl = page.url();
    if (currentUrl.includes("ais.usvisa-info.com/en-et/niv/groups/")) {
      console.log("Login successful, navigating to scrape URL...");
      await page.goto(scrapeUrl, { waitUntil: "networkidle2" });

      console.log("Scrape URL loaded, extracting slot information...");
      await page.waitForSelector("td.text-right", { timeout: 15000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      const slotInfo = $("td.text-right").text().trim();

      if (slotInfo) {
        console.log(`Slot found: ${slotInfo}`);
        await postToTelegram(slotInfo);
      } else {
        console.log("No slot information available");
      }
    } else {
      console.error("Login failed or unexpected redirect");
    }

    await browser.close();
    console.log("Browser closed");
  } catch (error) {
    console.error("Error during automation:", error);
  }
}

// Execute the function
automateLogin();
