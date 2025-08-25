# Xeen-Bot - Discord Bot with OpenRouter AI

### **Discord Bot powered by OpenRouter's Kimi AI and GitHub integration**

This is a serverless Discord bot built with Discraft and Vercel!
The bot uses OpenRouter's Kimi Dev AI model for chat functionality and includes GitHub repository browsing.

**Note:** This bot has been customized to use OpenRouter instead of Google AI.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (preferably version 18.x or higher)
- [Vercel CLI](https://vercel.com/cli)
- [Discraft CLI](https://github.com/The-Best-Codes/discraft-js)

## Getting Started

First, create a new directory for your project and navigate to it:

```bash
mkdir my-discraft-project
cd my-discraft-project
```

Now, initialize a new Discraft project, choosing the Vercel template:

```bash
discraft init
? Select a template:
  TypeScript
  JavaScript
❯ Vercel + TypeScript + Google AI
```

This will create a new project with a structure something like this:

```
my-discraft-project/
├── commands/
│   ├── chat.ts (OpenRouter AI chat)
│   ├── ping.ts
│   └── repo.ts (GitHub repositories)
├── public/
│   └── index.html
├── scripts/
│   └── register.ts
├── utils/
│   ├── logger.ts
│   └── types.ts
├── .env.example
├── .gitignore
├── .vercelignore
├── index.ts
├── package.json
├── README.md
├── tsconfig.json
└── vercel.json
```

## Configuring OpenRouter AI

This bot uses OpenRouter's Kimi Dev AI model for enhanced chat interactions. You'll need to create an OpenRouter account and obtain an API key. Here's how to configure it:

1. **Obtain API Key:** Visit [OpenRouter](https://openrouter.ai/) and create an account to get an API key.
2. **Model Used:** The bot uses `moonshotai/kimi-dev-72b:free` which is a free model from OpenRouter.
3. **Environment Variables:** The project relies on several environment variables to function correctly. You will need to set these in your `.env` file locally and in the Vercel project settings.
   - Create a `.env` file in your project's root directory.
   - Add your Discord and OpenRouter credentials.

Here's what you need in your `.env` file:

```env
# You will need to add these secrets to the 'Environment Variables' section of your Vercel project
# https://vercel.com/docs/projects/environment-variables

# Discord Bot Configuration
# From `General Information > Public Key` | https://discord.com/developers/applications
DISCORD_PUBLIC_KEY=''
# From `General Information > App ID` | https://discord.com/developers/applications
DISCORD_APP_ID=''
# From `Bot > Token` | https://discord.com/developers/applications
DISCORD_TOKEN=''

# OpenRouter AI Configuration
# From your OpenRouter account | https://openrouter.ai/
OPENROUTER_API_KEY=''
```

**Important:** _Do not commit the `.env` file to your repository._ It should be added to your `.gitignore` file. This is already done for you in the template.

## Deploying to Vercel

1. **Create a Vercel Project:** If you haven't already, create a new project in your Vercel dashboard.
2. **Set Environment Variables:** In your Vercel project settings, go to "Environment Variables" and add all the variables you configured in your `.env` file (Discord and OpenRouter keys). You can find the project settings [here](https://vercel.com/dashboard).
3. **Run a Discraft Build**: In your project directory, run `npm run build` or `discraft vercel build` to create the API routes and files for your bot.
4. **Deploy:** You can deploy your bot to Vercel by running `npm run deploy` in your project directory.

## Discord Bot Setup

### Create a Discord Application

1. **Create a Discord Application:** Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. **Add a Bot User:** Add a bot user to your application.
3. **Invite the Bot:** Use the 'OAuth2 > URL Generator' section to create an invite link and add your bot to a server. Select the `applications.commands` scope and send this link to a discord server you own so you can see your bot in action.

### Change the Bot's Interactions Endpoint URL

1. **Go to the Bot's Application Page:** Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot's application.
2. **Go to the General Information Tab.**
3. **Set the Interactions Endpoint URL:** In the Interactions Endpoint URL field, enter the URL of your bot's API endpoint. This should be the URL of your Vercel deployment, followed by `/api`.

## Available Commands

This bot comes with the following commands:

- **`/ping`**: Responds with "Pong from Vercel!" to check if the bot is online.
- **`/chat <prompt>`**: Uses OpenRouter's Kimi AI to respond to the given prompt.
- **`/repo`**: Shows all GitHub repositories of Solar2004, sorted by stars and recent activity.

## Get Help & See Demos

Need some assistance or want to see the bot in action? Join our Discord community!
[Discraft Support Discord](https://discord.gg/86qMjn4RHQ)

## Contribute

If you have ideas for the bot, or find any issues, you can create a pull request or issue on our github here:
https://github.com/The-Best-Codes/discraft-js
