/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Logging utilities for SwissJS LSP server
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Simple logger for LSP server with configurable levels
 */
export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private prefix: string;

  constructor(prefix = '[SwissJS LSP]') {
    this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`${this.prefix} ERROR:`, message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`${this.prefix} WARN:`, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`${this.prefix} INFO:`, message, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`${this.prefix} DEBUG:`, message, ...args);
    }
  }

  /**
   * Log performance timing
   */
  time(label: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }
}

// Default logger instance
export const logger = new Logger();

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(
  operation: () => T,
  label: string
): T {
  const start = Date.now();
  try {
    const result = operation();
    const duration = Date.now() - start;
    logger.debug(`${label} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${label} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Async performance measurement utility
 */
export async function measurePerformanceAsync<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    logger.debug(`${label} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${label} failed after ${duration}ms:`, error);
    throw error;
  }
}
