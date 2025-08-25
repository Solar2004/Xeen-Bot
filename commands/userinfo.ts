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

// Command to show user information
export default {
  data: {
    name: "userinfo",
    description: "Shows information about a user",
    options: [
      {
        name: "user",
        description: "The user to get information about",
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

    try {
      // Get the target user from options or default to command invoker
      let targetUser = interaction.member.user;
      let targetMember: typeof interaction.member | null = interaction.member;

      // Check if a user was specified in the options
      if (interaction.data.options && interaction.data.options.length > 0) {
        const userOption = interaction.data.options.find(option => option.name === "user");
        if (userOption && interaction.data.resolved?.users) {
          const userId = userOption.value;
          const resolvedUser = interaction.data.resolved.users[userId];
          if (resolvedUser) {
            targetUser = resolvedUser;
            // Note: We don't have member info for other users in serverless mode
            targetMember = null;
          }
        }
      }

      // Build user info message
      let userInfo = "👤 **User Information**\n\n";
      
      // Basic user info
      userInfo += `📛 **Username:** ${targetUser.username}\n`;
      userInfo += `🏷️ **Discriminator:** #${targetUser.discriminator}\n`;
      userInfo += `🆔 **User ID:** \`${targetUser.id}\`\n`;
      
      // Avatar
      if (targetUser.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png?size=256`;
        userInfo += `🖼️ **Avatar:** [Click here](${avatarUrl})\n`;
      } else {
        userInfo += `🖼️ **Avatar:** Default Discord avatar\n`;
      }

      // Public flags (badges)
      if (targetUser.public_flags) {
        const flags = [];
        const flagMap: { [key: number]: string } = {
          1: "Discord Employee",
          2: "Partnered Server Owner",
          4: "HypeSquad Events",
          8: "Bug Hunter Level 1",
          64: "HypeSquad Bravery",
          128: "HypeSquad Brilliance",
          256: "HypeSquad Balance",
          512: "Early Supporter",
          1024: "Team User",
          16384: "Bug Hunter Level 2",
          131072: "Verified Bot Developer",
          4194304: "Active Developer",
        };

        for (const [flag, name] of Object.entries(flagMap)) {
          if (targetUser.public_flags & parseInt(flag)) {
            flags.push(name);
          }
        }

        if (flags.length > 0) {
          userInfo += `🏅 **Badges:** ${flags.join(", ")}\n`;
        }
      }

      // Member-specific info (only available for the command invoker)
      if (targetMember && targetUser.id === interaction.member.user.id) {
        userInfo += "\n🏰 **Server Member Info**\n";
        
        const userPerms = BigInt(targetMember.permissions);
        const hasAdmin = (userPerms & 0x8n) === 0x8n;
        const hasModerator = (userPerms & 0x10000000n) === 0x10000000n || // Manage Server
                             (userPerms & 0x2000n) === 0x2000n || // Manage Messages
                             (userPerms & 0x2n) === 0x2n; // Kick Members

        userInfo += `🔑 **Permissions:** ${hasAdmin ? "Administrator" : hasModerator ? "Moderator" : "Member"}\n`;
        userInfo += `🌐 **Locale:** ${interaction.locale || "Unknown"}\n`;
      } else if (targetUser.id !== interaction.member.user.id) {
        userInfo += "\nℹ️ **Note:** Server-specific information is only available for yourself due to serverless limitations.";
      }

      return {
        content: userInfo,
        flags: MessageFlags.Ephemeral,
      };
    } catch (error) {
      console.error("Error in userinfo command:", error);
      return {
        content: "An error occurred while fetching user information.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
