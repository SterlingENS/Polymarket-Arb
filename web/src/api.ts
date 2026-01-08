import { BotConfig, BotStatus, ArbitrageOpportunity } from './types';

const API_BASE = '/api';

export async function getStatus(): Promise<BotStatus> {
  const response = await fetch(`${API_BASE}/status`);
  return response.json();
}

export async function startBot(config?: Partial<BotConfig>): Promise<void> {
  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start bot');
  }
}

export async function stopBot(): Promise<void> {
  const response = await fetch(`${API_BASE}/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop bot');
  }
}

export async function getConfig(): Promise<BotConfig> {
  const response = await fetch(`${API_BASE}/config`);
  return response.json();
}

export async function updateConfig(config: Partial<BotConfig>): Promise<void> {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update config');
  }
}

export async function getOpportunities(): Promise<ArbitrageOpportunity[]> {
  const response = await fetch(`${API_BASE}/opportunities`);
  return response.json();
}

export async function clearOpportunities(): Promise<void> {
  await fetch(`${API_BASE}/opportunities/clear`, {
    method: 'POST',
  });
}
