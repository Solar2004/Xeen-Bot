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

// Command to timeout a user
export default {
  data: {
    name: "timeout",
    description: "Timeout a user for a specified duration",
    options: [
      {
        name: "user",
        description: "The user to timeout",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "duration",
        description: "Duration in minutes (1-40320, max 28 days)",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 1,
        max_value: 40320, // 28 days in minutes
      },
      {
        name: "reason",
        description: "Reason for the timeout",
        type: ApplicationCommandOptionType.String,
        required: false,
        max_length: 512,
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
      const hasModerateMembers = (userPerms & 0x10000000000n) === 0x10000000000n; // MODERATE_MEMBERS
      const hasAdmin = (userPerms & 0x8n) === 0x8n; // ADMINISTRATOR

      if (!hasModerateMembers && !hasAdmin) {
        return {
          content: "❌ You don't have permission to timeout members. You need the **Moderate Members** permission.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Get command options
      const userOption = interaction.data.options?.find(opt => opt.name === "user");
      const durationOption = interaction.data.options?.find(opt => opt.name === "duration");
      const reasonOption = interaction.data.options?.find(opt => opt.name === "reason");

      if (!userOption || !durationOption) {
        return {
          content: "❌ Missing required parameters.",
          flags: MessageFlags.Ephemeral,
        };
      }

      const targetUserId = userOption.value;
      const durationMinutes = parseInt(durationOption.value);
      const reason = reasonOption?.value || "No reason provided";

      // Get target user info
      const targetUser = interaction.data.resolved?.users?.[targetUserId];
      if (!targetUser) {
        return {
          content: "❌ Could not find the specified user.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Check if trying to timeout themselves or the bot
      if (targetUserId === interaction.member.user.id) {
        return {
          content: "❌ You cannot timeout yourself.",
          flags: MessageFlags.Ephemeral,
        };
      }

      if (targetUserId === interaction.application_id) {
        return {
          content: "❌ You cannot timeout the bot.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Calculate timeout end time
      const timeoutUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

      // Try to timeout the user via Discord API
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        return {
          content: "❌ Bot token not configured.",
          flags: MessageFlags.Ephemeral,
        };
      }

      try {
        await axios.patch(
          `https://discord.com/api/v10/guilds/${interaction.guild_id}/members/${targetUserId}`,
          {
            communication_disabled_until: timeoutUntil,
          },
          {
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Format duration for display
        const formatDuration = (minutes: number): string => {
          if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          if (hours < 24) {
            return remainingMinutes > 0 
              ? `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
              : `${hours} hour${hours > 1 ? 's' : ''}`;
          }
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return remainingHours > 0
            ? `${days} day${days > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
            : `${days} day${days > 1 ? 's' : ''}`;
        };

        const successMessage = `✅ **User Timed Out**\n\n` +
          `👤 **User:** ${targetUser.username}#${targetUser.discriminator}\n` +
          `⏰ **Duration:** ${formatDuration(durationMinutes)}\n` +
          `📝 **Reason:** ${reason}\n` +
          `⏱️ **Expires:** <t:${Math.floor(Date.now() / 1000 + durationMinutes * 60)}:F>`;

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
              content: "❌ I don't have permission to timeout this user. Make sure I have the **Moderate Members** permission and my role is higher than the target user's highest role.",
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
          }
        }

        return {
          content: "❌ Failed to timeout the user. Please try again later.",
          flags: MessageFlags.Ephemeral,
        };
      }

    } catch (error) {
      console.error("Error in timeout command:", error);
      return {
        content: "❌ An error occurred while processing the timeout command.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
