import Conf from "conf";
import os from "os";
import path from "path";

// Define the configuration schema
interface ConfigSchema {
  dbPath: string;
}

// Singleton config instance
let configInstance: Conf<ConfigSchema> | null = null;

export function getConfig(): Conf<ConfigSchema> {
  if (!configInstance) {
    configInstance = new Conf<ConfigSchema>({
      projectName: "1234-sh",
      schema: {
        dbPath: {
          type: "string",
          default: path.join(os.homedir(), ".1234-sh", "data.db"),
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
