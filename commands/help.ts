import {
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Command to show all available commands and their descriptions
export default {
  data: {
    name: "help",
    description: "Shows all available commands and their descriptions",
    options: [],
  } as CommandData,
  async execute(data: {
    interaction: SimplifiedInteraction;
  }): CommandExecuteResult {
    const interaction = data.interaction;

    // Check if the interaction is a chat input command
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return {
        content: "This command can only be used as a slash command.",
        flags: MessageFlags.Ephemeral,
      };
    }

    try {
      let helpMessage = "📚 **Xeen Bot - Command Help**\n\n";

      // Basic Commands
      helpMessage += "🔧 **Basic Commands**\n";
      helpMessage += `• \`/ping\` - Check if the bot is online\n`;
      helpMessage += `• \`/help\` - Show this help message\n`;
      helpMessage += `• \`/botinfo\` - Display bot information and status\n\n`;

      // Information Commands
      helpMessage += "📊 **Information Commands**\n";
      helpMessage += `• \`/userinfo [user]\` - Show information about a user\n`;
      helpMessage += `• \`/serverinfo\` - Display server information\n`;
      helpMessage += `• \`/repo\` - Show GitHub repositories\n\n`;

      // Development Commands
      helpMessage += "⚙️ **Development Commands**\n";
      helpMessage += `• \`/debug\` - Show debug information\n`;
      helpMessage += `• \`/permissions [user]\` - Check user permissions\n\n`;

      // Moderation Commands
      helpMessage += "🔨 **Moderation Commands**\n";
      helpMessage += `• \`/timeout <user> <duration> [reason]\` - Timeout a user\n`;
      helpMessage += `• \`/kick <user> [reason]\` - Kick a user from the server\n`;
      helpMessage += `• \`/ban <user> [reason]\` - Ban a user from the server\n\n`;

      // Ticket System
      helpMessage += "🎫 **Ticket System**\n";
      helpMessage += `• \`/ticket create <title> [description]\` - Create a new ticket\n`;
      helpMessage += `• \`/ticket close [reason]\` - Close the current ticket\n`;
      helpMessage += `• \`/ticket list\` - List all open tickets\n\n`;

      // Notes about serverless
      helpMessage += "⚠️ **Important Notes**\n";
      helpMessage += `• This bot runs on serverless infrastructure\n`;
      helpMessage += `• Only slash commands are supported\n`;
      helpMessage += `• No event listening (messages, reactions)\n`;
      helpMessage += `• Some moderation features may be limited\n\n`;

      helpMessage += "💡 **Need help?** Use the ticket system to report issues or ask questions!";

      return {
        content: helpMessage,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in help command:", error);
      return {
        content: "An error occurred while generating the help message.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
