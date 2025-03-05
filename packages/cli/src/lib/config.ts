import Conf from "conf";
import fs from "fs";
import os from "os";
import path from "path";

// Define the configuration schema
interface ConfigSchema {
  dbPath: string;
}

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), ".1234-sh");

// Ensure config directory exists
function ensureConfigDirectory(): void {
  if (!fs.existsSync(DEFAULT_CONFIG_DIR)) {
    fs.mkdirSync(DEFAULT_CONFIG_DIR, { recursive: true });
  }
}

// Singleton config instance
let configInstance: Conf<ConfigSchema> | null = null;

export function getConfig(): Conf<ConfigSchema> {
  if (!configInstance) {
    // Ensure directory exists before initializing config
    ensureConfigDirectory();

    configInstance = new Conf<ConfigSchema>({
      projectName: "1234-sh",
      schema: {
        dbPath: {
          type: "string",
          default: path.join(DEFAULT_CONFIG_DIR, "data.db"),
        },
      },
    });

    // Create migrations or perform other initialization if necessary
  }

  return configInstance;
}

// Utility function to reset configuration (useful for testing)
export function resetConfig(): void {
  if (configInstance) {
    configInstance.clear();
    configInstance = null;
  }
}

// Export utility functions for managing config directory
export const configUtils = {
  DEFAULT_CONFIG_DIR,
  ensureConfigDirectory,
};
