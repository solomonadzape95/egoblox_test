import { bot } from '../src/bot';

export default async function handler(req: any, res: any) {
  try {
    const botInfo = await bot.api.getMe();
    res.status(200).json({
      status: 'ok',
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        isActive: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Bot is not responding',
      error: error.message
    });
  }
} 