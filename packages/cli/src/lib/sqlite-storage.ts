import Database from "better-sqlite3";
import { Task, TaskInput } from "../types/task.ts";
import { Storage } from "./storage.ts";

export class SQLiteStorage implements Storage {
  private db: Database.Database;
  private initialized = false;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Enable WAL mode for better concurrency
    this.db.pragma("journal_mode = WAL");

    // Create tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority INTEGER NOT NULL,
        inbox INTEGER NOT NULL,
        completed INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        completedAt TEXT
      )
    `);

    this.initialized = true;
  }

  private serializeTask(task: Task): Record<string, any> {
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      inbox: task.inbox ? 1 : 0,
      completed: task.completed ? 1 : 0,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };
  }

  private deserializeTask(row: Record<string, any>): Task {
    return {
      id: row.id,
      title: row.title,
      priority: row.priority,
      inbox: row.inbox === 1,
      completed: row.completed === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    };
  }

  async getTasks(): Promise<Task[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM tasks ORDER BY priority, createdAt DESC"
    );
    const rows = stmt.all();
    return rows.map((row) => this.deserializeTask(row));
  }

  async getTask(id: number): Promise<Task | null> {
    const stmt = this.db.prepare("SELECT * FROM tasks WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.deserializeTask(row) : null;
  }

  async addTask(taskInput: TaskInput): Promise<Task> {
    const task: Task = {
      ...taskInput,
      id: 0, // Will be set by SQLite autoincrement
      updatedAt: new Date(),
    };

    const serialized = this.serializeTask(task);

    // Remove id from the serialized task so SQLite can auto-increment
    delete serialized.id;

    const columns = Object.keys(serialized).join(", ");
    const placeholders = Object.keys(serialized)
      .map(() => "?")
      .join(", ");
    const values = Object.values(serialized);

    const stmt = this.db.prepare(
      `INSERT INTO tasks (${columns}) VALUES (${placeholders})`
    );
    const info = stmt.run(...values);

    // Get the inserted task with its new ID
    return this.getTask(info.lastInsertRowid as number) as Promise<Task>;
  }

  async updateTask(task: Task): Promise<Task> {
    task.updatedAt = new Date();

    const serialized = this.serializeTask(task);

    // Build SET clause for the UPDATE statement
    const setClauses = Object.keys(serialized)
      .filter((key) => key !== "id")
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = [
      ...Object.keys(serialized)
        .filter((key) => key !== "id")
        .map((key) => serialized[key]),
      task.id,
    ];

    const stmt = this.db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`);
    stmt.run(...values);

    return task;
  }

  async deleteTask(id: number): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM tasks WHERE id = ?");
    stmt.run(id);
  }

  async batchAddTasks(taskInputs: TaskInput[]): Promise<Task[]> {
    const results: Task[] = [];

    // Use a transaction for better performance
    const transaction = this.db.transaction(() => {
      for (const taskInput of taskInputs) {
        const task = this.addTask(taskInput);
        results.push(task as unknown as Task);
      }
      return results;
    });

    return transaction();
  }

  async batchUpdateTasks(tasks: Task[]): Promise<Task[]> {
    // Use a transaction for better performance
    const transaction = this.db.transaction((tasksToUpdate: Task[]) => {
      for (const task of tasksToUpdate) {
        this.updateTask(task);
      }
      return tasksToUpdate;
    });

    return transaction(tasks);
  }
}
