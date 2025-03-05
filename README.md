# 1234.sh - Simple Developer-Focused Todo CLI

A clean, minimal todo list CLI application designed for developers who want to stay focused.

## Features

- **Simple Task Management**: Just title, priority, and inbox status
- **Priority Levels**: Four levels of priority (1-4)
- **Inbox Concept**: Keep unprocessed tasks in your inbox
- **Distraction-Free**: No due dates, attachments, or complex features to manage
- **Intuitive Commands**: Simple 1-2-3-4 numbered operations for quick task management

## Project Structure

This monorepo contains:

- `apps/cli` - The core CLI tool
- `apps/docs` - Documentation site
- `apps/web` - Marketing website (1234.sh)
- `packages/core` - Shared business logic
- `packages/db` - Database interfaces (SQLite/Supabase)
- `packages/ui` - UI components for the web applications

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Installation Methods

```bash
# Using npm
npm install -g 1234-sh

# Using Homebrew
brew install 1234

# Direct install
curl -fsSL https://1234.sh/install | sh
```

## Usage

```bash
# Add a new task (automatically goes to inbox)
1234 add "Implement authentication"

# Add a task with priority 1 (highest)
1234 add "Fix critical bug" -p 1

# View your inbox
1234 inbox

# List all tasks
1234 list

# Mark a task as complete (automatically removes from inbox)
1234 complete 1

# Move a task in or out of inbox
1234 move 2 --inbox
1234 move 3 --no-inbox
```

## License

MIT
