# Setting up Telegram Bot Notifications for CI/CD

This guide will help you set up Telegram notifications for your CI/CD workflow.

## 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to name your bot and create a username for it
4. BotFather will provide you with a bot token like this: `123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ`
5. Save this token as you'll need it later

## 2. Get Your Chat ID

1. Search for your new bot in Telegram and start a chat with it
2. Send any message to the bot (it won't reply, that's normal)
3. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser 
   (replace `<YOUR_BOT_TOKEN>` with your actual token)
4. Look for the "chat" object in the JSON response, which contains an "id" field (IF NOT CHAT FOUND, YOU SHOULD START THE CHAT TO BOT)
   Example: `"chat":{"id":123456789,"first_name":"Your","last_name":"Name"}`
5. The number (like `123456789`) is your chat ID

## 3. Set Up GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:
   - `TELEGRAM_TOKEN`: Your bot token from step 1
   - `TELEGRAM_TO`: Your chat ID from step 2

## 4. Testing the Setup

After adding these secrets and committing the changes to the workflow file, the next push to the main branch should trigger a notification in your Telegram chat.

## Troubleshooting

- If you're not receiving messages, ensure your bot token and chat ID are correct
- Verify that you've started a conversation with your bot
- Check the GitHub Actions logs for any errors with the Telegram notification step
