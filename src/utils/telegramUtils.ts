// Telegram utility functions for safe formatting and file handling

/**
 * Escape Markdown v2 special characters for safe parsing
 * Telegram's MarkdownV2 requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Escape basic Markdown special characters for legacy markdown parsing
 * Escapes: _ * [ ] ( ) ` 
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`]/g, '\\$&');
}

/**
 * Safe text formatting that removes problematic characters entirely
 * Use when escaping doesn't work properly
 */
export function sanitizeText(text: string): string {
  return text
    // Remove or replace problematic characters
    .replace(/[_*[\]()~`>#+=|{}.!]/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Format text as code block to avoid markdown parsing issues
 */
export function formatAsCode(text: string): string {
  return '```\n' + text + '\n```';
}

/**
 * Split long messages for Telegram's 4096 character limit
 */
export function splitLongMessage(text: string, maxLength: number = 4000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const parts: string[] = [];
  let currentPart = '';

  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentPart.length + line.length + 1 > maxLength) {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
      
      // If single line is too long, split it
      if (line.length > maxLength) {
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          if (currentLine.length + word.length + 1 > maxLength) {
            if (currentLine) {
              parts.push(currentLine.trim());
              currentLine = '';
            }
            // If single word is too long, truncate it
            parts.push(word.length > maxLength ? word.substring(0, maxLength - 3) + '...' : word);
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        }
        
        if (currentLine) {
          currentPart = currentLine;
        }
      } else {
        currentPart = line;
      }
    } else {
      currentPart += (currentPart ? '\n' : '') + line;
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts.length > 0 ? parts : [''];
}