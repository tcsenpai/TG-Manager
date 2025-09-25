// Download handler for tasks.json file
import type { BotContext } from '../../types/bot';
import { UserStorage } from '../../core/UserStorage';
import { TaskManager } from '../../core/TaskManager';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Handle tasks.json file download
 */
export async function handleDownloadJson(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);
    
    // Get tasks and stats for info
    const tasks = await taskManager.getAllTasks();
    const stats = await taskManager.getStats();
    
    // Get the tasks.json file path
    const tasksFilePath = join('users', userId, 'tasks.json');
    
    // Read the actual JSON file to send
    const jsonContent = await readFile(tasksFilePath, 'utf-8');
    
    // Create a buffer from the JSON content
    const fileBuffer = Buffer.from(jsonContent, 'utf-8');
    
    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const filename = `tasks_${timestamp}.json`;
    
    // Send file to user
    await ctx.replyWithDocument({
      source: fileBuffer,
      filename: filename
    }, {
      caption: `📄 Your tasks.json file\n\n` +
               `📊 **Contents:**\n` +
               `• Total tasks: ${stats.total}\n` +
               `• Todo: ${stats.todo}\n` +
               `• Doing: ${stats.currently_doing}\n` +
               `• Done: ${stats.done}\n\n` +
               `💾 **File:** ${filename}\n` +
               `🕐 **Exported:** ${now.toLocaleString()}\n\n` +
               `ℹ️ This file is compatible with your CLI task manager.`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });

    // Also edit the original message to confirm
    await ctx.editMessageText(
      `✅ **Download Complete**\n\n` +
      `📄 Your tasks.json file has been sent!\n` +
      `📊 Contains ${stats.total} tasks\n\n` +
      `💡 You can use this file with your CLI task manager or as a backup.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💾 Download Again', callback_data: 'download_json' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('❌ Error downloading tasks.json:', error);
    
    await ctx.editMessageText(
      '⚠️ **Download Failed**\n\n' +
      'Unable to prepare your tasks.json file for download.\n' +
      'This might happen if:\n' +
      '• No tasks file exists yet\n' +
      '• File access permissions issue\n\n' +
      'Try creating a task first, then download again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add First Task', callback_data: 'task_add' }],
            [{ text: '🔄 Try Again', callback_data: 'download_json' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}