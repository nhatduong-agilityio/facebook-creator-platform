import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  // Required by BullMQ — prevents commands from blocking
  maxRetriesPerRequest: null,
  // Reconnect strategy
  retryStrategy(times: number): number | null {
    if (times > 10) return null; // Stop retrying
    return Math.min(times * 200, 2000);
  }
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.info('[Redis] Connected');
});
