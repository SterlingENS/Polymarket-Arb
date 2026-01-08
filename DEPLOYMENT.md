# Deployment & Testing Guide

## Quick Start

### 1. Initial Setup

```bash
# Install server dependencies
npm install

# Install web dependencies
cd web
npm install
cd ..

# Create environment file
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Polymarket API Configuration
POLYMARKET_API_URL=https://clob.polymarket.com
POLYMARKET_GAMMA_API_URL=https://gamma-api.polymarket.com

# Bot Settings
MIN_PROFIT_PERCENTAGE=1.0        # Start with 1% to see more opportunities
CHECK_INTERVAL_MS=5000           # Scan every 5 seconds
MAX_POSITION_SIZE_USDC=100       # Max investment per opportunity

# Web Server
PORT=3001                        # Server will run on this port
```

### 3. Run the Application

**Option A: Development Mode (Recommended for Testing)**

```bash
# Start the web server with auto-reload
npm run dev:server
```

Then open your browser to: **http://localhost:3001**

**Option B: Production Mode**

```bash
# Build everything
npm run build:server
cd web && npm run build && cd ..

# Start the production server
npm run start:server
```

## Testing the Bot

### Step 1: Open the Dashboard

Navigate to http://localhost:3001 in your browser. You should see:
- Dark-themed interface
- "Stopped" status indicator (gray)
- Control panel on the left
- Empty opportunity list

### Step 2: Start the Bot

1. Click the **"Start Bot"** button
2. Watch the status indicator turn green ("Running")
3. The bot will begin scanning markets every 5 seconds

### Step 3: Monitor for Opportunities

The dashboard will show:
- Real-time scan updates in the browser console
- Live statistics (total opportunities found)
- Opportunity cards as they're detected

**What to expect:**
- Arbitrage opportunities are rare (markets are efficient)
- You may need to wait several minutes or hours
- Lower the `MIN_PROFIT_PERCENTAGE` to see more results (but smaller profits)

### Step 4: Test Configuration Changes

1. Click **"Configuration"** button
2. Try changing settings:
   - Set `MIN_PROFIT_PERCENTAGE` to `0.5` (to find more opportunities)
   - Set `CHECK_INTERVAL_MS` to `10000` (slower scanning)
3. Click **"Save Configuration"**
4. Stop and restart the bot for changes to take effect

### Step 5: Clear Opportunities

Click **"Clear Opportunities"** to remove all detected opportunities from the list.

## Troubleshooting

### Port Already in Use

If port 3001 is busy:
```bash
# Change PORT in .env
PORT=3002
```

### No Opportunities Found

This is normal! Real arbitrage opportunities are rare because:
- Markets are efficient
- Other bots close gaps quickly
- Transaction costs eliminate small edges

To test the UI with more activity:
1. Lower `MIN_PROFIT_PERCENTAGE` to `0.1`
2. This will show smaller profit opportunities

### WebSocket Connection Failed

Check:
1. Server is running (`npm run dev:server`)
2. No firewall blocking port 3001
3. Browser console for error messages

### API Errors

If you see "Failed to fetch markets":
- Polymarket API might be rate-limiting
- Check your internet connection
- The free API has limits

## Production Deployment

### Deploy to VPS/Cloud Server

1. **Install Node.js on server:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone and setup:**
```bash
git clone <your-repo-url>
cd Polymarket-Arb
npm install
cd web && npm install && cd ..
cp .env.example .env
# Edit .env with your settings
```

3. **Build for production:**
```bash
npm run build:server
cd web && npm run build && cd ..
```

4. **Run with PM2 (process manager):**
```bash
# Install PM2
npm install -g pm2

# Start the server
pm2 start dist/server.js --name polymarket-bot

# Save PM2 config
pm2 save
pm2 startup
```

5. **Setup Nginx reverse proxy (optional):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy to Heroku

1. **Create Heroku app:**
```bash
heroku create polymarket-arb
```

2. **Add buildpacks:**
```bash
heroku buildpacks:add heroku/nodejs
```

3. **Set environment variables:**
```bash
heroku config:set MIN_PROFIT_PERCENTAGE=1.0
heroku config:set CHECK_INTERVAL_MS=5000
heroku config:set MAX_POSITION_SIZE_USDC=100
```

4. **Deploy:**
```bash
git push heroku main
```

### Deploy to Railway/Render

These platforms auto-detect Node.js and deploy automatically when you connect your GitHub repo.

**Build command:** `npm install && cd web && npm install && cd .. && npm run build`

**Start command:** `npm run start:server`

## Running 24/7

### Keep it Running Locally

**Option 1: Use PM2**
```bash
npm install -g pm2
npm run build:server
cd web && npm run build && cd ..
pm2 start dist/server.js --name polymarket-bot
```

**Option 2: Use tmux/screen**
```bash
tmux new -s polymarket
npm run dev:server
# Press Ctrl+B then D to detach
# Reconnect with: tmux attach -t polymarket
```

**Option 3: Docker (Advanced)**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd web && npm install && npm run build && cd ..
RUN npm run build:server
EXPOSE 3001
CMD ["npm", "run", "start:server"]
```

## Monitoring

### View Logs with PM2
```bash
pm2 logs polymarket-bot
pm2 monit
```

### Check Bot Status
```bash
curl http://localhost:3001/api/status
```

### Check Health
```bash
curl http://localhost:3001/api/health
```

## Performance Tips

1. **Increase scan interval** for fewer API calls:
   ```env
   CHECK_INTERVAL_MS=10000
   ```

2. **Run on a VPS** for 24/7 uptime

3. **Monitor API rate limits** - Polymarket may throttle frequent requests

4. **Use multiple instances** (carefully) to scan different market segments

## Security Notes

- Never expose your `.env` file
- Use environment variables in production
- Enable HTTPS if deploying publicly
- Consider adding authentication for the web dashboard
- Don't commit private keys or API credentials

## Next Steps

Once deployed and running:
1. Monitor for a few hours to see typical opportunity frequency
2. Adjust `MIN_PROFIT_PERCENTAGE` based on what you find
3. When you spot an opportunity, manually execute trades on Polymarket
4. Track your success rate and refine your strategy

---

**Need Help?**
- Check server logs for errors
- Open browser DevTools Console (F12) for frontend errors
- Review the API endpoint responses
- Ensure Polymarket API is accessible
