import { Task, TaskInput } from "../types/task.js";
import { getConfig } from "./config.js";
import { SQLiteStorage } from "./sqlite-storage.js";

export interface Storage {
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | null>;
  addTask(task: TaskInput): Promise<Task>;
  updateTask(task: Task): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Batch operations
  batchAddTasks(tasks: TaskInput[]): Promise<Task[]>;
  batchUpdateTasks(tasks: Task[]): Promise<Task[]>;
}

// Singleton instance
let localStorageInstance: Storage | null = null;

export async function getLocalStorage(): Promise<Storage> {
  if (!localStorageInstance) {
    const config = getConfig();
    const dbPath = (config.get("dbPath") as string) || "./1234.db";

    localStorageInstance = new SQLiteStorage(dbPath);
    await (localStorageInstance as SQLiteStorage).initialize();
  }

  return localStorageInstance;
}
