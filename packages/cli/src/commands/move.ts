import chalk from "chalk";
import ora from "ora";
import { getLocalStorage } from "../lib/storage.js";

export type MoveTaskOptions = {
  inbox?: boolean;
};

export async function moveTask(
  id: string,
  options: MoveTaskOptions
): Promise<void> {
  const destination = options.inbox ? "inbox" : "outside inbox";
  const spinner = ora(`Moving task ${id} to ${destination}...`).start();

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

    // Check if task is already in the requested state
    if (
      (options.inbox && task.inbox) ||
      (options.inbox === false && !task.inbox)
    ) {
      spinner.info(
        `Task ${chalk.bold(id)} is already ${options.inbox ? "in inbox" : "out of inbox"}`
      );
      return;
    }

    // Update inbox status
    task.inbox = options.inbox !== false; // Default to true if undefined
    task.updatedAt = new Date();

    await storage.updateTask(task);

    spinner.succeed(`Task ${chalk.bold(id)} moved to ${destination}`);
  } catch (error) {
    spinner.fail(`Failed to move task to ${destination}`);

    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }

    process.exit(1);
  }
}
