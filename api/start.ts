import { startBot, bot } from '../src/bot';

// Start the bot when the serverless function is called
export default async function handler(req: any, res: any) {
  try {
    // Check if bot is already running by trying to get bot info
    try {
      await bot.api.getMe();
      res.status(200).json({ status: 'Bot is already running' });
      return;
    } catch {
      // Bot is not running, start it
      await startBot();
      res.status(200).json({ status: 'Bot started successfully' });
    }
  } catch (error) {
    console.error('Failed to start bot:', error);
    res.status(500).json({ error: 'Failed to start bot: ' + error.message });
  }
} 