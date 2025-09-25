// Configuration menu handlers for the Telegram Task Bot
import type { BotContext } from '../../types/bot';
import { UserConfig } from '../../core/UserConfig';

/**
 * Display main configuration menu
 */
export async function handleConfigMenu(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userConfig = new UserConfig(userId);
    await userConfig.initialize();
    const config = userConfig.getConfig();

    const configText = formatConfigMenu(config);
    const keyboard = createConfigMenuKeyboard(config);

    await ctx.editMessageText(
      `⚙️ **Configuration**\\n\\n${configText}\\n\\n💡 _Tap options to toggle settings_`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('❌ Error loading config:', error);
    await ctx.editMessageText(
      '⚠️ Error loading configuration. Please try again.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Retry', callback_data: 'config_menu' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  }
}

/**
 * Toggle hide completed tasks setting
 */
export async function handleToggleHideCompleted(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userConfig = new UserConfig(userId);
    await userConfig.initialize();

    const newValue = await userConfig.toggleHideCompleted();
    const statusText = newValue ? '✅ Enabled' : '❌ Disabled';

    await ctx.answerCbQuery(`Hide completed tasks: ${statusText}`, { show_alert: false });

    // Refresh the config menu
    await handleConfigMenu(ctx);
  } catch (error) {
    console.error('❌ Error toggling hide completed:', error);
    await ctx.answerCbQuery('⚠️ Error updating setting', { show_alert: true });
  }
}

/**
 * Reset configuration to defaults
 */
export async function handleResetConfig(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  await ctx.editMessageText(
    '🔄 **Reset Configuration**\\n\\n' +
    '⚠️ This will reset all your settings to defaults.\\n\\n' +
    '**Are you sure?**',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Yes, Reset', callback_data: 'config_reset_confirm' },
            { text: '❌ Cancel', callback_data: 'config_menu' }
          ]
        ]
      },
      parse_mode: 'Markdown'
    }
  );
}

/**
 * Confirm configuration reset
 */
export async function handleResetConfigConfirm(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.editMessageText('❌ Unable to identify user.');
    return;
  }

  try {
    const userConfig = new UserConfig(userId);
    await userConfig.initialize();
    await userConfig.resetToDefaults();

    await ctx.answerCbQuery('✅ Settings reset to defaults', { show_alert: true });

    // Return to config menu
    await handleConfigMenu(ctx);
  } catch (error) {
    console.error('❌ Error resetting config:', error);
    await ctx.answerCbQuery('⚠️ Error resetting configuration', { show_alert: true });
  }
}

/**
 * Format configuration menu display text
 */
function formatConfigMenu(config: any): string {
  const hideCompletedIcon = config.hideCompleted ? '🙈' : '👁️';
  const hideCompletedStatus = config.hideCompleted ? '**Hidden**' : '**Visible**';

  return `**Display Settings:**\\n` +
    `${hideCompletedIcon} Completed tasks: ${hideCompletedStatus}`;
}

/**
 * Create configuration menu keyboard
 */
function createConfigMenuKeyboard(config: any) {
  const hideCompletedText = config.hideCompleted
    ? '🙈 Hide Completed (ON)'
    : '👁️ Hide Completed (OFF)';

  return {
    inline_keyboard: [
      // Display settings
      [{ text: hideCompletedText, callback_data: 'config_toggle_hide_completed' }],

      // Future config options can be added here
      // [{ text: '🔄 Sort Order', callback_data: 'config_sort_order' }],
      // [{ text: '🎨 Theme', callback_data: 'config_theme' }],

      // Reset and navigation
      [{ text: '🔄 Reset to Defaults', callback_data: 'config_reset' }],
      [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
    ]
  };
}