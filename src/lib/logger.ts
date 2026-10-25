/**
 * Lightweight structured logger for browser and Node test environments.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel =
  typeof process !== "undefined" && process.env.NODE_ENV === "production"
    ? "info"
    : "debug";

/**
 * Writes a structured log line when the level meets the minimum threshold.
 */
function write(level: LogLevel, scope: string, message: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/** Application logger scoped by module name. */
export const logger = {
  /** Logs debug details for development diagnostics. */
  debug(scope: string, message: string, meta?: unknown): void {
    write("debug", scope, message, meta);
  },
  /** Logs informational events. */
  info(scope: string, message: string, meta?: unknown): void {
    write("info", scope, message, meta);
  },
  /** Logs recoverable warning conditions. */
  warn(scope: string, message: string, meta?: unknown): void {
    write("warn", scope, message, meta);
  },
  /** Logs errors; callers must still handle the failure path. */
  error(scope: string, message: string, meta?: unknown): void {
    write("error", scope, message, meta);
  },
};
