#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { addTask } from "./commands/add.js";
import { completeTask } from "./commands/complete.js";
import { listTasks } from "./commands/list.js";
import { moveTask } from "./commands/move.js";
const packageJson = await import("../package.json", {
  assert: { type: "json" },
});
const version = packageJson.default.version;

const program = new Command();

// Main program configuration
program
  .name("1234")
  .description(
    "Developer-focused todo CLI with local-first architecture (1234.sh)"
  )
  .version(version);

// Command: add
program
  .command("add")
  .description("Add a new task")
  .argument("<title>", "Task title")
  .option("-p, --priority <number>", "Task priority (1-4, 1 is highest)", "3")
  .option("-n, --no-inbox", "Do not add to inbox")
  .action(addTask);

// Command: list
program
  .command("list")
  .description("List all tasks")
  .option("-p, --priority <number>", "Filter by priority")
  .option("-s, --status <status>", "Filter by status (pending, completed)")
  .option(
    "-f, --format <format>",
    "Output format (table, json, markdown)",
    "table"
  )
  .action(listTasks);

// Command: inbox
program
  .command("inbox")
  .description("List tasks in your inbox")
  .option(
    "-f, --format <format>",
    "Output format (table, json, markdown)",
    "table"
  )
  .action((options) => listTasks({ ...options, inbox: true }));

// Command: complete
program
  .command("complete")
  .description("Mark a task as complete")
  .argument("<id>", "Task ID")
  .action(completeTask);

// Command: move
program
  .command("move")
  .description("Move a task in or out of the inbox")
  .argument("<id>", "Task ID")
  .option("--inbox", "Move to inbox")
  .option("--no-inbox", "Remove from inbox")
  .action(moveTask);

// Error handling for invalid commands
program.on("command:*", () => {
  console.error(
    chalk.red(
      `Invalid command: ${program.args.join(" ")}\nSee --help for a list of available commands.`
    )
  );
  process.exit(1);
});

// Parse command line arguments
program.parse();

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
