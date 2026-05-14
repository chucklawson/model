import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,

    // Coverage configuration with thresholds
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // CRITICAL: Coverage thresholds - build fails if not met
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },

      // Only measure coverage for business logic — UI components/pages/hooks are excluded
      include: [
        'src/Lib/**/*.ts',
        'src/utils/**/*.ts',
      ],

      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '**/*.integration.test.{ts,tsx}',
        '**/*.e2e.test.{ts,tsx}',
      ],
    },

    // Test execution settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Fail fast in CI to save time
    bail: process.env.CI ? 1 : undefined,

    // Parallel execution (2 workers in CI for stability)
    maxWorkers: process.env.CI ? 2 : undefined,
    minWorkers: 1,

    // Reporter configuration
    reporters: process.env.CI
      ? ['verbose', 'json', 'html']
      : ['verbose'],

    // Watch mode (disabled in CI)
    watch: !process.env.CI,

    // Include patterns
    include: [
      '**/*.test.{ts,tsx}',
      '**/*.integration.test.{ts,tsx}',
    ],

    // Exclude E2E tests and problematic integration tests from default run
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.e2e.test.{ts,tsx}', // Run separately with TEST_MODE=e2e
      ...(process.env.VITEST_INTEGRATION ? [] : [
        '**/fmpApiClient.integration.test.ts',
        '**/vanguardImporter.integration.test.ts',
      ]),
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
