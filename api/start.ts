import { startBot } from '../src/bot';
let botStarted = false;

// Start the bot when the serverless function is called
export default async function handler(req: any, res: any) {
  if (!botStarted) {
    try {
      await startBot();
      botStarted = true;
      res.status(200).json({ status: 'Bot started successfully' });
    } catch (error) {
      console.error('Failed to start bot:', error);
      res.status(500).json({ error: 'Failed to start bot' });
    }
  } else {
    res.status(200).json({ status: 'Bot is already running' });
  }
} 