import chalk from "chalk";
import ora from "ora";
import { getLocalStorage } from "../lib/storage.js";

export async function completeTask(id: string): Promise<void> {
  const spinner = ora(`Completing task ${id}...`).start();

  try {
    // Parse ID
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      spinner.fail("Invalid task ID");
      process.exit(1);
    }

    // Get storage
    const storage = await getLocalStorage();

    // Get task
    const task = await storage.getTask(taskId);

    if (!task) {
      spinner.fail(`Task with ID ${taskId} not found`);
      process.exit(1);
    }

    // Mark task as completed
    task.completed = true;
    task.completedAt = new Date();

    // Remove from inbox when completed
    const wasInInbox = task.inbox;
    task.inbox = false;

    await storage.updateTask(task);

    spinner.succeed(`Task ${chalk.bold(id)} marked as complete`);

    if (wasInInbox) {
      console.log(chalk.dim("Task removed from inbox."));
    }
  } catch (error) {
    spinner.fail("Failed to complete task");

    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }

    process.exit(1);
  }
}
