// TypeScript interfaces matching CLI-Manager exact structure for perfect compatibility

export interface ITask {
  name?: string;
  description?: string;
  id?: number;
  subtasks?: ITask[];
  timestamp?: string;
  state?: string;
  priority?: number;
}

export interface TaskState {
  name: string;
  hexColor: string;
  icon: string;
}

export interface Meta {
  states: TaskState[];
}

export interface StorageFile {
  meta: Meta;
  datas: ITask[];
}

// Default CLI-compatible states and structure
export const DEFAULT_TASK_STATES: TaskState[] = [
  {
    name: 'todo',
    hexColor: '#ff8f00',
    icon: '☐',
  },
  {
    name: 'currently_doing',
    hexColor: '#ab47bc',
    icon: '✹',
  },
  {
    name: 'done',
    hexColor: '#66bb6a',
    icon: '✔',
  },
];

export const DEFAULT_STORAGE_DATA: StorageFile = {
  meta: {
    states: DEFAULT_TASK_STATES,
  },
  datas: [],
};

// CLI-compatible timestamp format
export const TIMESTAMP_FORMAT = 'DD/MM/YYYY';

// Task creation defaults
export const DEFAULT_TASK_STATE = 'todo';