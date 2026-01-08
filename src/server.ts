import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PolymarketArbitrageBot } from './bot';
import { loadConfig, validateConfig } from './config';
import { ArbitrageOpportunity, BotConfig } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('web/dist'));

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Bot instance
let bot: PolymarketArbitrageBot | null = null;
let botConfig: BotConfig = loadConfig();
let opportunities: ArbitrageOpportunity[] = [];
let isRunning = false;

// WebSocket clients
const clients = new Set<WebSocket>();

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  clients.add(ws);

  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      isRunning,
      config: botConfig,
      opportunities,
      stats: bot ? bot.getStats() : { totalOpportunities: 0, isRunning: false }
    }
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Custom bot class that broadcasts opportunities
class WebArbitrageBot extends PolymarketArbitrageBot {
  protected async scanForOpportunities(): Promise<void> {
    const beforeCount = this.getOpportunities().length;
    await super.scanForOpportunities();
    const afterCount = this.getOpportunities().length;

    // If new opportunities were found, broadcast them
    if (afterCount > beforeCount) {
      const newOpportunities = this.getOpportunities().slice(beforeCount);
      broadcast({
        type: 'opportunities',
        data: newOpportunities
      });
      opportunities = this.getOpportunities();
    }

    // Broadcast stats update
    broadcast({
      type: 'stats',
      data: this.getStats()
    });
  }
}

// API Routes

// Get bot status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    isRunning,
    config: botConfig,
    opportunities,
    stats: bot ? bot.getStats() : { totalOpportunities: 0, isRunning: false }
  });
});

// Start the bot
app.post('/api/start', async (req: Request, res: Response) => {
  try {
    if (isRunning) {
      return res.status(400).json({ error: 'Bot is already running' });
    }

    // Update config if provided
    if (req.body.config) {
      botConfig = { ...botConfig, ...req.body.config };
      validateConfig(botConfig);
    }

    bot = new WebArbitrageBot(botConfig);
    isRunning = true;

    // Start bot in background
    bot.start().catch((error) => {
      console.error('Bot error:', error);
      isRunning = false;
      broadcast({ type: 'error', data: { message: error.message } });
    });

    broadcast({ type: 'status', data: { isRunning: true } });
    res.json({ message: 'Bot started successfully', config: botConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stop the bot
app.post('/api/stop', (req: Request, res: Response) => {
  try {
    if (!isRunning || !bot) {
      return res.status(400).json({ error: 'Bot is not running' });
    }

    bot.stop();
    isRunning = false;

    broadcast({ type: 'status', data: { isRunning: false } });
    res.json({ message: 'Bot stopped successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get configuration
app.get('/api/config', (req: Request, res: Response) => {
  res.json(botConfig);
});

// Update configuration
app.post('/api/config', (req: Request, res: Response) => {
  try {
    const newConfig = { ...botConfig, ...req.body };
    validateConfig(newConfig);
    botConfig = newConfig;

    broadcast({ type: 'config', data: botConfig });
    res.json({ message: 'Configuration updated', config: botConfig });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get opportunities
app.get('/api/opportunities', (req: Request, res: Response) => {
  res.json(opportunities);
});

// Clear opportunities
app.post('/api/opportunities/clear', (req: Request, res: Response) => {
  if (bot) {
    bot.clearOpportunities();
  }
  opportunities = [];

  broadcast({ type: 'opportunities', data: [] });
  res.json({ message: 'Opportunities cleared' });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  if (bot && isRunning) {
    bot.stop();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
