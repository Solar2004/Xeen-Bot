import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Command to check user permissions
export default {
  data: {
    name: "permissions",
    description: "Check permissions for a user",
    options: [
      {
        name: "user",
        description: "The user to check permissions for",
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
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
      // Get the target user from options or default to command invoker
      let targetUser = interaction.member.user;
      let targetPerms = BigInt(interaction.member.permissions);

      // Check if a user was specified in the options
      const userOption = interaction.data.options?.find(option => option.name === "user");
      if (userOption && interaction.data.resolved?.users) {
        const userId = userOption.value;
        const resolvedUser = interaction.data.resolved.users[userId];
        if (resolvedUser) {
          targetUser = resolvedUser;
          // Note: We can't get other users' permissions in serverless mode
          // This would require additional API calls
          if (userId !== interaction.member.user.id) {
            return {
              content: "❌ Due to serverless limitations, I can only check your own permissions. Use this command without specifying a user to check your permissions.",
              flags: MessageFlags.Ephemeral,
            };
          }
        }
      }

      // Permission flag mappings
      const permissionMap: { [key: string]: bigint } = {
        "Create Instant Invite": 0x1n,
        "Kick Members": 0x2n,
        "Ban Members": 0x4n,
        "Administrator": 0x8n,
        "Manage Channels": 0x10n,
        "Manage Guild": 0x20n,
        "Add Reactions": 0x40n,
        "View Audit Log": 0x80n,
        "Priority Speaker": 0x100n,
        "Stream": 0x200n,
        "View Channel": 0x400n,
        "Send Messages": 0x800n,
        "Send TTS Messages": 0x1000n,
        "Manage Messages": 0x2000n,
        "Embed Links": 0x4000n,
        "Attach Files": 0x8000n,
        "Read Message History": 0x10000n,
        "Mention Everyone": 0x20000n,
        "Use External Emojis": 0x40000n,
        "View Guild Insights": 0x80000n,
        "Connect": 0x100000n,
        "Speak": 0x200000n,
        "Mute Members": 0x400000n,
        "Deafen Members": 0x800000n,
        "Move Members": 0x1000000n,
        "Use Voice Activity": 0x2000000n,
        "Change Nickname": 0x4000000n,
        "Manage Nicknames": 0x8000000n,
        "Manage Roles": 0x10000000n,
        "Manage Webhooks": 0x20000000n,
        "Manage Emojis and Stickers": 0x40000000n,
        "Use Application Commands": 0x80000000n,
        "Request to Speak": 0x100000000n,
        "Manage Events": 0x200000000n,
        "Manage Threads": 0x400000000n,
        "Create Public Threads": 0x800000000n,
        "Create Private Threads": 0x1000000000n,
        "Use External Stickers": 0x2000000000n,
        "Send Messages in Threads": 0x4000000000n,
        "Use Embedded Activities": 0x8000000000n,
        "Moderate Members": 0x10000000000n,
      };

      // Check which permissions the user has
      const hasPermissions: string[] = [];
      const keyPermissions: string[] = [];

      for (const [permName, permFlag] of Object.entries(permissionMap)) {
        if ((targetPerms & permFlag) === permFlag) {
          hasPermissions.push(permName);

          // Mark key moderation/admin permissions
          if (["Administrator", "Manage Guild", "Ban Members", "Kick Members", "Moderate Members", "Manage Roles", "Manage Channels"].includes(permName)) {
            keyPermissions.push(permName);
          }
        }
      }

      // Build permissions message
      let permMessage = `🔑 **Permissions for ${targetUser.username}**\n\n`;

      // Show key permissions first
      if (keyPermissions.length > 0) {
        permMessage += "🌟 **Key Permissions:**\n";
        for (const perm of keyPermissions) {
          permMessage += `✅ ${perm}\n`;
        }
        permMessage += "\n";
      }

      // Permission summary
      const hasAdmin = (targetPerms & 0x8n) === 0x8n;
      if (hasAdmin) {
        permMessage += "👑 **Role:** Administrator (has all permissions)\n\n";
      } else {
        const isModerator = keyPermissions.some(p => 
          ["Manage Guild", "Ban Members", "Kick Members", "Moderate Members", "Manage Roles"].includes(p)
        );
        
        if (isModerator) {
          permMessage += "🛡️ **Role:** Moderator\n\n";
        } else {
          permMessage += "👤 **Role:** Member\n\n";
        }
      }

      // Show permission count
      permMessage += `📊 **Permission Count:** ${hasPermissions.length}/${Object.keys(permissionMap).length}\n`;
      permMessage += `🆔 **User ID:** \`${targetUser.id}\`\n`;
      permMessage += `🏰 **Guild ID:** \`${interaction.guild_id}\`\n\n`;

      // Raw permissions value (for debugging)
      permMessage += `🔢 **Raw Permissions:** \`${targetPerms.toString()}\`\n\n`;

      permMessage += "💡 **Note:** This shows server-level permissions. Channel-specific permissions may override these.";

      return {
        content: permMessage,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in permissions command:", error);
      return {
        content: "❌ An error occurred while checking permissions.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
