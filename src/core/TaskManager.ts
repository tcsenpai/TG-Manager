// Task management business logic matching CLI-Manager behavior
// Based on CLI-Manager/src/core/TaskList.ts and ActionHandler.ts

import type { ITask, StorageFile, Meta, TaskState } from '../types/cli';
import { DEFAULT_TASK_STATE } from '../types/cli';
import { UserStorage } from './UserStorage';
import { generateTaskId, extractAllIds } from '../utils/idGenerator';
import { getNextState, getFinalState, validateState, getDefaultState } from '../utils/stateManager';
import { generateTimestamp } from '../utils/timestamp';

// Error classes matching CLI error patterns
export class TaskNotFoundError extends Error {
  constructor(id: number) {
    super(`Task with id ${id} not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class TaskStateUnknownError extends Error {
  constructor(id: number, state: string) {
    super(`Unknown state "${state}" for task ${id}`);
    this.name = 'TaskStateUnknownError';
  }
}

export class NoFurtherStateError extends Error {
  constructor(id: number) {
    super(`Task ${id} is already in final state`);
    this.name = 'NoFurtherStateError';
  }
}

export class TaskIdDuplicatedError extends Error {
  constructor(id: number) {
    super(`Task ID ${id} already exists`);
    this.name = 'TaskIdDuplicatedError';
  }
}

export interface TaskSearchResult {
  task: ITask;
  path: number[]; // Path to task (parent IDs)
  matches: string[]; // What matched (name, description)
}

export class TaskManager {
  private storage: UserStorage;

  constructor(storage: UserStorage) {
    this.storage = storage;
  }

  /**
   * Add new task, matching CLI addTask logic
   * Returns generated task ID
   */
  async addTask(taskData: Partial<ITask>, parentId?: number): Promise<number> {
    const storageData = await this.storage.loadStorage();
    const allIds = extractAllIds(storageData.datas);

    // Generate unique ID matching CLI algorithm
    const id = taskData.id && !allIds.includes(taskData.id) ? taskData.id : generateTaskId(allIds);

    // Create task with CLI-compatible defaults
    const task: ITask = {
      id,
      name: taskData.name || 'Untitled Task',
      state: taskData.state || getDefaultState(storageData.meta.states),
      timestamp: generateTimestamp(),
      ...taskData, // Override with provided data
    };

    // Validate state exists
    if (!validateState(task.state!, storageData.meta.states)) {
      throw new TaskStateUnknownError(id, task.state!);
    }

    if (parentId !== undefined) {
      // Add as subtask
      const parent = this.findTaskById(parentId, storageData.datas);
      if (!parent.subtasks) {
        parent.subtasks = [];
      }
      parent.subtasks.push(task);
    } else {
      // Add as top-level task
      storageData.datas.push(task);
    }

    await this.storage.saveStorage(storageData);
    return id;
  }

  /**
   * Edit task properties, matching CLI editTask logic
   */
  async editTask(taskIds: number[], updates: Partial<ITask>, recursive = false): Promise<void> {
    const storageData = await this.storage.loadStorage();

    for (const taskId of taskIds) {
      const task = this.findTaskById(taskId, storageData.datas);

      // Validate state if being updated
      if (updates.state && !validateState(updates.state, storageData.meta.states)) {
        throw new TaskStateUnknownError(taskId, updates.state);
      }

      // Apply updates
      if (recursive && task.subtasks) {
        // Apply to task and all subtasks
        this.applyUpdatesRecursive(task, updates);
      } else {
        // Apply to task only
        Object.assign(task, updates);
      }
    }

    await this.storage.saveStorage(storageData);
  }

  /**
   * Delete task(s), matching CLI deleteTask logic
   */
  async deleteTask(taskIds: number[]): Promise<void> {
    const storageData = await this.storage.loadStorage();

    for (const taskId of taskIds) {
      let found = false;

      // Remove from top-level tasks
      const topLevelIndex = storageData.datas.findIndex(task => task.id === taskId);
      if (topLevelIndex !== -1) {
        storageData.datas.splice(topLevelIndex, 1);
        found = true;
      } else {
        // Remove from subtasks
        found = this.removeFromSubtasks(storageData.datas, taskId);
      }

      if (!found) {
        throw new TaskNotFoundError(taskId);
      }
    }

    await this.storage.saveStorage(storageData);
  }

  /**
   * Increment task state, matching CLI incrementTask logic
   */
  async incrementTask(taskIds: number[], recursive = false): Promise<void> {
    const storageData = await this.storage.loadStorage();

    for (const taskId of taskIds) {
      const task = this.findTaskById(taskId, storageData.datas);
      const nextState = getNextState(task.state!, storageData.meta.states);

      if (!nextState) {
        throw new NoFurtherStateError(taskId);
      }

      await this.editTask([taskId], { state: nextState }, recursive);
    }
  }

  /**
   * Mark task as completed (final state), matching CLI check action
   */
  async completeTask(taskIds: number[], recursive = false): Promise<void> {
    const storageData = await this.storage.loadStorage();
    const finalState = getFinalState(storageData.meta.states);

    await this.editTask(taskIds, { state: finalState }, recursive);
  }

  /**
   * Move task to different parent, matching CLI moveTask logic
   */
  async moveTask(taskIds: number[], newParentId: number): Promise<void> {
    const storageData = await this.storage.loadStorage();

    // Verify new parent exists
    this.findTaskById(newParentId, storageData.datas);

    for (const taskId of taskIds) {
      // Get the task and remove it from current location
      const task = this.findTaskById(taskId, storageData.datas);
      const taskCopy = JSON.parse(JSON.stringify(task));

      await this.deleteTask([taskId]);

      // Add to new parent
      const updatedStorage = await this.storage.loadStorage();
      const newParent = this.findTaskById(newParentId, updatedStorage.datas);

      if (!newParent.subtasks) {
        newParent.subtasks = [];
      }
      newParent.subtasks.push(taskCopy);

      await this.storage.saveStorage(updatedStorage);
    }
  }

  /**
   * Get single task by ID
   */
  async getTask(taskId: number): Promise<ITask> {
    const storageData = await this.storage.loadStorage();
    return this.findTaskById(taskId, storageData.datas);
  }

  /**
   * Get all tasks (flat list)
   */
  async getAllTasks(): Promise<ITask[]> {
    const storageData = await this.storage.loadStorage();
    return storageData.datas;
  }

  /**
   * Get subtasks of a parent task
   */
  async getSubtasks(parentId: number): Promise<ITask[]> {
    const parent = await this.getTask(parentId);
    return parent.subtasks || [];
  }

  /**
   * Search tasks by query (name and description)
   */
  async searchTasks(query: string, includeDescriptions = true): Promise<TaskSearchResult[]> {
    const storageData = await this.storage.loadStorage();
    const results: TaskSearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    function searchInTask(task: ITask, path: number[]): void {
      const matches: string[] = [];

      // Search in name
      if (task.name && searchTerms.some(term => task.name!.toLowerCase().includes(term))) {
        matches.push('name');
      }

      // Search in description
      if (includeDescriptions && task.description &&
          searchTerms.some(term => task.description!.toLowerCase().includes(term))) {
        matches.push('description');
      }

      if (matches.length > 0) {
        results.push({ task, path: [...path], matches });
      }

      // Search subtasks
      if (task.subtasks) {
        task.subtasks.forEach(subtask => searchInTask(subtask, [...path, task.id!]));
      }
    }

    storageData.datas.forEach(task => searchInTask(task, []));
    return results;
  }

  /**
   * Get task statistics
   */
  async getStats(): Promise<Record<string, number>> {
    const storageData = await this.storage.loadStorage();
    const stats: Record<string, number> = {};
    let totalTasks = 0;

    function countInTask(task: ITask): void {
      totalTasks++;
      const state = task.state || 'unknown';
      stats[state] = (stats[state] || 0) + 1;

      if (task.subtasks) {
        task.subtasks.forEach(countInTask);
      }
    }

    storageData.datas.forEach(countInTask);
    stats.total = totalTasks;

    return stats;
  }

  /**
   * Get storage metadata
   */
  async getMeta(): Promise<Meta> {
    const storageData = await this.storage.loadStorage();
    return storageData.meta;
  }

  // Private helper methods

  private findTaskById(id: number, tasks: ITask[]): ITask {
    for (const task of tasks) {
      if (task.id === id) {
        return task;
      }

      if (task.subtasks) {
        try {
          return this.findTaskById(id, task.subtasks);
        } catch {
          // Continue searching
        }
      }
    }

    throw new TaskNotFoundError(id);
  }

  private removeFromSubtasks(tasks: ITask[], targetId: number): boolean {
    for (const task of tasks) {
      if (task.subtasks) {
        const index = task.subtasks.findIndex(subtask => subtask.id === targetId);
        if (index !== -1) {
          task.subtasks.splice(index, 1);
          return true;
        }

        // Recursively search deeper
        if (this.removeFromSubtasks(task.subtasks, targetId)) {
          return true;
        }
      }
    }

    return false;
  }

  private applyUpdatesRecursive(task: ITask, updates: Partial<ITask>): void {
    Object.assign(task, updates);

    if (task.subtasks) {
      task.subtasks.forEach(subtask => this.applyUpdatesRecursive(subtask, updates));
    }
  }
}