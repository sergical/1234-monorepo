// Export types and utilities for programmatic usage

// Types
export type { Task, TaskInput } from "./types/task.js";

// Storage
export { SQLiteStorage } from "./lib/sqlite-storage.js";
export type { Storage } from "./lib/storage.js";

// Config
export { getConfig, resetConfig } from "./lib/config.js";

// Commands (for programmatic usage)
export { addTask } from "./commands/add.js";
export type { AddTaskOptions } from "./commands/add.js";
export { completeTask } from "./commands/complete.js";
export { listTasks } from "./commands/list.js";
export type { ListTasksOptions } from "./commands/list.js";
export { moveTask } from "./commands/move.js";
export type { MoveTaskOptions } from "./commands/move.js";
