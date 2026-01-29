/**
 * Development-only logger utility
 * Logs are completely stripped in production builds
 */

const isDev = import.meta.env.DEV;

export const devLog = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  group: (label: string) => {
    if (isDev) console.group(label);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },
};

// Shorthand for common logging patterns
export const log = devLog.log;
export const logInfo = devLog.info;
export const logWarn = devLog.warn;
export const logError = devLog.error;
export const logDebug = devLog.debug;
