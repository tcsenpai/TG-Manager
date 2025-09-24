# Telegram Task Bot

A mobile-first Telegram bot that replicates CLI-task-manager functionality while maintaining perfect compatibility with existing sync setups.

## Features

- 📱 **Mobile-Optimized UI**: Button-based interface designed for thumb-friendly interaction
- 🔄 **Perfect CLI Compatibility**: 100% JSON format compatibility with CLI-task-manager
- 📝 **Complete Task Management**: Add, edit, delete, and manage task states (todo → doing → done)
- 🌳 **Multiple Views**: List view, tree view, and statistics dashboard
- 🔍 **Full-Text Search**: Search across task names and descriptions
- 📂 **Subtask Support**: Nested task hierarchies with intuitive navigation
- 👤 **Per-User Storage**: Isolated task storage for each Telegram user
- ⚡ **Sync-Ready**: Leverages existing sync infrastructure (no built-in sync required)

## Quick Start

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your Telegram bot token
   ```

3. **Start development**
   ```bash
   bun run dev
   ```

4. **Build for production**
   ```bash
   bun run build
   ```

## Architecture

- **Runtime**: Bun for fast development and execution
- **Bot Framework**: Telegraf for modern TypeScript integration
- **Data Layer**: CLI-compatible JSON storage with atomic file operations
- **UI Layer**: Hierarchical inline keyboards for mobile navigation

## CLI Compatibility

This bot maintains perfect compatibility with the original CLI-task-manager, ensuring seamless integration with existing workflows and sync setups. Task data is stored in the exact same JSON format, allowing both CLI and bot to operate on the same data files.

## Credits

This project replicates the functionality of the excellent [CLI-Manager](https://github.com/MikyStar/CLI-Manager) by MikyStar, adapted for mobile access via Telegram while maintaining full compatibility with the original CLI tool.

## License

MIT License - see LICENSE file for details.