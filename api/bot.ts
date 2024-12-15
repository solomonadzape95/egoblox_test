import { bot } from "../dist/src/bot";
import { webhookCallback } from "grammy";

export const config = {
  runtime: "edge",
};

// Vercel serverless function handler
export default async function handler(req: Request) {
  if (req.method === "POST") {
    try {
      const response = await req.json();
      await bot.handleUpdate(response);
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }
  return new Response("Bot is running", { status: 200 });
}
