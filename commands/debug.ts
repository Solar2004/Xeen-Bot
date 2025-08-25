import {
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Debug command for development
export default {
  data: {
    name: "debug",
    description: "Show debug information (for development)",
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
      const timestamp = new Date().toISOString();
      
      let debugInfo = "🔧 **Debug Information**\n\n";
      
      // Environment info
      debugInfo += "🌍 **Environment**\n";
      debugInfo += `⏰ **Timestamp:** ${timestamp}\n`;
      debugInfo += `🏃 **Runtime:** Vercel Serverless\n`;
      debugInfo += `📡 **Discord API:** v10\n`;
      debugInfo += `🔗 **Framework:** Discraft.js\n\n`;

      // Interaction data
      debugInfo += "📨 **Interaction Data**\n";
      debugInfo += `🆔 **Interaction ID:** \`${interaction.id}\`\n`;
      debugInfo += `📺 **Channel ID:** \`${interaction.channel_id}\`\n`;
      debugInfo += `🏰 **Guild ID:** \`${interaction.guild_id || "DM"}\`\n`;
      debugInfo += `🤖 **Application ID:** \`${interaction.application_id}\`\n`;
      debugInfo += `🔑 **Token Length:** ${interaction.token.length} chars\n\n`;

      // User data
      debugInfo += "👤 **User Information**\n";
      debugInfo += `🆔 **User ID:** \`${interaction.member.user.id}\`\n`;
      debugInfo += `📛 **Username:** ${interaction.member.user.username}#${interaction.member.user.discriminator}\n`;
      debugInfo += `🌐 **Locale:** ${interaction.locale}\n`;
      debugInfo += `🏰 **Guild Locale:** ${interaction.guild_locale || "N/A"}\n\n`;

      // Permissions
      debugInfo += "🔑 **Permissions**\n";
      const userPerms = BigInt(interaction.member.permissions);
      debugInfo += `🔢 **Raw Permissions:** \`${userPerms.toString()}\`\n`;
      
      const hasAdmin = (userPerms & 0x8n) === 0x8n;
      const hasManageGuild = (userPerms & 0x20n) === 0x20n;
      const hasManageChannels = (userPerms & 0x10n) === 0x10n;
      const hasKick = (userPerms & 0x2n) === 0x2n;
      const hasBan = (userPerms & 0x4n) === 0x4n;
      const hasModerate = (userPerms & 0x10000000000n) === 0x10000000000n;

      debugInfo += `👑 **Administrator:** ${hasAdmin ? "✅" : "❌"}\n`;
      debugInfo += `🏰 **Manage Guild:** ${hasManageGuild ? "✅" : "❌"}\n`;
      debugInfo += `📺 **Manage Channels:** ${hasManageChannels ? "✅" : "❌"}\n`;
      debugInfo += `👢 **Kick Members:** ${hasKick ? "✅" : "❌"}\n`;
      debugInfo += `🔨 **Ban Members:** ${hasBan ? "✅" : "❌"}\n`;
      debugInfo += `⏰ **Moderate Members:** ${hasModerate ? "✅" : "❌"}\n\n`;

      // Command data
      debugInfo += "📋 **Command Data**\n";
      debugInfo += `📛 **Command Name:** ${interaction.data.name}\n`;
      debugInfo += `🆔 **Command ID:** \`${interaction.data.id}\`\n`;
      debugInfo += `📊 **Command Type:** ${interaction.data.type}\n`;
      
      if (interaction.data.options && interaction.data.options.length > 0) {
        debugInfo += `⚙️ **Options:** ${interaction.data.options.length}\n`;
        for (const option of interaction.data.options) {
          debugInfo += `  • \`${option.name}\`: "${option.value}" (type: ${option.type})\n`;
        }
      } else {
        debugInfo += `⚙️ **Options:** None\n`;
      }

      debugInfo += "\n";

      // System info
      debugInfo += "⚙️ **System**\n";
      debugInfo += `🔄 **Node.js Version:** ${process.version || "Unknown"}\n`;
      debugInfo += `💾 **Memory Usage:** ${process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) : "Unknown"} MB\n`;
      debugInfo += `⏱️ **Process Uptime:** ${process.uptime ? Math.round(process.uptime()) : "Unknown"} seconds\n\n`;

      // Environment variables (safely)
      debugInfo += "🔐 **Environment**\n";
      debugInfo += `🤖 **Token Configured:** ${process.env.DISCORD_TOKEN ? "✅" : "❌"}\n`;
      debugInfo += `🆔 **App ID Configured:** ${process.env.DISCORD_APP_ID ? "✅" : "❌"}\n`;
      debugInfo += `🌍 **Environment:** ${process.env.NODE_ENV || "development"}\n\n`;

      debugInfo += "⚠️ **Note:** This information is for debugging purposes only.";

      return {
        content: debugInfo,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in debug command:", error);
      return {
        content: `❌ Error in debug command: ${error instanceof Error ? error.message : "Unknown error"}`,
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
