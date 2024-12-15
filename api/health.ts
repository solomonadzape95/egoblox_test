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
      polling: {
        startTime: global.botStartTime,
        lastPollTime: global.botPollingInfo?.lastPollTime,
        totalPolls: global.botPollingInfo?.totalPolls,
        lastUpdate: global.botPollingInfo?.lastUpdate
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Bot is not responding',
      error: error.message,
      polling: {
        startTime: global.botStartTime,
        lastPollTime: global.botPollingInfo?.lastPollTime,
        totalPolls: global.botPollingInfo?.totalPolls
      }
    });
  }
} 