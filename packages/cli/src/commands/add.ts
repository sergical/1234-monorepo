import chalk from "chalk";
import ora from "ora";
import { z } from "zod";
import { getLocalStorage } from "../lib/storage.js";

// Validate task input
const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  priority: z
    .string()
    .transform(Number)
    .refine((val) => val >= 1 && val <= 4, {
      message: "Priority must be between 1 and 4",
    }),
  inbox: z.boolean().optional().default(true),
});

export type AddTaskOptions = {
  priority?: string;
  inbox?: boolean;
};

export async function addTask(
  title: string,
  options: AddTaskOptions
): Promise<void> {
  const spinner = ora("Adding task...").start();

  try {
    // Validate input
    const taskInput = taskSchema.parse({
      title,
      priority: options.priority || "3",
      inbox: options.inbox !== false, // Default to true if not explicitly set to false
    });

    // Get storage
    const storage = await getLocalStorage();

    // Add task to storage
    const newTask = await storage.addTask({
      title: taskInput.title,
      priority: taskInput.priority,
      inbox: taskInput.inbox,
      createdAt: new Date(),
      completed: false,
    });

    spinner.succeed(`Task added with ID ${chalk.bold(newTask.id)}`);

    // Show a helpful message about inbox
    if (newTask.inbox) {
      console.log(
        chalk.dim('Task added to inbox. Use "1234 inbox" to view your inbox.')
      );
    }
  } catch (error) {
    spinner.fail("Failed to add task");

    if (error instanceof z.ZodError) {
      console.error(chalk.red("Validation errors:"));
      error.errors.forEach((err) => {
        console.error(chalk.red(`- ${err.message}`));
      });
    } else if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }

    process.exit(1);
  }
}
