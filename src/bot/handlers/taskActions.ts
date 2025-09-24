// Task action handlers (add, edit, delete, status changes)
import type { BotContext } from '../../types/bot';
import { UserStorage } from '../../core/UserStorage';
import { TaskManager } from '../../core/TaskManager';

/**
 * Handle task status increment (todo -> doing -> done)
 */
export async function handleTaskNext(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await taskManager.incrementTask([taskId]);
    const updatedTask = await taskManager.getTask(taskId);

    await ctx.answerCbQuery(`✅ Task updated to: ${updatedTask.state}`);

    // Redirect to updated task detail
    const { handleTaskDetail } = await import('./taskList');
    await handleTaskDetail(ctx, taskId);
  } catch (error) {
    console.error(`❌ Error updating task ${taskId}:`, error);
    await ctx.answerCbQuery('⚠️ Error updating task');
  }
}

/**
 * Handle task completion (mark as done)
 */
export async function handleTaskComplete(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await taskManager.completeTask([taskId]);

    await ctx.answerCbQuery('🎉 Task completed!');

    // Redirect to updated task detail
    const { handleTaskDetail } = await import('./taskList');
    await handleTaskDetail(ctx, taskId);
  } catch (error) {
    console.error(`❌ Error completing task ${taskId}:`, error);
    await ctx.answerCbQuery('⚠️ Error completing task');
  }
}

/**
 * Start add task flow
 */
export async function handleAddTask(ctx: BotContext, parentId?: number): Promise<void> {
  await ctx.answerCbQuery();

  const parentText = parentId ? ` (subtask of #${parentId})` : '';

  await ctx.editMessageText(
    `➕ **Add New Task**${parentText}\n\n` +
    `Please send me the task name:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: parentId ? `task_detail_${parentId}` : 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );

  // Set user state for text input
  const userId = ctx.from?.id.toString();
  if (userId) {
    // Store the add task state (we'll implement user session storage)
    setUserState(userId, 'add_task', { parentId });
  }
}

/**
 * Start edit task flow
 */
export async function handleEditTask(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const task = await taskManager.getTask(taskId);

    await ctx.editMessageText(
      `✏️ **Edit Task #${taskId}**\n\n` +
      `**Current Name:** ${task.name || 'Untitled'}\n` +
      `**Current Description:** ${task.description || 'No description'}\n\n` +
      `What would you like to edit?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Edit Name', callback_data: `task_edit_name_${taskId}` }],
            [{ text: '📄 Edit Description', callback_data: `task_edit_desc_${taskId}` }],
            [{ text: '🔄 Change Status', callback_data: `task_edit_status_${taskId}` }],
            [{ text: '❌ Cancel', callback_data: `task_detail_${taskId}` }]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error(`❌ Error loading task for edit ${taskId}:`, error);
    await ctx.answerCbQuery('⚠️ Error loading task');
  }
}

/**
 * Handle edit task name
 */
export async function handleEditTaskName(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    `✏️ **Edit Task Name**\n\n` +
    `Please send me the new name for task #${taskId}:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: `task_edit_${taskId}` }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );

  // Set user state for text input
  const userId = ctx.from?.id.toString();
  if (userId) {
    setUserState(userId, 'edit_task_name', { taskId });
  }
}

/**
 * Handle edit task description
 */
export async function handleEditTaskDescription(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    `📄 **Edit Task Description**\n\n` +
    `Please send me the new description for task #${taskId}:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🗑️ Remove Description', callback_data: `task_clear_desc_${taskId}` }],
          [{ text: '❌ Cancel', callback_data: `task_edit_${taskId}` }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );

  // Set user state for text input
  const userId = ctx.from?.id.toString();
  if (userId) {
    setUserState(userId, 'edit_task_desc', { taskId });
  }
}

/**
 * Handle delete task confirmation
 */
export async function handleDeleteTaskConfirm(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const task = await taskManager.getTask(taskId);

    const subtaskWarning = task.subtasks && task.subtasks.length > 0
      ? `\n\n⚠️ **Warning:** This will also delete ${task.subtasks.length} subtask(s).`
      : '';

    await ctx.editMessageText(
      `🗑️ **Delete Task**\n\n` +
      `Are you sure you want to delete:\n` +
      `**${task.name || 'Untitled'}**?${subtaskWarning}\n\n` +
      `⚠️ This action cannot be undone.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🗑️ Yes, Delete', callback_data: `task_delete_${taskId}` },
              { text: '❌ Cancel', callback_data: `task_detail_${taskId}` }
            ]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error(`❌ Error loading task for delete ${taskId}:`, error);
    await ctx.answerCbQuery('⚠️ Error loading task');
  }
}

/**
 * Handle actual task deletion
 */
export async function handleDeleteTask(ctx: BotContext, taskId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await taskManager.deleteTask([taskId]);

    await ctx.editMessageText(
      '✅ **Task Deleted**\n\n' +
      'The task has been successfully deleted.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 View Tasks', callback_data: 'tasks_list' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error(`❌ Error deleting task ${taskId}:`, error);
    await ctx.answerCbQuery('⚠️ Error deleting task');
  }
}

/**
 * Handle text messages from users (for adding/editing tasks)
 */
export async function handleTextMessage(ctx: BotContext): Promise<void> {
  const userId = ctx.from?.id.toString();
  if (!userId || !ctx.message || !('text' in ctx.message)) {
    return;
  }

  const text = ctx.message.text.trim();
  const userState = getUserState(userId);

  if (!userState) {
    // No active state - show help
    await ctx.reply(
      '💡 To manage tasks, use the /start command or the buttons below:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    switch (userState.action) {
      case 'add_task':
        await handleAddTaskText(ctx, text, taskManager, (userState.data as { parentId?: number }).parentId);
        break;
      case 'edit_task_name':
        await handleEditTaskNameText(ctx, text, taskManager, (userState.data as { taskId: number }).taskId);
        break;
      case 'edit_task_desc':
        await handleEditTaskDescText(ctx, text, taskManager, (userState.data as { taskId: number }).taskId);
        break;
      default:
        await ctx.reply('⚠️ Invalid action. Please start over.');
    }

    // Clear user state
    clearUserState(userId);
  } catch (error) {
    console.error('❌ Error processing text message:', error);
    await ctx.reply('⚠️ Error processing your request. Please try again.');
    clearUserState(userId);
  }
}

/**
 * Process add task text input
 */
async function handleAddTaskText(
  ctx: BotContext,
  text: string,
  taskManager: TaskManager,
  parentId?: number
): Promise<void> {
  if (text.length < 1) {
    await ctx.reply('⚠️ Task name cannot be empty. Please try again.');
    return;
  }

  if (text.length > 100) {
    await ctx.reply('⚠️ Task name too long (max 100 characters). Please try again.');
    return;
  }

  const taskId = await taskManager.addTask({ name: text }, parentId);

  const parentText = parentId ? ` as subtask of #${parentId}` : '';
  await ctx.reply(
    `✅ **Task Created**\n\n` +
    `Task #${taskId} "${text}" has been added${parentText}.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👁️ View Task', callback_data: `task_detail_${taskId}` }],
          [{ text: '📋 All Tasks', callback_data: 'tasks_list' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );
}

/**
 * Process edit task name text input
 */
async function handleEditTaskNameText(
  ctx: BotContext,
  text: string,
  taskManager: TaskManager,
  taskId: number
): Promise<void> {
  if (text.length < 1) {
    await ctx.reply('⚠️ Task name cannot be empty. Please try again.');
    return;
  }

  if (text.length > 100) {
    await ctx.reply('⚠️ Task name too long (max 100 characters). Please try again.');
    return;
  }

  await taskManager.editTask([taskId], { name: text });

  await ctx.reply(
    `✅ **Task Updated**\n\n` +
    `Task #${taskId} name updated to "${text}".`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👁️ View Task', callback_data: `task_detail_${taskId}` }],
          [{ text: '📋 All Tasks', callback_data: 'tasks_list' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );
}

/**
 * Process edit task description text input
 */
async function handleEditTaskDescText(
  ctx: BotContext,
  text: string,
  taskManager: TaskManager,
  taskId: number
): Promise<void> {
  if (text.length > 500) {
    await ctx.reply('⚠️ Description too long (max 500 characters). Please try again.');
    return;
  }

  await taskManager.editTask([taskId], { description: text });

  await ctx.reply(
    `✅ **Task Updated**\n\n` +
    `Task #${taskId} description has been updated.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👁️ View Task', callback_data: `task_detail_${taskId}` }],
          [{ text: '📋 All Tasks', callback_data: 'tasks_list' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );
}

// Simple in-memory user state storage (in production, use Redis or similar)
const userStates = new Map<string, { action: string; data: unknown }>();

function setUserState(userId: string, action: string, data: unknown): void {
  userStates.set(userId, { action, data });
}

function getUserState(userId: string): { action: string; data: unknown } | undefined {
  return userStates.get(userId);
}

function clearUserState(userId: string): void {
  userStates.delete(userId);
}