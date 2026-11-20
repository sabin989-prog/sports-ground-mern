import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});