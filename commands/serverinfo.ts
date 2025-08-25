import {
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Command to show detailed server information
export default {
  data: {
    name: "serverinfo",
    description: "Shows detailed information about the current server",
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

    // Check if we're in a guild
    if (!interaction.guild_id) {
      return {
        content: "This command can only be used in a server (guild).",
        flags: MessageFlags.Ephemeral,
      };
    }

    try {
      // Get basic server info (what we can get from the interaction)
      const guildId = interaction.guild_id;
      const channelId = interaction.channel_id;
      const userId = interaction.member.user.id;
      const userPerms = BigInt(interaction.member.permissions);

      // Format permissions
      const hasAdmin = (userPerms & 0x8n) === 0x8n;
      const hasModerator = (userPerms & 0x10000000n) === 0x10000000n || // Manage Server
                           (userPerms & 0x2000n) === 0x2000n || // Manage Messages
                           (userPerms & 0x2n) === 0x2n; // Kick Members

      let serverInfo = "🏰 **Server Information**\n\n";
      serverInfo += `📋 **Server ID:** \`${guildId}\`\n`;
      serverInfo += `📺 **Channel ID:** \`${channelId}\`\n`;
      serverInfo += `🌍 **Locale:** ${interaction.guild_locale || "Unknown"}\n\n`;

      serverInfo += "👤 **Your Information**\n";
      serverInfo += `🆔 **User ID:** \`${userId}\`\n`;
      serverInfo += `🔑 **Permissions:** ${hasAdmin ? "Administrator" : hasModerator ? "Moderator" : "Member"}\n`;
      serverInfo += `🌐 **Your Locale:** ${interaction.locale || "Unknown"}\n\n`;

      serverInfo += "⚡ **Bot Information**\n";
      serverInfo += `🤖 **Application ID:** \`${interaction.application_id}\`\n`;
      serverInfo += `🔗 **Interaction ID:** \`${interaction.id}\`\n`;
      serverInfo += `🏃 **Running on:** Vercel Serverless\n\n`;

      serverInfo += "ℹ️ **Note:** Due to serverless limitations, some server details require additional API calls.";

      return {
        content: serverInfo,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in serverinfo command:", error);
      return {
        content: "An error occurred while fetching server information.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
