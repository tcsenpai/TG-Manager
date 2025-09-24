// Task search functionality for the Telegram Task Bot
import type { BotContext } from '../../types/bot';
import type { TaskSearchResult } from '../../core/TaskManager';
import { TaskManager } from '../../core/TaskManager';
import { getStateIcon } from '../../utils/stateManager';

/**
 * Start task search flow
 */
export async function handleSearchTasks(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    `🔍 **Search Tasks**\n\n` +
    `Send me a keyword to search for in your tasks.\n` +
    `I'll search through task names and descriptions.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'main_menu' }]
        ]
      },
      parse_mode: 'Markdown'
    }
  );

  // Set user state for text input
  const userId = ctx.from?.id.toString();
  if (userId) {
    setUserState(userId, 'search_tasks', {});
  }
}

/**
 * Process search query
 */
export async function handleSearchQuery(
  ctx: BotContext,
  query: string,
  taskManager: TaskManager
): Promise<void> {
  if (query.length < 2) {
    await ctx.reply('⚠️ Search query must be at least 2 characters long. Please try again.');
    return;
  }

  if (query.length > 50) {
    await ctx.reply('⚠️ Search query too long (max 50 characters). Please try again.');
    return;
  }

  try {
    const results = await taskManager.searchTasks(query, true);

    if (results.length === 0) {
      await ctx.reply(
        `🔍 **Search Results**\n\n` +
        `No tasks found for "${query}".\n` +
        `Try different keywords or check your spelling.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 Search Again', callback_data: 'tasks_search' }],
              [{ text: '📋 View All Tasks', callback_data: 'tasks_list' }],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          },
          parse_mode: 'Markdown'
        }
      );
      return;
    }

    const searchText = formatSearchResults(results, query);
    const keyboard = createSearchResultsKeyboard(results);

    await ctx.reply(
      `🔍 **Search Results** (${results.length})\n\n` +
      `Found ${results.length} task(s) for "${query}":\n\n` +
      searchText,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('❌ Error searching tasks:', error);
    await ctx.reply(
      '⚠️ Error searching tasks. Please try again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'tasks_search' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * Format search results for display
 */
function formatSearchResults(results: TaskSearchResult[], query: string): string {
  return results
    .slice(0, 10) // Show max 10 results
    .map((result, index) => {
      const task = result.task;
      const icon = getStateIcon(task.state || 'todo');
      const name = task.name || 'Untitled';
      const matches = result.matches.join(', ');

      // Highlight search term in name (simple approach)
      const highlightedName = highlightSearchTerm(name, query);

      const pathText = result.path.length > 0
        ? ` (in task #${result.path[result.path.length - 1]})`
        : '';

      return `${index + 1}. ${icon} **${highlightedName}**${pathText}\n   _Matched: ${matches}_`;
    })
    .join('\n\n');
}

/**
 * Simple search term highlighting
 */
function highlightSearchTerm(text: string, query: string): string {
  if (!query || query.length < 2) return text;

  // Simple case-insensitive highlighting
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '*$1*');
}

/**
 * Create keyboard for search results
 */
function createSearchResultsKeyboard(results: TaskSearchResult[]) {
  const buttons = results.slice(0, 8).map((result, index) => [
    {
      text: `${index + 1}. ${getStateIcon(result.task.state || 'todo')} ${result.task.name || 'Untitled'}`,
      callback_data: `task_detail_${result.task.id}`
    }
  ]);

  if (results.length > 8) {
    buttons.push([{ text: '📄 Show More Results...', callback_data: 'search_more' }]);
  }

  buttons.push([
    { text: '🔍 New Search', callback_data: 'tasks_search' },
    { text: '📋 All Tasks', callback_data: 'tasks_list' }
  ]);

  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { inline_keyboard: buttons };
}

// Simple in-memory user state storage (same pattern as taskActions)
const userStates = new Map<string, { action: string; data: unknown }>();

function setUserState(userId: string, action: string, data: unknown): void {
  userStates.set(userId, { action, data });
}

export function getUserSearchState(userId: string): { action: string; data: unknown } | undefined {
  return userStates.get(userId);
}

export function clearUserSearchState(userId: string): void {
  userStates.delete(userId);
}