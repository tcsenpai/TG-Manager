// Main menu handler for the Telegram Task Bot
import type { BotContext } from '../../types/bot';
import { UserStorage } from '../../core/UserStorage';
import { TaskManager } from '../../core/TaskManager';

/**
 * Main menu keyboard layout
 */
export function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📝 List View', callback_data: 'tasks_list' },
        { text: '🌳 Tree View', callback_data: 'tasks_tree' }
      ],
      [
        { text: '➕ Add Task', callback_data: 'task_add' },
        { text: '🔍 Search', callback_data: 'tasks_search' }
      ],
      [
        { text: '📊 Statistics', callback_data: 'tasks_stats' },
        { text: '❓ Help', callback_data: 'help_main' }
      ]
    ]
  };
}

/**
 * Enhanced start command with user setup
 */
export async function handleStart(ctx: BotContext): Promise<void> {
  const userName = ctx.from?.first_name || 'User';
  const userId = ctx.from?.id.toString();

  if (!userId) {
    await ctx.reply('❌ Unable to identify user. Please try again.');
    return;
  }

  try {
    // Initialize user storage
    const userStorage = new UserStorage(userId);
    await userStorage.initialize();

    // Get task count for personalized welcome
    const taskManager = new TaskManager(userStorage);
    const tasks = await taskManager.getAllTasks();
    const taskCount = tasks.length;

    const welcomeMessage = taskCount > 0
      ? `👋 Welcome back ${userName}! You have ${taskCount} tasks.`
      : `👋 Hello ${userName}! Welcome to your Task Manager Bot!`;

    await ctx.reply(
      `${welcomeMessage}\n\n` +
      `🎯 This bot replicates your CLI task manager for mobile access.\n` +
      `📱 All tasks sync with your desktop through your existing sync setup.\n\n` +
      `🚀 Ready to manage your tasks!`,
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
  } catch (error) {
    console.error('❌ Error in start handler:', error);
    await ctx.reply(
      '⚠️ Welcome! There was an issue setting up your tasks, but you can still use the bot.',
      {
        reply_markup: getMainMenuKeyboard()
      }
    );
  }
}

/**
 * Return to main menu
 */
export async function handleMainMenu(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userName = ctx.from?.first_name || 'User';
  await ctx.editMessageText(
    `👋 ${userName} - Main Menu\n\n` +
    `Choose an option below to manage your tasks:`,
    {
      reply_markup: getMainMenuKeyboard()
    }
  );
}

/**
 * Help handler
 */
export async function handleHelp(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    `🤖 Task Manager Bot Help\n\n` +
    `📋 **Features:**\n` +
    `• Create and manage tasks with subtasks\n` +
    `• Three states: ☐ Todo → ✹ Doing → ✔ Done\n` +
    `• Search through task names and descriptions\n` +
    `• View task statistics and progress\n` +
    `• Perfect sync with CLI task manager\n\n` +
    `🎯 **Task States:**\n` +
    `• ☐ **Todo** - Not started yet\n` +
    `• ✹ **Currently Doing** - In progress\n` +
    `• ✔ **Done** - Completed\n\n` +
    `💡 **Tips:**\n` +
    `• Use buttons for the best mobile experience\n` +
    `• Tasks automatically sync with your desktop\n` +
    `• Long press task names for quick actions`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );
}