// User storage management with CLI compatibility and atomic operations
// Based on CLI-Manager/src/core/Storage.ts patterns

import { promises as fs } from 'fs';
import path from 'path';
import type { StorageFile, ITask, Meta } from '../types/cli';
import { DEFAULT_STORAGE_DATA } from '../types/cli';

export class UserStorage {
  private readonly userDir: string;
  private readonly tasksFile: string;
  private readonly backupDir: string;

  constructor(userId: string) {
    this.userDir = path.join(process.cwd(), 'users', userId);
    this.tasksFile = path.join(this.userDir, 'tasks.json');
    this.backupDir = path.join(this.userDir, '.backups');
  }

  /**
   * Initialize user directory and create default tasks.json if not exists
   * Matches CLI StorageFactory.init behavior
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.userDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      // Check if tasks.json exists, create default if not
      try {
        await fs.access(this.tasksFile);
      } catch {
        // File doesn't exist, create default directly (avoid recursive call)
        const jsonContent = JSON.stringify(DEFAULT_STORAGE_DATA, null, 2);
        await fs.writeFile(this.tasksFile, jsonContent, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to initialize user storage: ${error}`);
    }
  }

  /**
   * Load tasks.json file
   * Matches CLI Storage constructor file reading
   */
  async loadStorage(): Promise<StorageFile> {
    try {
      const fileContent = await fs.readFile(this.tasksFile, 'utf-8');
      const data = JSON.parse(fileContent) as StorageFile;

      // Validate structure matches CLI expectations
      if (!data.meta || !data.datas || !Array.isArray(data.meta.states) || !Array.isArray(data.datas)) {
        throw new Error('Invalid tasks.json structure');
      }

      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, initialize and return default
        await this.initialize();
        return DEFAULT_STORAGE_DATA;
      }
      throw new Error(`Failed to load tasks: ${error}`);
    }
  }

  /**
   * Save storage with atomic write operation
   * Matches CLI Storage.save() behavior
   */
  async saveStorage(data: StorageFile): Promise<void> {
    try {
      // Ensure directories exist without full initialization
      await fs.mkdir(this.userDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      const jsonContent = JSON.stringify(data, null, 2);
      const tempFile = `${this.tasksFile}.tmp`;

      // Atomic write: write to temp file, then rename
      await fs.writeFile(tempFile, jsonContent, 'utf-8');
      await fs.rename(tempFile, this.tasksFile);
    } catch (error) {
      throw new Error(`Failed to save tasks: ${error}`);
    }
  }

  /**
   * Create backup of current tasks.json
   * Returns backup file path
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `tasks-${timestamp}.json`);

      try {
        await fs.copyFile(this.tasksFile, backupFile);
        return backupFile;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          // Original file doesn't exist, create empty backup
          await fs.writeFile(backupFile, JSON.stringify(DEFAULT_STORAGE_DATA, null, 2));
          return backupFile;
        }
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Restore from backup file
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      await fs.copyFile(backupPath, this.tasksFile);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Detect if file has been modified since last load
   * Useful for sync conflict detection
   */
  async detectModification(lastModified: Date): Promise<boolean> {
    try {
      const stats = await fs.stat(this.tasksFile);
      return stats.mtime > lastModified;
    } catch {
      return false; // File doesn't exist or error, assume no modification
    }
  }

  /**
   * Get file modification time
   * Used for sync conflict detection
   */
  async getLastModified(): Promise<Date> {
    try {
      const stats = await fs.stat(this.tasksFile);
      return stats.mtime;
    } catch {
      return new Date(0); // Return epoch if file doesn't exist
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(file => file.startsWith('tasks-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first
    } catch {
      return [];
    }
  }

  /**
   * Clean old backups (keep last N)
   */
  async cleanupBackups(keepCount: number = 10): Promise<void> {
    try {
      const backups = await this.listBackups();
      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);
        for (const backup of toDelete) {
          await fs.unlink(path.join(this.backupDir, backup));
        }
      }
    } catch (error) {
      // Non-fatal error, just log
      console.warn(`Failed to cleanup backups: ${error}`);
    }
  }

  /**
   * Check if user has any tasks
   * Useful for onboarding flow
   */
  async isEmpty(): Promise<boolean> {
    try {
      const storage = await this.loadStorage();
      return storage.datas.length === 0;
    } catch {
      return true;
    }
  }

  /**
   * Get storage file path (useful for CLI testing)
   */
  getTasksFilePath(): string {
    return this.tasksFile;
  }

  /**
   * Get user directory path
   */
  getUserDirectory(): string {
    return this.userDir;
  }
}