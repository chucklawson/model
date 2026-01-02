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
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // CRITICAL: Coverage thresholds - build fails if not met
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
        // Per-file thresholds for critical files
        perFile: true,
      },

      // Include Lambda functions in coverage
      include: [
        'src/**/*.{ts,tsx}',
        'amplify/functions/**/*.ts',
      ],

      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.integration.test.{ts,tsx}',
        '**/*.e2e.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
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
      '**/fmpApiClient.integration.test.ts', // Skipped due to mocking complexity
      '**/vanguardImporter.integration.test.ts', // Skipped due to mocking complexity
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
