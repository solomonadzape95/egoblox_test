import { bot } from '../src/bot';

export default async function handler(req: any, res: any) {
  try {
    // Get bot info
    const botInfo = await bot.api.getMe();
    
    // Get uptime and other stats
    const status = {
      bot: {
        username: botInfo.username,
        name: botInfo.first_name,
        isActive: true,
        startTime: global.botStartTime || 'Not started',
      },
      system: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    };

    // Return status with HTML formatting
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <html>
        <head>
          <title>Bot Status</title>
          <meta http-equiv="refresh" content="30">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
            .active { background: #e7f5e7; color: #0a5d0a; }
            .inactive { background: #ffe6e6; color: #940000; }
            .info { background: #f0f0f0; padding: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>🤖 Bot Status Dashboard</h1>
          <div class="status ${status.bot.isActive ? 'active' : 'inactive'}">
            <h2>Bot Status: ${status.bot.isActive ? '🟢 Active' : '🔴 Inactive'}</h2>
            <p>Name: ${status.bot.name}</p>
            <p>Username: @${status.bot.username}</p>
            <p>Started: ${status.bot.startTime}</p>
          </div>
          <div class="info">
            <h3>System Info</h3>
            <p>Node Version: ${status.system.nodeVersion}</p>
            <p>Uptime: ${Math.floor(status.system.uptime)} seconds</p>
            <p>Last Updated: ${status.system.timestamp}</p>
          </div>
          <p><small>This page auto-refreshes every 30 seconds</small></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Bot appears to be offline',
      error: error.message
    });
  }
} 