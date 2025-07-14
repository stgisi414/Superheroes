
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  APP = 'APP',
  GEMINI = 'GEMINI',
  CHARACTER = 'CHARACTER',
  GAME = 'GAME',
  AUDIO = 'AUDIO',
  UI = 'UI',
  STORAGE = 'STORAGE',
  API = 'API',
  AUTH = 'AUTH',
  PERFORMANCE = 'PERFORMANCE',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stackTrace?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel = LogLevel.DEBUG;

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(level: LogLevel, category: LogCategory, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
    };

    if (level === LogLevel.ERROR) {
      entry.stackTrace = new Error().stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const levelName = LogLevel[entry.level];
    
    console.log(
      `${colors[entry.level]}[${entry.timestamp}] ${levelName} ${entry.category}:${reset} ${entry.message}`,
      entry.data ? entry.data : ''
    );

    if (entry.stackTrace && entry.level === LogLevel.ERROR) {
      console.error(entry.stackTrace);
    }
  }

  debug(category: LogCategory, message: string, data?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: LogCategory, message: string, data?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.addLog(this.createLogEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: LogCategory, message: string, data?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.addLog(this.createLogEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: LogCategory, message: string, data?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, category, message, data));
    }
  }

  // Performance logging
  startTimer(category: LogCategory, operation: string): () => void {
    const startTime = performance.now();
    this.debug(category, `Starting operation: ${operation}`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.info(LogCategory.PERFORMANCE, `Operation completed: ${operation}`, { 
        duration: `${duration.toFixed(2)}ms`,
        category: category 
      });
    };
  }

  // API call logging
  logApiCall(method: string, url: string, status?: number, duration?: number, error?: any): void {
    const logData = { method, url, status, duration: duration ? `${duration}ms` : undefined };
    
    if (error) {
      this.error(LogCategory.API, `API call failed: ${method} ${url}`, { ...logData, error });
    } else if (status && status >= 400) {
      this.warn(LogCategory.API, `API call warning: ${method} ${url}`, logData);
    } else {
      this.info(LogCategory.API, `API call success: ${method} ${url}`, logData);
    }
  }

  // State change logging
  logStateChange(component: string, oldState: any, newState: any): void {
    this.debug(LogCategory.UI, `State change in ${component}`, { 
      oldState, 
      newState,
      diff: this.getStateDiff(oldState, newState)
    });
  }

  private getStateDiff(oldState: any, newState: any): any {
    if (typeof oldState !== 'object' || typeof newState !== 'object') {
      return { from: oldState, to: newState };
    }

    const diff: any = {};
    const allKeys = new Set([...Object.keys(oldState || {}), ...Object.keys(newState || {})]);
    
    allKeys.forEach(key => {
      if (oldState?.[key] !== newState?.[key]) {
        diff[key] = { from: oldState?.[key], to: newState?.[key] };
      }
    });

    return diff;
  }

  // Get logs for debugging
  getLogs(category?: LogCategory, level?: LogLevel): LogEntry[] {
    return this.logs.filter(log => 
      (!category || log.category === category) &&
      (!level || log.level >= level)
    );
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info(LogCategory.APP, 'Logs cleared');
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(LogCategory.APP, `Log level set to ${LogLevel[level]}`);
  }
}

export const logger = new Logger();

// Helper functions for common logging patterns
export const logError = (category: LogCategory, message: string, error: any) => {
  logger.error(category, message, {
    error: error.message || error,
    stack: error.stack
  });
};

export const logPerformance = (category: LogCategory, operation: string) => {
  return logger.startTimer(category, operation);
};

export const logUserAction = (action: string, data?: any) => {
  logger.info(LogCategory.UI, `User action: ${action}`, data);
};

export const logGameEvent = (event: string, data?: any) => {
  logger.info(LogCategory.GAME, `Game event: ${event}`, data);
};
