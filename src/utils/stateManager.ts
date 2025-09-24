// Task state management matching CLI-Manager behavior
// Based on CLI-Manager/src/core/TaskList.ts incrementTask logic

import { TaskState, DEFAULT_TASK_STATES } from '../types/cli';

/**
 * Get next state in progression: todo → currently_doing → done
 * Matches CLI incrementTask logic exactly
 */
export function getNextState(currentState: string, availableStates: TaskState[]): string | null {
  const currentIndex = availableStates.findIndex(state => state.name === currentState);

  if (currentIndex === -1) {
    throw new Error(`Unknown state: ${currentState}`);
  }

  // If already at final state, return null (matches CLI NoFurtherStateError)
  if (currentIndex === availableStates.length - 1) {
    return null;
  }

  // Return next state in sequence
  return availableStates[currentIndex + 1]!.name;
}

/**
 * Get final state (for "check" operation)
 * Matches CLI check action: set to last available state
 */
export function getFinalState(availableStates: TaskState[]): string {
  return availableStates[availableStates.length - 1]!.name;
}

/**
 * Validate state exists in available states
 * Matches CLI TaskStateUnknownError validation
 */
export function validateState(state: string, availableStates: TaskState[]): boolean {
  return availableStates.some(s => s.name === state);
}

/**
 * Get state display info (icon and color)
 * Matches CLI TaskState interface
 */
export function getStateInfo(stateName: string, availableStates: TaskState[]): TaskState | null {
  return availableStates.find(state => state.name === stateName) || null;
}

/**
 * Check if state is final state
 * Useful for formatting (strikethrough for completed tasks)
 */
export function isFinalState(stateName: string, availableStates: TaskState[]): boolean {
  const finalState = getFinalState(availableStates);
  return stateName === finalState;
}

/**
 * Get default starting state
 * Matches CLI default behavior (first state)
 */
export function getDefaultState(availableStates: TaskState[] = DEFAULT_TASK_STATES): string {
  return availableStates[0]!.name;
}

/**
 * Get state icon for display
 * Convenience function for UI components
 */
export function getStateIcon(stateName: string, availableStates: TaskState[] = DEFAULT_TASK_STATES): string {
  const stateInfo = getStateInfo(stateName, availableStates);
  return stateInfo?.icon || '?';
}

/**
 * Get state display name (for user-friendly display)
 * Converts internal state names to user-friendly names
 */
export function getStateDisplayName(stateName: string): string {
  switch (stateName) {
    case 'todo':
      return 'Todo';
    case 'currently_doing':
      return 'Currently Doing';
    case 'done':
      return 'Done';
    default:
      return stateName;
  }
}