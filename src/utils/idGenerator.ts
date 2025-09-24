// ID generation algorithm matching CLI-Manager exactly
// Based on CLI-Manager/src/core/TaskList.ts createUniqueId logic

/**
 * Generate unique task ID matching CLI-Manager algorithm exactly
 * Algorithm from CLI: if maxID === array.length - 1, return array.length
 * Otherwise, find first available gap starting from 0
 */
export function generateTaskId(existingIds: number[]): number {
  if (existingIds.length === 0) {
    return 0;
  }

  const maxInArray = Math.max(...existingIds);

  // CLI logic: if max equals length-1, no gaps exist, return next sequential
  if (maxInArray === existingIds.length - 1) {
    return existingIds.length;
  }

  // CLI logic: find first gap starting from 0
  let id = 0;
  while (existingIds.includes(id)) {
    id++;
  }

  return id;
}

/**
 * Extract all IDs from task hierarchy (including subtasks)
 * Matches CLI straightTask() functionality
 */
export function extractAllIds(tasks: import('../types/cli').ITask[]): number[] {
  const ids: number[] = [];

  function extractFromTask(task: import('../types/cli').ITask): void {
    if (task.id !== undefined) {
      ids.push(task.id);
    }

    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(extractFromTask);
    }
  }

  tasks.forEach(extractFromTask);
  return ids;
}

/**
 * Validate that ID doesn't already exist in task hierarchy
 * Matches CLI TaskIdDuplicatedError check
 */
export function validateUniqueId(id: number, existingIds: number[]): boolean {
  return !existingIds.includes(id);
}