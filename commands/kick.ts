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

// Command to kick a user from the server
export default {
  data: {
    name: "kick",
    description: "Kick a user from the server",
    options: [
      {
        name: "user",
        description: "The user to kick",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the kick",
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
      const hasKickMembers = (userPerms & 0x2n) === 0x2n; // KICK_MEMBERS
      const hasAdmin = (userPerms & 0x8n) === 0x8n; // ADMINISTRATOR

      if (!hasKickMembers && !hasAdmin) {
        return {
          content: "❌ You don't have permission to kick members. You need the **Kick Members** permission.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Get command options
      const userOption = interaction.data.options?.find(opt => opt.name === "user");
      const reasonOption = interaction.data.options?.find(opt => opt.name === "reason");

      if (!userOption) {
        return {
          content: "❌ Missing required user parameter.",
          flags: MessageFlags.Ephemeral,
        };
      }

      const targetUserId = userOption.value;
      const reason = reasonOption?.value || "No reason provided";

      // Get target user info
      const targetUser = interaction.data.resolved?.users?.[targetUserId];
      if (!targetUser) {
        return {
          content: "❌ Could not find the specified user.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Check if trying to kick themselves or the bot
      if (targetUserId === interaction.member.user.id) {
        return {
          content: "❌ You cannot kick yourself.",
          flags: MessageFlags.Ephemeral,
        };
      }

      if (targetUserId === interaction.application_id) {
        return {
          content: "❌ You cannot kick the bot.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Try to kick the user via Discord API
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        return {
          content: "❌ Bot token not configured.",
          flags: MessageFlags.Ephemeral,
        };
      }

      try {
        await axios.delete(
          `https://discord.com/api/v10/guilds/${interaction.guild_id}/members/${targetUserId}`,
          {
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
            },
            data: {
              reason: reason,
            },
          }
        );

        const successMessage = `✅ **User Kicked**\n\n` +
          `👤 **User:** ${targetUser.username}#${targetUser.discriminator}\n` +
          `👮 **Kicked by:** ${interaction.member.user.username}#${interaction.member.user.discriminator}\n` +
          `📝 **Reason:** ${reason}\n` +
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
              content: "❌ I don't have permission to kick this user. Make sure I have the **Kick Members** permission and my role is higher than the target user's highest role.",
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
          content: "❌ Failed to kick the user. Please try again later.",
          flags: MessageFlags.Ephemeral,
        };
      }

    } catch (error) {
      console.error("Error in kick command:", error);
      return {
        content: "❌ An error occurred while processing the kick command.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
