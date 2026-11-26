import { defineConfig } from 'vitest/config';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      CLIENT_ORIGIN: 'http://localhost:5173',
      MEDIA_ROOT: path.join(os.tmpdir(), 'sg-test-media'),
      BCRYPT_ROUNDS: '4',

    },
  },
});