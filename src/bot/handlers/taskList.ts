// Task list view handlers for the Telegram Task Bot
import type { BotContext } from '../../types/bot';
import type { ITask } from '../../types/cli';
import { UserStorage } from '../../core/UserStorage';
import { TaskManager } from '../../core/TaskManager';
import { getStateIcon, getStateDisplayName } from '../../utils/stateManager';

/**
 * Display tasks list with navigation
 */
export async function handleTasksList(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const tasks = await taskManager.getAllTasks();

    if (tasks.length === 0) {
      await ctx.editMessageText(
        `📋 **Your Tasks**\n\n` +
        `You don't have any tasks yet.\n` +
        `Create your first task to get started!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Add First Task', callback_data: 'task_add' }],
              [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        }
      );
      return;
    }

    const taskListText = formatTasksList(tasks);
    const keyboard = createTasksListKeyboard(tasks);

    await ctx.editMessageText(
      `📋 **Your Tasks** (${tasks.length})\n\n${taskListText}`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    await ctx.editMessageText(
      '⚠️ Error loading tasks. Please try again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: 'tasks_list' }],
            [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * View specific task details
 */
export async function handleTaskDetail(ctx: BotContext, taskId: number): Promise<void> {
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

    const taskText = formatTaskDetail(task);
    const keyboard = createTaskDetailKeyboard(task);

    await ctx.editMessageText(
      taskText,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error(`❌ Error loading task ${taskId}:`, error);
    await ctx.editMessageText(
      `⚠️ Task not found or error loading task.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Tasks', callback_data: 'tasks_list' }]
          ]
        }
      }
    );
  }
}

/**
 * Show all tasks in tree view (like CLI 'task' command)
 */
export async function handleTasksTree(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const tasks = await taskManager.getAllTasks();

    if (tasks.length === 0) {
      await ctx.editMessageText(
        `🌳 **Tree View**\n\n` +
        `No tasks found.\n` +
        `Create your first task to get started!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Add First Task', callback_data: 'task_add' }],
              [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        }
      );
      return;
    }

    const treeText = formatTasksTree(tasks);
    const stats = await taskManager.getStats();
    const statsText = formatTreeStats(stats);

    await ctx.editMessageText(
      `🌳 **Tree View** (${tasks.length} tasks)\n\n${treeText}\n\n${statsText}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 List View', callback_data: 'tasks_list' }],
            [{ text: '🔍 Search', callback_data: 'tasks_search' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('❌ Error loading tree view:', error);
    await ctx.editMessageText(
      '⚠️ Error loading tree view. Please try again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: 'tasks_tree' }],
            [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * Show task statistics
 */
export async function handleTasksStats(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const stats = await taskManager.getStats();

    const statsText = formatTasksStats(stats);

    await ctx.editMessageText(
      `📊 **Task Statistics**\n\n${statsText}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 View Tasks', callback_data: 'tasks_list' }],
            [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('❌ Error loading stats:', error);
    await ctx.editMessageText(
      '⚠️ Error loading statistics. Please try again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: 'tasks_stats' }],
            [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * Format tasks list for display
 */
function formatTasksList(tasks: ITask[]): string {
  return tasks
    .map(task => {
      const icon = getStateIcon(task.state || 'todo');
      const name = task.name || 'Untitled';
      const subtaskCount = task.subtasks?.length || 0;
      const subtaskText = subtaskCount > 0 ? ` (${subtaskCount} subtasks)` : '';

      return `${icon} **${name}**${subtaskText}`;
    })
    .join('\n');
}

/**
 * Format single task detail
 */
function formatTaskDetail(task: ITask): string {
  const icon = getStateIcon(task.state || 'todo');
  const name = task.name || 'Untitled';
  const state = getStateDisplayName(task.state || 'todo');
  const timestamp = task.timestamp || 'No date';
  const description = task.description || 'No description';
  const subtaskCount = task.subtasks?.length || 0;

  let text = `${icon} **${name}**\n\n`;
  text += `📅 **Created:** ${timestamp}\n`;
  text += `🏷️ **Status:** ${state}\n`;
  text += `📝 **Description:** ${description}\n`;

  if (subtaskCount > 0) {
    text += `📂 **Subtasks:** ${subtaskCount}\n`;
  }

  return text;
}

/**
 * Format task statistics
 */
function formatTasksStats(stats: Record<string, number>): string {
  const total = stats.total || 0;
  const todo = stats.todo || 0;
  const doing = stats.currently_doing || 0;
  const done = stats.done || 0;

  if (total === 0) {
    return 'No tasks found.';
  }

  const todoPercent = Math.round((todo / total) * 100);
  const doingPercent = Math.round((doing / total) * 100);
  const donePercent = Math.round((done / total) * 100);

  let text = `**Total Tasks:** ${total}\n\n`;
  text += `☐ **Todo:** ${todo} (${todoPercent}%)\n`;
  text += `✹ **Currently Doing:** ${doing} (${doingPercent}%)\n`;
  text += `✔ **Done:** ${done} (${donePercent}%)\n\n`;

  if (done > 0 && total > 0) {
    text += `🎯 **Progress:** ${donePercent}% complete`;
  }

  return text;
}

/**
 * Create keyboard for tasks list
 */
function createTasksListKeyboard(tasks: ITask[]) {
  const buttons = tasks.slice(0, 8).map(task => [
    {
      text: `${getStateIcon(task.state || 'todo')} ${task.name || 'Untitled'}`,
      callback_data: `task_detail_${task.id}`
    }
  ]);

  // Add navigation buttons
  buttons.push([
    { text: '➕ Add Task', callback_data: 'task_add' },
    { text: '🔍 Search', callback_data: 'tasks_search' }
  ]);

  if (tasks.length > 8) {
    buttons.push([{ text: '📄 Show More...', callback_data: 'tasks_list_more' }]);
  }

  buttons.push([
    { text: '🌳 Tree View', callback_data: 'tasks_tree' },
    { text: '📊 Statistics', callback_data: 'tasks_stats' }
  ]);

  buttons.push([
    { text: '🔙 Main Menu', callback_data: 'main_menu' }
  ]);

  return { inline_keyboard: buttons };
}

/**
 * Create keyboard for task detail view
 */
function createTaskDetailKeyboard(task: ITask) {
  const buttons = [];

  // Status change buttons
  const currentState = task.state || 'todo';
  if (currentState === 'todo') {
    buttons.push([{ text: '▶️ Start Task', callback_data: `task_next_${task.id}` }]);
  } else if (currentState === 'currently_doing') {
    buttons.push([{ text: '✅ Complete Task', callback_data: `task_complete_${task.id}` }]);
  }

  // Edit and delete buttons
  buttons.push([
    { text: '✏️ Edit', callback_data: `task_edit_${task.id}` },
    { text: '🗑️ Delete', callback_data: `task_delete_confirm_${task.id}` }
  ]);

  // Subtasks if any
  if (task.subtasks && task.subtasks.length > 0) {
    buttons.push([{ text: '📂 View Subtasks', callback_data: `task_subtasks_${task.id}` }]);
  } else {
    buttons.push([{ text: '➕ Add Subtask', callback_data: `task_add_subtask_${task.id}` }]);
  }

  // Navigation
  buttons.push([
    { text: '🔙 Back to Tasks', callback_data: 'tasks_list' },
    { text: '🏠 Main Menu', callback_data: 'main_menu' }
  ]);

  return { inline_keyboard: buttons };
}

/**
 * View subtasks of a parent task
 */
export async function handleTaskSubtasks(ctx: BotContext, parentId: number): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    const parentTask = await taskManager.getTask(parentId);

    if (!parentTask.subtasks || parentTask.subtasks.length === 0) {
      await ctx.editMessageText(
        `📂 **Subtasks of:** ${parentTask.name}\n\n` +
        `No subtasks found.\n` +
        `Add the first subtask to get started!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Add Subtask', callback_data: `task_add_subtask_${parentId}` }],
              [{ text: '🔙 Back to Task', callback_data: `task_detail_${parentId}` }]
            ]
          },
          parse_mode: 'Markdown'
        }
      );
      return;
    }

    const subtaskText = formatSubtasksList(parentTask.subtasks, parentTask.name || 'Task');
    const keyboard = createSubtasksKeyboard(parentTask.subtasks, parentId);

    await ctx.editMessageText(
      `📂 **Subtasks of:** ${parentTask.name}\n\n${subtaskText}`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error(`❌ Error loading subtasks for task ${parentId}:`, error);
    await ctx.editMessageText(
      `⚠️ Task not found or error loading subtasks.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Tasks', callback_data: 'tasks_list' }]
          ]
        }
      }
    );
  }
}

/**
 * Format subtasks list for display
 */
function formatSubtasksList(subtasks: ITask[], parentName: string): string {
  return subtasks
    .map((subtask, index) => {
      const icon = getStateIcon(subtask.state || 'todo');
      const name = subtask.name || 'Untitled';
      const description = subtask.description ? `\n   _${subtask.description}_` : '';

      return `${index + 1}. ${icon} **${name}**${description}`;
    })
    .join('\n\n');
}

/**
 * Create keyboard for subtasks view
 */
function createSubtasksKeyboard(subtasks: ITask[], parentId: number) {
  const buttons = subtasks.slice(0, 6).map((subtask, index) => [
    {
      text: `${index + 1}. ${getStateIcon(subtask.state || 'todo')} ${subtask.name || 'Untitled'}`,
      callback_data: `task_detail_${subtask.id}`
    }
  ]);

  // Add management buttons
  buttons.push([
    { text: '➕ Add Subtask', callback_data: `task_add_subtask_${parentId}` }
  ]);

  if (subtasks.length > 6) {
    buttons.push([{ text: '📄 Show More Subtasks...', callback_data: `task_subtasks_more_${parentId}` }]);
  }

  // Navigation
  buttons.push([
    { text: '🔙 Back to Task', callback_data: `task_detail_${parentId}` },
    { text: '🏠 Main Menu', callback_data: 'main_menu' }
  ]);

  return { inline_keyboard: buttons };
}

/**
 * Format tasks in tree structure (like CLI output)
 */
function formatTasksTree(tasks: ITask[]): string {
  return tasks
    .map((task, index) => {
      const icon = getStateIcon(task.state || 'todo');
      const name = task.name || 'Untitled';
      const description = task.description ? `\n   ${task.description}` : '';

      let taskLine = `${task.id}.	${icon} ${name}${description}`;

      // Add subtasks with tree structure
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskLines = task.subtasks.map((subtask, subIndex) => {
          const subIcon = getStateIcon(subtask.state || 'todo');
          const subName = subtask.name || 'Untitled';
          const isLast = subIndex === task.subtasks!.length - 1;
          const prefix = isLast ? '└──' : '├──';

          return `${subtask.id}.	${prefix} ${subIcon} ${subName}`;
        }).join('\n');

        taskLine += '\n' + subtaskLines;
      }

      return taskLine;
    })
    .join('\n\n');
}

/**
 * Format tree statistics (like CLI output)
 */
function formatTreeStats(stats: Record<string, number>): string {
  const total = stats.total || 0;
  if (total === 0) return '';

  const todo = stats.todo || 0;
  const doing = stats.currently_doing || 0;
  const done = stats.done || 0;

  const todoPercent = Math.round((todo / total) * 100);
  const doingPercent = Math.round((doing / total) * 100);
  const donePercent = Math.round((done / total) * 100);

  return `${todo} todo (${todoPercent}%) ► ${doing} currently_doing (${doingPercent}%) ► ${done} done (${donePercent}%) ❯ ${total}`;
}