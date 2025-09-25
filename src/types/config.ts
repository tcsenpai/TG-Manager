// User configuration types
export interface UserConfigData {
  // Display settings
  hideCompleted: boolean;

  // Future config options can be added here
  // showSubtaskCount: boolean;
  // sortBy: 'id' | 'name' | 'date' | 'state';
  // viewMode: 'list' | 'tree';
  // theme: 'light' | 'dark';
}

export const DEFAULT_USER_CONFIG: UserConfigData = {
  hideCompleted: false,  // Show completed tasks by default
};

export interface ConfigFile {
  version: string;
  config: UserConfigData;
  updatedAt: string;
}