import { startBot } from '../src/bot';

// Start the bot when the serverless function is called
export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    try {
      await startBot();
      res.status(200).json({ status: 'Bot started successfully' });
    } catch (error) {
      console.error('Failed to start bot:', error);
      res.status(500).json({ error: 'Failed to start bot' });
    }
  } else {
    // Health check endpoint
    res.status(200).json({ status: 'Bot is ready' });
  }
} 