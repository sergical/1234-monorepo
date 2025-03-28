#!/usr/bin/env node
import {
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import {
  DEFAULT_INBOX,
  DEFAULT_PRIORITY,
  getConfig,
  SQLiteStorage,
  Task,
} from "./index.js";

const packageJson = await import("../package.json", {
  assert: { type: "json" },
});

// Initialize storage
const config = getConfig();
const storage = new SQLiteStorage(config.get("dbPath"));
await storage.initialize();

// Display formatting
function formatTaskLabel(task: Task, showDate: boolean = true): string {
  const status = task.completed ? "✓" : " ";
  const date = showDate
    ? pc.dim(` • ${task.createdAt.toLocaleDateString()}`)
    : "";
  const title = task.completed ? pc.dim(task.title) : task.title;
  const priorityColor =
    task.priority === 0
      ? pc.gray
      : task.priority === 1
        ? pc.red
        : task.priority === 2
          ? pc.yellow
          : task.priority === 3
            ? pc.blue
            : pc.white;

  const priorityLabel =
    task.priority === 0 ? "" : ` ${priorityColor(`[P${task.priority}]`)}`;

  return `${status === "✓" ? pc.green("✓") : " "}${priorityLabel} ${title}${task.inbox ? pc.cyan(" (inbox)") : ""}${date}`;
}

function formatTaskDetails(task: Task): string {
  const priorityLabel =
    task.priority === 1
      ? "Critical"
      : task.priority === 2
        ? "High"
        : task.priority === 3
          ? "Medium"
          : task.priority === 4
            ? "Low"
            : "None";

  const priorityDisplay =
    task.priority === 0
      ? `${pc.dim("Priority:")}  None`
      : `${pc.dim("Priority:")}  P${task.priority} - ${priorityLabel}`;

  return [
    "",
    pc.bold("Task Details"),
    "─".repeat(40),
    `${pc.dim("ID:")}        ${task.id}`,
    `${pc.dim("Title:")}     ${task.title}`,
    priorityDisplay,
    `${pc.dim("Status:")}    ${task.completed ? "Completed" : task.inbox ? "In Inbox" : "Active"}`,
    `${pc.dim("Created:")}   ${task.createdAt.toLocaleString()}`,
    task.completedAt
      ? `${pc.dim("Completed:")} ${task.completedAt.toLocaleString()}`
      : "",
    "─".repeat(40),
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Task management functions
async function addTask(title?: string, priority?: number): Promise<void> {
  const taskTitle =
    title ||
    ((await text({
      message: "Enter task title",
      validate: (value) => {
        if (!value) return "Please enter a title";
        return;
      },
    })) as string);

  if (isCancel(taskTitle)) process.exit(0);

  // If no priority was provided and we're in interactive mode, ask for it
  let taskPriority = priority;
  if (taskPriority === undefined && !title) {
    const setPriority = await select({
      message: "Set priority now?",
      options: [
        { value: "no", label: "No, add to inbox" },
        { value: "1", label: "P1 - Critical" },
        { value: "2", label: "P2 - High" },
        { value: "3", label: "P3 - Medium" },
        { value: "4", label: "P4 - Low" },
      ],
    });

    if (!isCancel(setPriority) && setPriority !== "no") {
      taskPriority = parseInt(setPriority);
    }
  }

  const task = await storage.addTask({
    title: taskTitle,
    priority: taskPriority || DEFAULT_PRIORITY,
    inbox: taskPriority ? false : DEFAULT_INBOX, // If priority is set, don't put in inbox
    completed: false,
    createdAt: new Date(),
  });

  console.log(pc.green("\n✓ Task added" + (task.inbox ? " to inbox" : "")));
  console.log(formatTaskDetails(task));
}

async function assignPriority(taskId: number): Promise<void> {
  const task = await storage.getTask(taskId);
  if (!task) {
    console.log(pc.red("Task not found"));
    return;
  }

  const priority = (await select({
    message: "Select priority",
    options: [
      { value: 1, label: "1 - Critical" },
      { value: 2, label: "2 - High" },
      { value: 3, label: "3 - Medium" },
      { value: 4, label: "4 - Low" },
    ],
  })) as number;

  if (isCancel(priority)) return;

  task.priority = priority;
  task.inbox = false; // Move out of inbox when priority is assigned
  task.updatedAt = new Date();
  await storage.updateTask(task);
  console.log(
    pc.green(`Task priority set to ${priority} and moved out of inbox`)
  );
}

async function showInteractiveTaskList(
  tasks: Task[],
  allowComplete: boolean = true
): Promise<void> {
  if (tasks.length === 0) {
    note("No tasks found", "Empty");
    return;
  }

  // Sort tasks by priority (0 priority goes last)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority === 0) return 1;
    if (b.priority === 0) return -1;
    return a.priority - b.priority;
  });

  if (!allowComplete) {
    // For completed tasks (log), just show the list
    console.log(""); // Empty line for spacing
    sortedTasks.forEach((task) => {
      console.log(formatTaskLabel(task));
    });
    console.log(""); // Empty line for spacing
    return;
  }

  // For active tasks, show interactive multiselect
  const selected = (await multiselect({
    message: "Select tasks to complete (space to select)",
    options: sortedTasks.map((task) => ({
      value: task.id.toString(),
      label: formatTaskLabel(task, true), // Show dates for active tasks
    })),
    required: false,
  })) as string[];

  if (isCancel(selected)) return;

  if (selected.length > 0) {
    for (const id of selected) {
      const task = await storage.getTask(parseInt(id));
      if (task) {
        task.completed = true;
        task.completedAt = new Date();
        await storage.updateTask(task);
      }
    }
    console.log(
      pc.green(
        `\n✓ Completed ${selected.length} ${selected.length === 1 ? "task" : "tasks"}`
      )
    );
  }
}

async function showInbox(): Promise<void> {
  const tasks = await storage.getTasks();
  const inboxTasks = tasks.filter((t) => t.inbox && !t.completed);

  if (inboxTasks.length === 0) {
    note("No tasks in inbox", "Empty");
    return;
  }

  while (true) {
    // Show all inbox tasks
    console.log("\nInbox tasks:");
    inboxTasks.forEach((task) => {
      console.log(formatTaskLabel(task));
    });
    console.log(""); // Empty line for spacing

    // Select a task to process
    const taskToProcess = await select({
      message: "Select a task to process (or ESC to exit)",
      options: [
        ...inboxTasks.map((task) => ({
          value: task.id.toString(),
          label: formatTaskLabel(task),
        })),
      ],
    });

    if (isCancel(taskToProcess)) break;

    // Process the selected task
    const selectedTask = inboxTasks.find(
      (t) => t.id.toString() === taskToProcess
    );
    if (!selectedTask) continue;

    console.log("\n" + formatTaskDetails(selectedTask));

    const action = await select({
      message: "What would you like to do with this task?",
      options: [
        { value: "p1", label: "Set Priority 1 - Critical" },
        { value: "p2", label: "Set Priority 2 - High" },
        { value: "p3", label: "Set Priority 3 - Medium" },
        { value: "p4", label: "Set Priority 4 - Low" },
        { value: "complete", label: "Mark as completed" },
        { value: "back", label: "Back to inbox" },
      ],
    });

    if (isCancel(action) || action === "back") continue;

    if (action.startsWith("p")) {
      const priority = parseInt(action[1]);
      selectedTask.priority = priority;
      selectedTask.inbox = false;
      selectedTask.updatedAt = new Date();
      await storage.updateTask(selectedTask);
      console.log(
        pc.green(`✓ Priority set to ${priority} and moved out of inbox`)
      );
      // Remove task from inbox list
      inboxTasks.splice(inboxTasks.indexOf(selectedTask), 1);
    } else if (action === "complete") {
      selectedTask.completed = true;
      selectedTask.completedAt = new Date();
      await storage.updateTask(selectedTask);
      console.log(pc.green("✓ Task completed"));
      // Remove task from inbox list
      inboxTasks.splice(inboxTasks.indexOf(selectedTask), 1);
    }

    // If no more tasks in inbox, exit
    if (inboxTasks.length === 0) {
      note("No more tasks in inbox", "Empty");
      break;
    }
  }
}

async function main() {
  intro(pc.bold(`1234 CLI v${packageJson.default.version}`));

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "add") {
    // Parse add command arguments
    let title: string | undefined;
    let priority: number | undefined;

    // Find the title (everything between first argument and any flag)
    const flagIndex = args.findIndex((arg) => arg.startsWith("-"));
    if (flagIndex === -1) {
      // No flags, everything after 'add' is the title
      title = args.slice(1).join(" ");
    } else {
      // Title is everything between 'add' and the first flag
      title = args.slice(1, flagIndex).join(" ");
    }

    // Parse priority flag if present
    const priorityFlag = args.find(
      (arg) => arg === "-p" || arg === "--priority"
    );
    if (priorityFlag) {
      const priorityValue = args[args.indexOf(priorityFlag) + 1];
      if (priorityValue && /^[1-4]$/.test(priorityValue)) {
        priority = parseInt(priorityValue);
      } else {
        console.log(pc.red("Invalid priority. Must be between 1 and 4."));
        process.exit(1);
      }
    }

    await addTask(title || undefined, priority);
  } else if (command === "inbox") {
    await showInbox();
  } else if (command === "list") {
    const tasks = await storage.getTasks();
    const activeTasks = tasks.filter((t) => !t.inbox && !t.completed);
    await showInteractiveTaskList(activeTasks);
  } else if (command === "log") {
    const tasks = await storage.getTasks();
    const completedTasks = tasks.filter((t) => t.completed);
    await showInteractiveTaskList(completedTasks, false);
  } else if (command === "priority" && args[1]) {
    await assignPriority(parseInt(args[1]));
  } else {
    // Interactive mode
    const action = await select({
      message: "What would you like to do?",
      options: [
        { value: "add", label: "Add a new task" },
        { value: "inbox", label: "View and process inbox" },
        { value: "list", label: "List active tasks" },
        { value: "log", label: "View completed tasks" },
      ],
    });

    if (isCancel(action)) process.exit(0);

    switch (action) {
      case "add":
        await addTask();
        break;

      case "inbox":
        await showInbox();
        break;

      case "list": {
        const tasks = await storage.getTasks();
        const activeTasks = tasks.filter((t) => !t.inbox && !t.completed);
        await showInteractiveTaskList(activeTasks);
        break;
      }

      case "log": {
        const tasks = await storage.getTasks();
        const completedTasks = tasks.filter((t) => t.completed);
        await showInteractiveTaskList(completedTasks, false);
        break;
      }
    }
  }

  outro("Done!");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
