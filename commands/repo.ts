import axios from "axios";
import {
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Command to show GitHub repositories of Solar2004
export default {
  data: {
    name: "repo", // The name of the command
    description: "Show all GitHub repositories of Solar2004", // The description of the command
    options: [],
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

    try {
      // Fetch repositories from GitHub API
      const response = await axios.get("https://api.github.com/users/Solar2004/repos", {
        headers: {
          "User-Agent": "Discord-Bot",
        },
      });

      const repositories = response.data;

      if (!repositories || repositories.length === 0) {
        return {
          content: "No repositories found for user Solar2004.",
          flags: MessageFlags.Ephemeral,
        };
      }

      // Sort repositories by stars (descending) and then by updated date
      const sortedRepos = repositories
        .sort((a: any, b: any) => {
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count;
          }
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .slice(0, 10); // Show only top 10 repositories

      // Format repositories into a nice message
      let repoList = "🚀 **Solar2004's GitHub Repositories**\n\n";
      
      for (const repo of sortedRepos) {
        const name = repo.name;
        const description = repo.description || "No description available";
        const stars = repo.stargazers_count;
        const language = repo.language || "Unknown";
        const url = repo.html_url;
        const isPrivate = repo.private ? "🔒" : "🌍";
        
        repoList += `${isPrivate} **[${name}](${url})**\n`;
        repoList += `📝 ${description}\n`;
        repoList += `⭐ ${stars} stars | 🔤 ${language}\n\n`;
      }

      // Check if the message is too long for Discord
      if (repoList.length > 1900) {
        repoList = repoList.slice(0, 1900) + "\n...[truncated to keep below 2000 characters]";
      }

      return {
        content: repoList,
      };
    } catch (error) {
      console.error("Error fetching repositories:", error);
      
      // Check if it's a 404 error (user not found)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          content: "GitHub user 'Solar2004' not found.",
          flags: MessageFlags.Ephemeral,
        };
      }
      
      // Check if it's a rate limit error
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        return {
          content: "GitHub API rate limit exceeded. Please try again later.",
          flags: MessageFlags.Ephemeral,
        };
      }

      return {
        content: "An error occurred while fetching repositories. Please try again later.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
