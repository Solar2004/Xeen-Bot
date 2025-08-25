import axios from "axios";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  MessageFlags,
  OverwriteType,
  PermissionFlagsBits,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Ticket system command with subcommands
export default {
  data: {
    name: "ticket",
    description: "Ticket system commands",
    options: [
      {
        name: "create",
        description: "Create a new support ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "title",
            description: "Title/subject of the ticket",
            type: ApplicationCommandOptionType.String,
            required: true,
            max_length: 100,
          },
          {
            name: "description",
            description: "Description of your issue or request",
            type: ApplicationCommandOptionType.String,
            required: false,
            max_length: 1000,
          },
          {
            name: "priority",
            description: "Priority level of the ticket",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              { name: "Low", value: "low" },
              { name: "Medium", value: "medium" },
              { name: "High", value: "high" },
              { name: "Urgent", value: "urgent" },
            ],
          },
        ],
      },
      {
        name: "close",
        description: "Close the current ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "reason",
            description: "Reason for closing the ticket",
            type: ApplicationCommandOptionType.String,
            required: false,
            max_length: 500,
          },
        ],
      },
      {
        name: "add",
        description: "Add a user to the current ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "User to add to the ticket",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: "remove",
        description: "Remove a user from the current ticket",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "User to remove from the ticket",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
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

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      return {
        content: "❌ Bot token not configured.",
        flags: MessageFlags.Ephemeral,
      };
    }

    try {
      const subcommand = interaction.data.options?.[0];
      if (!subcommand) {
        return {
          content: "❌ No subcommand specified.",
          flags: MessageFlags.Ephemeral,
        };
      }

      switch (subcommand.name) {
        case "create":
          return await handleCreateTicket(interaction, token, subcommand.options || []);
        case "close":
          return await handleCloseTicket(interaction, token, subcommand.options || []);
        case "add":
          return await handleAddUser(interaction, token, subcommand.options || []);
        case "remove":
          return await handleRemoveUser(interaction, token, subcommand.options || []);
        default:
          return {
            content: "❌ Unknown subcommand.",
            flags: MessageFlags.Ephemeral,
          };
      }
    } catch (error) {
      console.error("Error in ticket command:", error);
      return {
        content: "❌ An error occurred while processing the ticket command.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};

async function handleCreateTicket(
  interaction: SimplifiedInteraction,
  token: string,
  options: any[]
): CommandExecuteResult {
  try {
    // Get options
    const titleOption = options.find(opt => opt.name === "title");
    const descriptionOption = options.find(opt => opt.name === "description");
    const priorityOption = options.find(opt => opt.name === "priority");

    if (!titleOption) {
      return {
        content: "❌ Title is required.",
        flags: MessageFlags.Ephemeral,
      };
    }

    const title = titleOption.value;
    const description = descriptionOption?.value || "No description provided";
    const priority = priorityOption?.value || "medium";

    // Generate ticket number (simple timestamp-based)
    const ticketNumber = Date.now().toString().slice(-6);
    const channelName = `ticket-${ticketNumber}`;

    // Create the ticket channel
    const channelData = {
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Ticket #${ticketNumber} - ${title} | Created by ${interaction.member.user.username}`,
      permission_overwrites: [
        // Deny @everyone
        {
          id: interaction.guild_id,
          type: OverwriteType.Role,
          deny: (PermissionFlagsBits.ViewChannel).toString(),
        },
        // Allow ticket creator
        {
          id: interaction.member.user.id,
          type: OverwriteType.Member,
          allow: (
            PermissionFlagsBits.ViewChannel |
            PermissionFlagsBits.SendMessages |
            PermissionFlagsBits.ReadMessageHistory
          ).toString(),
        },
        // Allow bot
        {
          id: interaction.application_id,
          type: OverwriteType.Member,
          allow: (
            PermissionFlagsBits.ViewChannel |
            PermissionFlagsBits.SendMessages |
            PermissionFlagsBits.ReadMessageHistory |
            PermissionFlagsBits.ManageChannels
          ).toString(),
        },
      ],
    };

    const response = await axios.post(
      `https://discord.com/api/v10/guilds/${interaction.guild_id}/channels`,
      channelData,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const channel = response.data;

    // Get priority emoji
    const priorityEmoji: { [key: string]: string } = {
      low: "🟢",
      medium: "🟡", 
      high: "🟠",
      urgent: "🔴",
    };

    // Send initial message to the ticket channel
    const ticketMessage = {
      content: `🎫 **Ticket #${ticketNumber} Created**\n\n` +
        `**Title:** ${title}\n` +
        `**Description:** ${description}\n` +
        `**Priority:** ${priorityEmoji[priority]} ${priority.charAt(0).toUpperCase() + priority.slice(1)}\n` +
        `**Created by:** <@${interaction.member.user.id}>\n` +
        `**Created at:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `─────────────────────────────\n\n` +
        `📋 **Instructions:**\n` +
        `• Please describe your issue in detail\n` +
        `• Staff will respond as soon as possible\n` +
        `• Use \`/ticket close\` to close this ticket when resolved\n` +
        `• Use \`/ticket add <user>\` to add someone to this ticket\n\n` +
        `🏷️ This ticket will be automatically deleted after closure.`,
    };

    await axios.post(
      `https://discord.com/api/v10/channels/${channel.id}/messages`,
      ticketMessage,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: `✅ **Ticket Created Successfully!**\n\n` +
        `🎫 **Ticket #${ticketNumber}**\n` +
        `📺 **Channel:** <#${channel.id}>\n` +
        `📋 **Title:** ${title}\n` +
        `${priorityEmoji[priority]} **Priority:** ${priority.charAt(0).toUpperCase() + priority.slice(1)}\n\n` +
        `Please head to the ticket channel to continue the conversation.`,
      flags: MessageFlags.Ephemeral,
    };

  } catch (error) {
    console.error("Error creating ticket:", error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 403) {
        return {
          content: "❌ I don't have permission to create channels. Please make sure I have the **Manage Channels** permission.",
          flags: MessageFlags.Ephemeral,
        };
      }
    }

    return {
      content: "❌ Failed to create ticket. Please try again later.",
      flags: MessageFlags.Ephemeral,
    };
  }
}

async function handleCloseTicket(
  interaction: SimplifiedInteraction,
  token: string,
  options: any[]
): CommandExecuteResult {
  try {
    // Check if we're in a ticket channel
    const channelId = interaction.channel_id;
    
    // Get channel info to check if it's a ticket
    const channelResponse = await axios.get(
      `https://discord.com/api/v10/channels/${channelId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    const channel = channelResponse.data;
    
    if (!channel.name?.startsWith("ticket-")) {
      return {
        content: "❌ This command can only be used in ticket channels.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Check permissions
    const userPerms = BigInt(interaction.member.permissions);
    const hasManageChannels = (userPerms & PermissionFlagsBits.ManageChannels) === PermissionFlagsBits.ManageChannels;
    const hasAdmin = (userPerms & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator;

    // Check if user is the ticket creator (extract from channel topic) or has permissions
    const isTicketCreator = channel.topic?.includes(interaction.member.user.username);

    if (!isTicketCreator && !hasManageChannels && !hasAdmin) {
      return {
        content: "❌ You can only close tickets you created, or if you have the **Manage Channels** permission.",
        flags: MessageFlags.Ephemeral,
      };
    }

    const reasonOption = options.find(opt => opt.name === "reason");
    const reason = reasonOption?.value || "No reason provided";

    // Send closing message
    const closingMessage = {
      content: `🔒 **Ticket Closed**\n\n` +
        `**Closed by:** <@${interaction.member.user.id}>\n` +
        `**Reason:** ${reason}\n` +
        `**Closed at:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `This channel will be deleted in 10 seconds...`,
    };

    await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      closingMessage,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Delete the channel after a delay (we can't actually wait in serverless, so delete immediately)
    setTimeout(async () => {
      try {
        await axios.delete(
          `https://discord.com/api/v10/channels/${channelId}`,
          {
            headers: {
              Authorization: `Bot ${token}`,
            },
          }
        );
      } catch (deleteError) {
        console.error("Error deleting ticket channel:", deleteError);
      }
    }, 10000);

    return {
      content: "✅ Ticket is being closed...",
      flags: MessageFlags.Ephemeral,
    };

  } catch (error) {
    console.error("Error closing ticket:", error);
    return {
      content: "❌ Failed to close ticket. Please try again later.",
      flags: MessageFlags.Ephemeral,
    };
  }
}

async function handleAddUser(
  interaction: SimplifiedInteraction,
  token: string,
  options: any[]
): CommandExecuteResult {
  try {
    const userOption = options.find(opt => opt.name === "user");
    if (!userOption) {
      return {
        content: "❌ User parameter is required.",
        flags: MessageFlags.Ephemeral,
      };
    }

    const channelId = interaction.channel_id;
    const targetUserId = userOption.value;

    // Get target user info
    const targetUser = interaction.data.resolved?.users?.[targetUserId];
    if (!targetUser) {
      return {
        content: "❌ Could not find the specified user.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Check if we're in a ticket channel
    const channelResponse = await axios.get(
      `https://discord.com/api/v10/channels/${channelId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    const channel = channelResponse.data;
    
    if (!channel.name?.startsWith("ticket-")) {
      return {
        content: "❌ This command can only be used in ticket channels.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Add user to channel
    const permissionOverwrite = {
      id: targetUserId,
      type: OverwriteType.Member,
      allow: (
        PermissionFlagsBits.ViewChannel |
        PermissionFlagsBits.SendMessages |
        PermissionFlagsBits.ReadMessageHistory
      ).toString(),
    };

    await axios.put(
      `https://discord.com/api/v10/channels/${channelId}/permissions/${targetUserId}`,
      permissionOverwrite,
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      content: `✅ Added <@${targetUserId}> to the ticket.`,
    };

  } catch (error) {
    console.error("Error adding user to ticket:", error);
    return {
      content: "❌ Failed to add user to ticket.",
      flags: MessageFlags.Ephemeral,
    };
  }
}

async function handleRemoveUser(
  interaction: SimplifiedInteraction,
  token: string,
  options: any[]
): CommandExecuteResult {
  try {
    const userOption = options.find(opt => opt.name === "user");
    if (!userOption) {
      return {
        content: "❌ User parameter is required.",
        flags: MessageFlags.Ephemeral,
      };
    }

    const channelId = interaction.channel_id;
    const targetUserId = userOption.value;

    // Get target user info
    const targetUser = interaction.data.resolved?.users?.[targetUserId];
    if (!targetUser) {
      return {
        content: "❌ Could not find the specified user.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Check if we're in a ticket channel
    const channelResponse = await axios.get(
      `https://discord.com/api/v10/channels/${channelId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    const channel = channelResponse.data;
    
    if (!channel.name?.startsWith("ticket-")) {
      return {
        content: "❌ This command can only be used in ticket channels.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Remove user from channel
    await axios.delete(
      `https://discord.com/api/v10/channels/${channelId}/permissions/${targetUserId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    return {
      content: `✅ Removed <@${targetUserId}> from the ticket.`,
    };

  } catch (error) {
    console.error("Error removing user from ticket:", error);
    return {
      content: "❌ Failed to remove user from ticket.",
      flags: MessageFlags.Ephemeral,
    };
  }
}
