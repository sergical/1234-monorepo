import chalk from "chalk";
import { getLocalStorage } from "../lib/storage.js";
import { Task } from "../types/task.js";

// Helper function to format tasks as a table
function formatTaskTable(tasks: Task[]): void {
  if (tasks.length === 0) {
    console.log(chalk.yellow("No tasks found."));
    return;
  }

  // Define column widths
  const columns = {
    id: 4,
    priority: 8,
    title: 50,
    inbox: 8,
    completed: 10,
  };

  // Print header
  console.log(
    chalk.bold(
      `${"ID".padEnd(columns.id)} ${"PRIORITY".padEnd(columns.priority)} ${"TITLE".padEnd(
        columns.title
      )} ${"INBOX".padEnd(columns.inbox)} ${"STATUS".padEnd(columns.completed)}`
    )
  );

  // Print separator
  console.log(
    "-".repeat(
      columns.id +
        columns.priority +
        columns.title +
        columns.inbox +
        columns.completed +
        5
    )
  );

  // Print tasks
  tasks.forEach((task) => {
    // Format task properties
    const id = task.id.toString().padEnd(columns.id);
    const priority = getPriorityLabel(task.priority).padEnd(columns.priority);
    const title = truncate(task.title, columns.title - 1).padEnd(columns.title);
    const inbox = task.inbox
      ? chalk.blue("✓").padEnd(columns.inbox)
      : "".padEnd(columns.inbox);
    const status = task.completed
      ? chalk.green("Done")
      : chalk.yellow("Pending");

    // Apply color based on priority
    const priorityColor = getPriorityColor(task.priority);

    // Print colored row
    console.log(
      `${priorityColor(id)} ${priorityColor(priority)} ${title} ${inbox} ${status}`
    );
  });
}

// Helper function to format tasks as JSON
function formatTaskJson(tasks: Task[]): void {
  console.log(JSON.stringify(tasks, null, 2));
}

// Helper function to format tasks as Markdown
function formatTaskMarkdown(tasks: Task[]): void {
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  console.log("# Tasks\n");
  console.log("| ID | Priority | Title | Inbox | Status |");
  console.log("| --- | --- | --- | --- | --- |");

  tasks.forEach((task) => {
    const status = task.completed ? "Completed" : "Pending";
    const inbox = task.inbox ? "✓" : "";
    console.log(
      `| ${task.id} | ${task.priority} | ${task.title} | ${inbox} | ${status} |`
    );
  });
}

// Helper functions for formatting
function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length - 3) + "..." : str;
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return "P1";
    case 2:
      return "P2";
    case 3:
      return "P3";
    case 4:
      return "P4";
    default:
      return `P${priority}`;
  }
}

function getPriorityColor(priority: number): (text: string) => string {
  switch (priority) {
    case 1:
      return chalk.red;
    case 2:
      return chalk.yellow;
    case 3:
      return chalk.blue;
    case 4:
      return chalk.gray;
    default:
      return chalk.white;
  }
}

export type ListTasksOptions = {
  priority?: string;
  status?: string;
  inbox?: boolean;
  format?: "table" | "json" | "markdown";
};

export async function listTasks(options: ListTasksOptions): Promise<void> {
  try {
    // Get storage
    const storage = await getLocalStorage();

    // Get all tasks
    let tasks = await storage.getTasks();

    // Apply filters
    if (options.priority) {
      tasks = tasks.filter(
        (task) => task.priority === parseInt(options.priority!, 10)
      );
    }

    if (options.status) {
      const isCompleted = options.status.toLowerCase() === "completed";
      tasks = tasks.filter((task) => task.completed === isCompleted);
    }

    if (options.inbox !== undefined) {
      tasks = tasks.filter((task) => task.inbox === options.inbox);
    }

    // Format output
    switch (options.format) {
      case "json":
        formatTaskJson(tasks);
        break;
      case "markdown":
        formatTaskMarkdown(tasks);
        break;
      case "table":
      default:
        formatTaskTable(tasks);
        break;
    }
  } catch (error) {
    console.error(chalk.red("Error listing tasks:"));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}
