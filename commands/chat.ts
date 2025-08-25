import axios from "axios";
import {
  type APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Here you define your command data
// Discraft will handle the registration and interactions with the API

export default {
  data: {
    name: "chat", // The name of the command
    description: "Chat with Kimi AI via OpenRouter", // The description of the command
    options: [
      {
        name: "prompt", // The name of the prompt option
        description: "The prompt for the AI", // The description of the prompt option
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  } as CommandData,
  async execute(data: {
    interaction: SimplifiedInteraction;
  }): CommandExecuteResult {
    const interaction = data.interaction; // Get the interaction data

    // Check if the interaction is a chat input command
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return {
        content:
          "This command can only be used as a chat input (slash) command.",
        flags: MessageFlags.Ephemeral, // Make the response visible only to the user
      };
    }

    // Cast the interaction to the correct type
    const chatInteraction = interaction;

    // Find the 'prompt' option from the interaction
    const promptOption = chatInteraction.data.options?.find(
      (option) => option.name === "prompt",
    ) as (APIApplicationCommandOption & { value: string }) | undefined;
    
    const prompt = promptOption?.value || ""; // Get the value of the prompt option

    // Check if the prompt exceeds the maximum length
    if (prompt.length > 2000) {
      return {
        content: "Prompt must be less than 2000 characters.",
        flags: MessageFlags.Ephemeral,
      };
    }

    // Check if OpenRouter API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        content: "OpenRouter API key is not configured.",
        flags: MessageFlags.Ephemeral,
      };
    }

    try {
      // Make request to OpenRouter API with Kimi Dev model
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "moonshotai/kimi-dev-72b:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || "No response received from AI.";

      // If response is too long, send as file attachment
      if (aiResponse.length > 1900) {
        const buffer = Buffer.from(aiResponse, 'utf-8');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ai-response-${timestamp}.txt`;
        
        return {
          content: "The response its too large, so wee send it as an archive:",
          files: [{
            attachment: buffer,
            name: filename,
            description: "AI Full Response"
          }]
        };
      }

      // Return the AI's response normally if it's short enough
      return {
        content: aiResponse,
      };
    } catch (error) {
      // Log any errors that occur during the AI chat process
      console.error("Error during AI chat:", error);
      // Return an error message to the user
      return {
        content: "An error occurred while processing your request. Please try again later.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
