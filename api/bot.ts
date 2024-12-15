import { webhookCallback } from "grammy";
import { Bot } from "grammy";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize the bot
const bot = new Bot(process.env.BOT_TOKEN || "");

// Set up the webhook callback
const handleWebhook = webhookCallback(bot, "express");

// Export the serverless function
export default async function handler(req, res) {
  if (req.method === "POST") {
    // Handle incoming updates from Telegram
    await handleWebhook(req, res);
  } else {
    // Respond with a 405 Method Not Allowed for non-POST requests
    res.status(405).send("Method Not Allowed");
  }
}

// Webhook setup function
async function setupWebhook() {
  try {
    await bot.api.deleteWebhook();
    const webhookUrl = `${process.env.WEBHOOK_DOMAIN}   `;
    await bot.api.setWebhook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
}

// Call this function to set up the webhook when deploying
setupWebhook();
