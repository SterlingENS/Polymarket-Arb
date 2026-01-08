import { PolymarketArbitrageBot } from './bot';
import { loadConfig, validateConfig } from './config';

async function main() {
  try {
    // Load and validate configuration
    const config = loadConfig();
    validateConfig(config);

    // Create and start the bot
    const bot = new PolymarketArbitrageBot(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      bot.stop();
      process.exit(0);
    });

    // Start the bot
    await bot.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
