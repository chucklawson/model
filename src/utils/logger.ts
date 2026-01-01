/**
 * Centralized logging utility using Pino
 *
 * Provides structured logging with different levels for development and production.
 * In development: Pretty formatted, colorized output
 * In production: JSON formatted for log aggregation services
 *
 * @example
 * ```typescript
 * import logger from './utils/logger';
 *
 * // Info level (general information)
 * logger.info({ ticker: 'AAPL', price: 150.50 }, 'Stock price fetched');
 *
 * // Error level (with error object)
 * logger.error({ error: err, ticker: 'AAPL' }, 'Failed to fetch stock data');
 *
 * // Debug level (detailed debugging info)
 * logger.debug({ data: response }, 'API response received');
 *
 * // Warn level (warnings)
 * logger.warn({ threshold: 100, actual: 150 }, 'Request rate approaching limit');
 * ```
 */

import pino from 'pino';

// Determine if we're in production
const isProduction = import.meta.env.PROD;

/**
 * Create logger instance with environment-specific configuration
 */
const logger = pino({
  level: isProduction ? 'info' : 'debug',

  // Browser-safe configuration
  browser: {
    asObject: true,
    serialize: true,
  },

  // Pretty printing in development only
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{levelLabel} - {msg}',
    },
  },

  // Base fields to include in all logs
  base: {
    env: import.meta.env.MODE,
  },
});

/**
 * Log levels:
 * - trace (10): Very detailed debugging
 * - debug (20): Debugging information
 * - info (30): General information
 * - warn (40): Warning messages
 * - error (50): Error messages
 * - fatal (60): Fatal errors that crash the app
 */

export default logger;

/**
 * Helper functions for common logging patterns
 */

/**
 * Log API request
 */
export function logApiRequest(method: string, url: string, params?: Record<string, unknown>) {
  logger.debug({ method, url, params }, 'API request');
}

/**
 * Log API response
 */
export function logApiResponse(url: string, status: number, duration?: number) {
  logger.debug({ url, status, duration }, 'API response');
}

/**
 * Log API error
 */
export function logApiError(url: string, error: unknown, context?: Record<string, unknown>) {
  logger.error({ url, error, ...context }, 'API request failed');
}

/**
 * Log calculation performance
 */
export function logCalculation(name: string, duration: number, context?: Record<string, unknown>) {
  logger.debug({ calculation: name, duration, ...context }, 'Calculation completed');
}

/**
 * Log user action
 */
export function logUserAction(action: string, context?: Record<string, unknown>) {
  logger.info({ action, ...context }, 'User action');
}
