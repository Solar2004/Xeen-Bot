import axios from "axios";
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

// Command to ban a user from the server
export default {
  data: {
    name: "ban",
    description: "Ban a user from the server",
    options: [
      {
        name: "user",
        description: "The user to ban",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the ban",
        type: ApplicationCommandOptionType.String,
        required: false,
        max_length: 512,
      },
      {
        name: "delete_messages",
        description: "Delete messages from the last X days (0-7 days)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 0,
        max_value: 7,
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
      // Check user permissions
      const userPerms = BigInt(interaction.member.permissions);
      const hasBanMembers = (userPerms & 0x4n) === 0x4n; // BAN_MEMBERS
      const hasAdmin = (userPerms & 0x8n) === 0x8n; // ADMINISTRATOR

      if (!hasBanMembers && !hasAdmin) {
        return {
          content: "❌ You don't have permission to ban members. You need the **Ban Members** permission.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Get command options
      const userOption = interaction.data.options?.find(opt => opt.name === "user");
      const reasonOption = interaction.data.options?.find(opt => opt.name === "reason");
      const deleteMessagesOption = interaction.data.options?.find(opt => opt.name === "delete_messages");

      if (!userOption) {
        return {
          content: "❌ Missing required user parameter.",
          flags: MessageFlags.Ephemeral,
        };
      }

      const targetUserId = userOption.value;
      const reason = reasonOption?.value || "No reason provided";
      const deleteMessageDays = deleteMessagesOption ? parseInt(deleteMessagesOption.value) : 0;

      // Get target user info
      const targetUser = interaction.data.resolved?.users?.[targetUserId];
      if (!targetUser) {
        return {
          content: "❌ Could not find the specified user.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Check if trying to ban themselves or the bot
      if (targetUserId === interaction.member.user.id) {
        return {
          content: "❌ You cannot ban yourself.",
          flags: MessageFlags.Ephemeral,
        };
      }

      if (targetUserId === interaction.application_id) {
        return {
          content: "❌ You cannot ban the bot.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Try to ban the user via Discord API
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        return {
          content: "❌ Bot token not configured.",
          flags: MessageFlags.Ephemeral,
        };
      }

      try {
        const banData: any = {
          delete_message_days: deleteMessageDays,
        };

        // Construct the URL with query params for the ban
        const url = `https://discord.com/api/v10/guilds/${interaction.guild_id}/bans/${targetUserId}`;
        
        await axios.put(url, banData, {
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
            "X-Audit-Log-Reason": reason,
          },
        });

        const successMessage = `✅ **User Banned**\n\n` +
          `👤 **User:** ${targetUser.username}#${targetUser.discriminator}\n` +
          `👮 **Banned by:** ${interaction.member.user.username}#${interaction.member.user.discriminator}\n` +
          `📝 **Reason:** ${reason}\n` +
          `🗑️ **Messages Deleted:** ${deleteMessageDays > 0 ? `Last ${deleteMessageDays} day${deleteMessageDays > 1 ? 's' : ''}` : 'None'}\n` +
          `⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:F>`;

        return {
          content: successMessage,
        };

      } catch (apiError) {
        console.error("Discord API error:", apiError);
        
        if (axios.isAxiosError(apiError)) {
          const status = apiError.response?.status;
          const errorData = apiError.response?.data;
          
          if (status === 403) {
            return {
              content: "❌ I don't have permission to ban this user. Make sure I have the **Ban Members** permission and my role is higher than the target user's highest role.",
              flags: MessageFlags.Ephemeral,
            };
          } else if (status === 404) {
            return {
              content: "❌ User not found in this server.",
              flags: MessageFlags.Ephemeral,
            };
          } else if (status === 400) {
            return {
              content: `❌ Invalid request: ${errorData?.message || "Unknown error"}`,
              flags: MessageFlags.Ephemeral,
            };
          } else if (status === 409) {
            return {
              content: "❌ User is already banned from this server.",
              flags: MessageFlags.Ephemeral,
            };
          }
        }

        return {
          content: "❌ Failed to ban the user. Please try again later.",
          flags: MessageFlags.Ephemeral,
        };
      }

    } catch (error) {
      console.error("Error in ban command:", error);
      return {
        content: "❌ An error occurred while processing the ban command.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
