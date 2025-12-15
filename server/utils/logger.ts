/**
 * Production-safe logger utility
 * In production, debug logs are disabled to reduce noise
 * Only errors and warnings are always logged
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDebugEnabled = process.env.DEBUG === 'true';
const isQuietMode = process.env.QUIET_MODE === 'true';

export const logger = {
  // Always log errors
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args);
  },

  // Always log warnings
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args);
  },

  // Only log info in development or when debug is enabled
  info: (message: string, ...args: any[]) => {
    if (!isProduction || isDebugEnabled) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  // Only log debug messages in development with debug enabled
  debug: (message: string, ...args: any[]) => {
    if (!isProduction && isDebugEnabled) {
      console.log(`🔍 ${message}`, ...args);
    }
  },

  // Log success messages (always in dev, only with debug in prod)
  success: (message: string, ...args: any[]) => {
    if (!isProduction || isDebugEnabled) {
      console.log(`✅ ${message}`, ...args);
    }
  },

  // Log API-related messages (reduced in quiet mode)
  api: (message: string, ...args: any[]) => {
    if (!isQuietMode && (!isProduction || isDebugEnabled)) {
      console.log(`🌐 ${message}`, ...args);
    }
  },

  // Log AI-related messages
  ai: (message: string, ...args: any[]) => {
    if (!isQuietMode && (!isProduction || isDebugEnabled)) {
      console.log(`🤖 ${message}`, ...args);
    }
  },

  // Log database operations (only in debug mode)
  db: (message: string, ...args: any[]) => {
    if (isDebugEnabled) {
      console.log(`💾 ${message}`, ...args);
    }
  },

  // Log cache operations
  cache: (message: string, ...args: any[]) => {
    if (isDebugEnabled) {
      console.log(`📦 ${message}`, ...args);
    }
  }
};

export default logger;
