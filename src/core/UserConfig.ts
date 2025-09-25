// User configuration management with persistent storage
// Manages per-user bot settings like display preferences

import { promises as fs } from 'fs';
import path from 'path';
import type { UserConfigData, ConfigFile } from '../types/config';
import { DEFAULT_USER_CONFIG } from '../types/config';
import { generateTimestamp } from '../utils/timestamp';

export class UserConfig {
  private readonly userDir: string;
  private readonly configFile: string;
  private readonly backupDir: string;
  private config: UserConfigData;

  constructor(userId: string) {
    this.userDir = path.join(process.cwd(), 'users', userId);
    this.configFile = path.join(this.userDir, 'config.json');
    this.backupDir = path.join(this.userDir, '.backups');
    this.config = { ...DEFAULT_USER_CONFIG };
  }

  /**
   * Initialize configuration - load existing or create default
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.userDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      // Try to load existing config
      try {
        await this.loadConfig();
      } catch {
        // Config doesn't exist, create default
        await this.saveConfig();
      }
    } catch (error) {
      throw new Error(`Failed to initialize user config: ${error}`);
    }
  }

  /**
   * Load configuration from file
   */
  private async loadConfig(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.configFile, 'utf-8');
      const configData = JSON.parse(fileContent) as ConfigFile;

      // Merge with defaults to handle new config options
      this.config = {
        ...DEFAULT_USER_CONFIG,
        ...configData.config,
      };
    } catch (error) {
      throw new Error(`Failed to load config: ${error}`);
    }
  }

  /**
   * Save configuration to file with backup
   */
  async saveConfig(): Promise<void> {
    try {
      const configData: ConfigFile = {
        version: '1.0',
        config: this.config,
        updatedAt: generateTimestamp(),
      };

      // Create backup if config exists
      try {
        await fs.access(this.configFile);
        const backupFile = path.join(
          this.backupDir,
          `config-${Date.now()}.json`
        );
        await fs.copyFile(this.configFile, backupFile);
      } catch {
        // File doesn't exist, no backup needed
      }

      // Write new config atomically
      const tempFile = this.configFile + '.tmp';
      const jsonContent = JSON.stringify(configData, null, 2);
      await fs.writeFile(tempFile, jsonContent, 'utf-8');
      await fs.rename(tempFile, this.configFile);

      // Clean up old backups (keep only last 5)
      await this.cleanupBackups();
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): UserConfigData {
    return { ...this.config };
  }

  /**
   * Update configuration and save
   */
  async updateConfig(updates: Partial<UserConfigData>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };
    await this.saveConfig();
  }

  /**
   * Get specific config value
   */
  get hideCompleted(): boolean {
    return this.config.hideCompleted;
  }

  /**
   * Set hide completed tasks setting
   */
  async setHideCompleted(value: boolean): Promise<void> {
    await this.updateConfig({ hideCompleted: value });
  }

  /**
   * Toggle hide completed tasks setting
   */
  async toggleHideCompleted(): Promise<boolean> {
    const newValue = !this.config.hideCompleted;
    await this.setHideCompleted(newValue);
    return newValue;
  }

  /**
   * Reset to default configuration
   */
  async resetToDefaults(): Promise<void> {
    this.config = { ...DEFAULT_USER_CONFIG };
    await this.saveConfig();
  }

  /**
   * Clean up old backup files (keep only last 5)
   */
  private async cleanupBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const configBackups = files
        .filter(f => f.startsWith('config-') && f.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      // Delete old backups beyond the first 5
      for (let i = 5; i < configBackups.length; i++) {
        const backupFile = configBackups[i];
        if (backupFile) {
          await fs.unlink(path.join(this.backupDir, backupFile));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}