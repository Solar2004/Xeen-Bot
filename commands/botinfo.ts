import {
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Command to show bot information and status
export default {
  data: {
    name: "botinfo",
    description: "Shows information about the bot and its status",
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
      const startTime = Date.now();
      
      let botInfo = "🤖 **Bot Information**\n\n";
      
      // Basic bot info
      botInfo += `📛 **Bot Name:** Xeen Bot\n`;
      botInfo += `🆔 **Application ID:** \`${interaction.application_id}\`\n`;
      botInfo += `⚡ **Framework:** Discraft.js (Serverless)\n`;
      botInfo += `🌐 **Platform:** Vercel\n`;
      botInfo += `🔗 **Discord API:** v10\n\n`;

      // Runtime info
      botInfo += "⚙️ **Runtime Information**\n";
      botInfo += `🏃 **Environment:** Serverless Function\n`;
      botInfo += `📡 **Response Mode:** Webhook (Interactions)\n`;
      botInfo += `🚫 **Event Listening:** Not supported (serverless limitation)\n`;
      botInfo += `✅ **Slash Commands:** Fully supported\n\n`;

      // Features
      botInfo += "🛠️ **Available Features**\n";
      botInfo += `• Slash Commands\n`;
      botInfo += `• User Information\n`;
      botInfo += `• Server Information\n`;
      botInfo += `• GitHub Integration\n`;
      botInfo += `• Development Tools\n`;
      botInfo += `• Basic Moderation\n`;
      botInfo += `• Ticket System\n\n`;

      // Limitations
      botInfo += "⚠️ **Serverless Limitations**\n";
      botInfo += `• No persistent WebSocket connection\n`;
      botInfo += `• Cannot receive events (messages, reactions, etc.)\n`;
      botInfo += `• No real-time status updates\n`;
      botInfo += `• Limited to interaction responses\n\n`;

      // Performance
      const responseTime = Date.now() - startTime;
      botInfo += "📊 **Performance**\n";
      botInfo += `⏱️ **Response Time:** ~${responseTime}ms\n`;
      botInfo += `🔄 **Cold Start:** Possible on first request\n`;
      botInfo += `💾 **Memory:** Allocated per request\n\n`;

      botInfo += "💡 **Tip:** Use `/help` to see all available commands!";

      return {
        content: botInfo,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in botinfo command:", error);
      return {
        content: "An error occurred while fetching bot information.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
