// Telegram Task Bot - Main Entry Point
import 'dotenv/config';
import { Telegraf } from 'telegraf';
import type { BotContext } from './types/bot';

// Import handlers
import { handleStart, handleMainMenu, handleHelp } from './bot/handlers/mainMenu';
import { handleTasksList, handleTaskDetail, handleTasksStats, handleTaskSubtasks, handleTasksTree } from './bot/handlers/taskList';
import {
  handleTaskNext,
  handleTaskComplete,
  handleAddTask,
  handleEditTask,
  handleEditTaskName,
  handleEditTaskDescription,
  handleDeleteTaskConfirm,
  handleDeleteTask,
  handleTextMessage
} from './bot/handlers/taskActions';
import { handleSearchTasks, handleSearchQuery, getUserSearchState, clearUserSearchState } from './bot/handlers/taskSearch';
import {
  handleConfigMenu,
  handleToggleHideCompleted,
  handleResetConfig,
  handleResetConfigConfirm
} from './bot/handlers/configMenu';
import { handleDownloadJson } from './bot/handlers/downloadHandler';
import { UserStorage } from './core/UserStorage';
import { TaskManager } from './core/TaskManager';

// Validate required environment variables
const BOT_TOKEN = process.env.TG_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ TG_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Create bot instance
const bot = new Telegraf<BotContext>(BOT_TOKEN);

// Basic middleware for logging
bot.use((ctx, next) => {
  const user = ctx.from;
  const command = ctx.message && 'text' in ctx.message ? ctx.message.text : 'callback';
  console.log(`📱 ${user?.first_name} (${user?.id}): ${command}`);
  return next();
});

// Command handlers
bot.start(handleStart);
bot.help(async ctx => {
  await ctx.reply(
    `🤖 Task Manager Bot Help\n\n` +
    `📋 Commands:\n` +
    `• /start - Welcome message and main menu\n` +
    `• /tasks - View your task list\n` +
    `• /help - Show this help message\n\n` +
    `🔄 Features:\n` +
    `• Create and manage tasks\n` +
    `• Organize with subtasks\n` +
    `• Three states: Todo → Doing → Done\n` +
    `• Search through tasks\n` +
    `• Perfect sync with CLI tool\n\n` +
    `💡 Use buttons for the best mobile experience!`
  );
});

// Direct /tasks command
bot.command('tasks', handleTasksList);

// Text message handler (for adding/editing tasks)
bot.on('text', async ctx => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  // Check if user is in search mode
  const searchState = getUserSearchState(userId);
  if (searchState && searchState.action === 'search_tasks') {
    const text = ctx.message.text.trim();
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await handleSearchQuery(ctx, text, taskManager);
    clearUserSearchState(userId);
    return;
  }

  // Otherwise handle as regular text message (add/edit)
  await handleTextMessage(ctx);
});

// Main menu navigation
bot.action('main_menu', handleMainMenu);
bot.action('help_main', handleHelp);

// Task list handlers
bot.action('tasks_list', handleTasksList);
bot.action('tasks_tree', handleTasksTree);
bot.action('tasks_stats', handleTasksStats);
bot.action('tasks_search', handleSearchTasks);

// Configuration menu handlers
bot.action('config_menu', handleConfigMenu);
bot.action('config_toggle_hide_completed', handleToggleHideCompleted);
bot.action('config_reset', handleResetConfig);
bot.action('config_reset_confirm', handleResetConfigConfirm);

// Download handler
bot.action('download_json', handleDownloadJson);

// Task detail handlers
bot.action(/^task_detail_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleTaskDetail(ctx, taskId);
  }
});

// Task action handlers
bot.action('task_add', async ctx => await handleAddTask(ctx));
bot.action(/^task_add_subtask_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const parentId = parseInt(match[1]);
    await handleAddTask(ctx, parentId);
  }
});

bot.action(/^task_next_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleTaskNext(ctx, taskId);
  }
});

bot.action(/^task_complete_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleTaskComplete(ctx, taskId);
  }
});

// Task edit handlers
bot.action(/^task_edit_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleEditTask(ctx, taskId);
  }
});

bot.action(/^task_edit_name_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleEditTaskName(ctx, taskId);
  }
});

bot.action(/^task_edit_desc_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleEditTaskDescription(ctx, taskId);
  }
});

// Task delete handlers
bot.action(/^task_delete_confirm_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleDeleteTaskConfirm(ctx, taskId);
  }
});

bot.action(/^task_delete_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const taskId = parseInt(match[1]);
    await handleDeleteTask(ctx, taskId);
  }
});

// Subtask handlers
bot.action(/^task_subtasks_(\d+)$/, async ctx => {
  const match = ctx.match;
  if (match && match[1]) {
    const parentId = parseInt(match[1]);
    await handleTaskSubtasks(ctx, parentId);
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('⚠️ Sorry, something went wrong. Please try again.').catch(console.error);
});

// Start the bot
async function startBot(): Promise<void> {
  try {
    console.log('🚀 Starting Telegram Task Bot...');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    // Start polling
    await bot.launch();
    console.log('✅ Bot is running! Press Ctrl+C to stop.');
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot();