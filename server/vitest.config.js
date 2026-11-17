import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      MONGODB_URI: 'mongodb://localhost:27017/sportsground_test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});