// Telegram bot specific types and interfaces

import { Context as TelegrafContext } from 'telegraf';

// Extended Telegram context with our custom properties
export interface BotContext extends TelegrafContext {
  // Keep it simple - we'll instantiate storage/manager in handlers as needed
}

// Button callback data patterns
export interface TaskAction {
  action: 'view' | 'add' | 'edit' | 'delete' | 'status' | 'move';
  taskId: number;
  parentId?: number;
}

// Navigation context for hierarchical task viewing
export interface NavigationContext {
  currentTaskId?: number;
  parentPath: number[]; // Breadcrumb trail
  depth: number;
}

// Search context
export interface SearchQuery {
  query: string;
  includeDescriptions: boolean;
  caseSensitive: boolean;
}

// UI state for message editing
export interface UIState {
  messageId?: number;
  chatId: number;
  navigationContext: NavigationContext;
  lastAction?: string;
}

// Error types for user-friendly error handling
export enum BotErrorType {
  TASK_NOT_FOUND = 'task_not_found',
  INVALID_STATE = 'invalid_state',
  FILE_ERROR = 'file_error',
  SYNC_CONFLICT = 'sync_conflict',
  PERMISSION_ERROR = 'permission_error',
}

export interface BotError {
  type: BotErrorType;
  message: string;
  taskId?: number;
  details?: string;
}